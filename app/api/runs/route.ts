import { desc, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { hashKey, runInput } from "@/app/api/run-contract";
import { getDb } from "@/db";
import { agents, agentKeys, runs } from "@/db/schema";

export async function GET() {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const rows = await getDb().select({ id: runs.id, agentId: runs.agentId, agent: agents.name, model: agents.model, task: runs.task, status: runs.status, durationMs: runs.durationMs, costMicrousd: runs.costUsd, stepsJson: runs.stepsJson, createdAt: runs.createdAt }).from(runs).innerJoin(agents, eq(runs.agentId, agents.id)).orderBy(desc(runs.createdAt), desc(runs.id)).limit(100);
    return Response.json({ runs: rows.map(({ stepsJson, ...run }) => ({ ...run, steps: JSON.parse(stepsJson) })) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("runs.get", error);
    return Response.json({ error: "Runs are temporarily unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const bearer = request.headers.get("Authorization")?.match(/^Bearer (snt_[0-9a-f]{64})$/)?.[1];
  if (!bearer) return Response.json({ error: "Valid agent key required" }, { status: 401 });
  const length = Number(request.headers.get("Content-Length"));
  if (length > 40_000) return Response.json({ error: "Run payload too large" }, { status: 413 });
  let input;
  try {
    const raw = await request.text();
    if (raw.length > 40_000) return Response.json({ error: "Run payload too large" }, { status: 413 });
    input = runInput.parse(JSON.parse(raw));
  } catch {
    return Response.json({ error: "Invalid run payload" }, { status: 400 });
  }
  try {
    const registered = await getDb().select({ agentId: agentKeys.agentId }).from(agentKeys).where(eq(agentKeys.keyHash, await hashKey(bearer))).get();
    if (!registered || registered.agentId !== input.agentId) return Response.json({ error: "Invalid agent key" }, { status: 401 });
    const id = `run_${crypto.randomUUID()}`;
    await getDb().insert(runs).values({ id, agentId: input.agentId, task: input.task, status: input.status, durationMs: input.durationMs, costUsd: Math.round(input.costUsd * 1_000_000), stepsJson: JSON.stringify(input.steps) });
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    console.error("runs.post", error);
    return Response.json({ error: "Could not save run" }, { status: 503 });
  }
}
