import { and, desc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { agents, runs, supportReviews } from "@/db/schema";
import { browserWriteError } from "@/app/api/browser-origin";

const SUPPORT_AGENT = "TraceGuard Support Agent";
const reviewInput = z.object({
  runId: z.string().regex(/^run_[0-9a-f-]{36}$/),
  decision: z.enum(["approved_draft", "changes_requested"]),
  note: z.string().trim().max(500),
}).strict().refine((value) => value.decision !== "changes_requested" || value.note.length > 0, { message: "Add a reason when requesting changes." });

export async function GET() {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const rows = await getDb().select({
      id: runs.id, status: runs.status, createdAt: runs.createdAt, stepsJson: runs.stepsJson,
      decision: supportReviews.decision, note: supportReviews.note,
      reviewerEmail: supportReviews.reviewerEmail, reviewedAt: supportReviews.createdAt,
    }).from(runs).innerJoin(agents, eq(runs.agentId, agents.id))
      .leftJoin(supportReviews, eq(runs.id, supportReviews.runId))
      .where(and(eq(agents.name, SUPPORT_AGENT), ne(runs.status, "failed")))
      .orderBy(desc(runs.createdAt), desc(runs.id)).limit(100);
    return Response.json({ reviews: rows.map(({ stepsJson, ...row }) => ({ ...row, steps: JSON.parse(stepsJson) })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("reviews.get", error);
    return Response.json({ error: "Review queue is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const writeError = browserWriteError(request, true);
  if (writeError) return writeError;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  let input: z.infer<typeof reviewInput>;
  try {
    const raw = await request.text();
    if (raw.length > 1000) return Response.json({ error: "Review note is too long." }, { status: 413 });
    input = reviewInput.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Select a run and provide a valid review decision." }, { status: 400 });
  }
  try {
    const db = getDb();
    const run = await db.select({ id: runs.id }).from(runs).innerJoin(agents, eq(runs.agentId, agents.id))
      .where(and(eq(runs.id, input.runId), eq(agents.name, SUPPORT_AGENT), ne(runs.status, "failed"))).get();
    if (!run) return Response.json({ error: "Reviewable support run not found." }, { status: 404 });
    const [review] = await db.insert(supportReviews).values({
      runId: input.runId, decision: input.decision, note: input.note,
      reviewerId: user.userId, reviewerEmail: user.email,
    }).onConflictDoNothing().returning();
    if (!review) return Response.json({ error: "This run has already been reviewed." }, { status: 409 });
    return Response.json({ review }, { status: 201 });
  } catch (error) {
    console.error("reviews.post", error);
    return Response.json({ error: "Could not save review." }, { status: 503 });
  }
}
