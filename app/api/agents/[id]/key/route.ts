import { eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { createKey, hashKey } from "@/app/api/run-contract";
import { getDb } from "@/db";
import { agents, agentKeys } from "@/db/schema";
import { browserWriteError } from "@/app/api/browser-origin";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const writeError = browserWriteError(request);
  if (writeError) return writeError;
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) return Response.json({ error: "Invalid agent" }, { status: 400 });
  try {
    const agent = await getDb().select({ id: agents.id }).from(agents).where(eq(agents.id, id)).get();
    if (!agent) return Response.json({ error: "Agent not found" }, { status: 404 });
    const key = createKey();
    await getDb().insert(agentKeys).values({ agentId: id, keyHash: await hashKey(key) }).onConflictDoUpdate({ target: agentKeys.agentId, set: { keyHash: await hashKey(key) } });
    return Response.json({ key });
  } catch (error) {
    console.error("agents.key", error);
    return Response.json({ error: "Could not create key" }, { status: 503 });
  }
}
