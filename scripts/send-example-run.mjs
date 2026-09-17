const endpoint = process.env.SENTINEL_URL;
const key = process.env.SENTINEL_AGENT_KEY;
const agentId = Number(process.env.SENTINEL_AGENT_ID);

if (!endpoint || !key || !Number.isSafeInteger(agentId) || agentId < 1) {
  console.error("Set SENTINEL_URL, SENTINEL_AGENT_ID, and SENTINEL_AGENT_KEY first.");
  process.exit(1);
}

const payload = {
  agentId,
  task: "Example: check refund eligibility",
  status: "review",
  durationMs: 812,
  costUsd: 0.0021,
  steps: [
    { kind: "input", title: "Request received", detail: "Customer asks whether an order is eligible for a refund.", offsetMs: 0 },
    { kind: "tool", title: "Policy lookup", detail: "Example policy says refunds are available within 30 days.", offsetMs: 172 },
    { kind: "policy", title: "Human review requested", detail: "Example order is outside the 30-day window.", offsetMs: 650 },
  ],
};

const response = await fetch(new URL("/api/runs", endpoint), {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
  body: JSON.stringify(payload),
});
const result = await response.json();
if (!response.ok) {
  console.error(`HTTP ${response.status}: ${result.error ?? "Unknown error"}`);
  process.exit(1);
}
console.log(`Sent example run: ${result.id}`);
