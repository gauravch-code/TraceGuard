import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { z } from "zod";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import { agents, runs } from "@/db/schema";
import { runSupportWorkflow, SUPPORT_MODEL, type SupportStep } from "@/lib/support-workflow";
import { consumeSupportRun, DAILY_SUPPORT_LIMIT, remainingSupportRuns } from "@/lib/support-usage";
import { browserWriteError } from "@/app/api/browser-origin";

const AGENT_NAME = "TraceGuard Support Agent";
const requestSchema = z.object({
  question: z.string().trim().min(10).max(600),
  daysSinceDelivery: z.number().int().min(0).max(3650),
  amountUsd: z.number().min(0.01).max(10000),
}).strict();

async function saveRun(status: "success" | "review" | "failed", durationMs: number, costUsd: number, steps: SupportStep[]) {
  const db = getDb();
  await db.insert(agents).values({ name: AGENT_NAME, owner: "TraceGuard", model: SUPPORT_MODEL }).onConflictDoNothing();
  const agent = await db.select({ id: agents.id }).from(agents).where(eq(agents.name, AGENT_NAME)).get();
  if (!agent) throw new Error("Support agent unavailable");
  const id = `run_${crypto.randomUUID()}`;
  await db.insert(runs).values({ id, agentId: agent.id, task: "Draft refund support reply", status, durationMs, costUsd: Math.round(costUsd * 1_000_000), stepsJson: JSON.stringify(steps) });
  return id;
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    return Response.json({ configured: Boolean(env.OPENAI_API_KEY), dailyLimit: DAILY_SUPPORT_LIMIT, remaining: await remainingSupportRuns(user.userId) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("support-agent.quota-get", error);
    return Response.json({ error: "Support usage is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const writeError = browserWriteError(request, true);
  if (writeError) return writeError;
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!env.OPENAI_API_KEY) return Response.json({ error: "The model connection is not configured yet." }, { status: 503 });
  let input: z.infer<typeof requestSchema>;
  try {
    const raw = await request.text();
    if (raw.length > 4000) return Response.json({ error: "Request too large" }, { status: 413 });
    input = requestSchema.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Enter a question, delivery age, and order amount." }, { status: 400 });
  }

  let remaining: number | null;
  try {
    remaining = await consumeSupportRun(user.userId);
  } catch (error) {
    console.error("support-agent.quota-post", error);
    return Response.json({ error: "Support usage is temporarily unavailable." }, { status: 503 });
  }
  if (remaining === null) return Response.json({ error: "Daily run limit reached. Try again tomorrow (UTC).", remaining: 0 }, { status: 429 });

  const started = Date.now();
  const steps: SupportStep[] = [{ kind: "input", title: "Customer question received", detail: `Question: ${input.question}\nFictional order: ${input.daysSinceDelivery} days since delivery, $${input.amountUsd.toFixed(2)}.`, offsetMs: 0 }];
  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0, timeout: 30_000 });
    const result = await runSupportWorkflow(input, client, steps, started);
    const id = await saveRun(result.status, Date.now() - started, result.costUsd, steps);
    return Response.json({ id, draft: result.draft, status: result.status, policy: result.policy, remaining }, { status: 201 });
  } catch (error) {
    console.error("support-agent.post", error);
    steps.push({ kind: "error", title: "Run failed", detail: "The model or trace store could not complete the request.", offsetMs: Date.now() - started });
    try { await saveRun("failed", Date.now() - started, 0, steps); } catch (storageError) { console.error("support-agent.save-failed-run", storageError); }
    return Response.json({ error: "The support agent could not finish this run. No refund action was taken.", remaining }, { status: 502 });
  }
}
