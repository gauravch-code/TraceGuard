import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { incidentActions } from "@/db/schema";

export async function GET() {
  try {
    const rows = await getDb().select().from(incidentActions);
    return Response.json({ incidents: rows });
  } catch (error) {
    console.error("incidents.get", error);
    return Response.json({ error: "Incident state is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { id?: string; action?: "assign" | "resolve" };
    const id = payload.id?.trim();
    if (!id || !/^INC-\d{3,6}$/.test(id) || !["assign", "resolve"].includes(payload.action ?? "")) {
      return Response.json({ error: "A valid incident id and action are required." }, { status: 400 });
    }
    const values = {
      incidentId: id,
      status: payload.action === "resolve" ? "resolved" : "open",
      owner: "Alex Rivera",
      updatedAt: new Date().toISOString(),
    };
    await getDb().insert(incidentActions).values(values).onConflictDoUpdate({
      target: incidentActions.incidentId,
      set: { status: values.status, owner: values.owner, updatedAt: values.updatedAt },
    });
    const [incident] = await getDb().select().from(incidentActions).where(eq(incidentActions.incidentId, id)).limit(1);
    return Response.json({ incident });
  } catch (error) {
    console.error("incidents.post", error);
    return Response.json({ error: "Could not update the incident." }, { status: 500 });
  }
}
