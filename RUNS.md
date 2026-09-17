# Sending a run to Sentinel

This is the first real telemetry slice. It stores submitted runs and their trace steps in D1. It does not call an LLM, evaluate quality, detect PII, or enforce a policy on your agent.

1. Open **Agents**, register an agent, and save the one-time key and numeric agent ID. For an existing registered agent, use **Create new key** (which invalidates its previous key).
2. Set `SENTINEL_URL`, `SENTINEL_AGENT_ID`, and `SENTINEL_AGENT_KEY` in your shell. Do not commit the key or embed it in browser code.
3. Run `node scripts/send-example-run.mjs` to send a clearly labeled demonstration trace.
4. Open **Live runs**. The row should appear within 8 seconds; select it to inspect the submitted steps.

For local development, run `npm run build`, then apply the two SQL files to the local D1 database in order before registering an agent:

```powershell
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_black_crystal.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_parched_omega_flight.sql
```

Apply each local migration only once. Hosted publishing applies pending migrations separately.

For a real agent, POST JSON to `/api/runs` with `Authorization: Bearer <agent key>` and `Content-Type: application/json`:

```json
{
  "agentId": 1,
  "task": "Answer customer question",
  "status": "success",
  "durationMs": 1200,
  "costUsd": 0.003,
  "steps": [
    { "kind": "input", "title": "Question received", "detail": "Non-sensitive summary", "offsetMs": 0 },
    { "kind": "model", "title": "Answer drafted", "detail": "Short result summary", "offsetMs": 950 },
    { "kind": "output", "title": "Response sent", "detail": "Completed", "offsetMs": 1200 }
  ]
}
```

Allowed step kinds: `input`, `model`, `tool`, `policy`, `output`, `error`. Keep `detail` free of secrets and personal data; this MVP stores it as supplied. The key authenticates ingestion only. Browser read/registration routes require Site sign-in. A private hosted Site may also require a platform-level machine access route before a server outside the signed-in browser can reach `/api/runs`; the agent key alone does not bypass the Site's access policy. Local development can exercise the full API path.
