import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { agents, agentKeys } from "@/db/schema";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { createKey, hashKey } from "@/app/api/run-contract";

export async function GET() {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const rows = await getDb().select().from(agents).orderBy(desc(agents.createdAt), desc(agents.id)).limit(50);
    return Response.json({ agents: rows });
  } catch (error) {
    console.error("agents.get", error);
    return Response.json({ error: "Agent registry is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await getChatGPTUser()) return Response.json({ error: "Sign in required" }, { status: 401 });
  try {
    const payload = await request.json() as { name?: string; owner?: string; model?: string };
    const name = payload.name?.trim();
    const owner = payload.owner?.trim();
    const model = payload.model?.trim();
    if (!name || !owner || !model) return Response.json({ error: "name, owner, and model are required" }, { status: 400 });
    if (name.length > 80 || owner.length > 80 || model.length > 80) return Response.json({ error: "Agent fields must be 80 characters or fewer" }, { status: 400 });
    const [agent] = await getDb().insert(agents).values({ name, owner, model }).returning();
    const key = createKey();
    await getDb().insert(agentKeys).values({ agentId: agent.id, keyHash: await hashKey(key) });
    return Response.json({ agent, key }, { status: 201 });
  } catch (error) {
    console.error("agents.post", error);
    const message = error instanceof Error && error.message.includes("UNIQUE") ? "An agent with that name already exists." : "Could not register the agent.";
    return Response.json({ error: message }, { status: 500 });
  }
}
