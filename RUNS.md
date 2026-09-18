# Sending a run to TraceGuard

The run ingestion API stores submitted runs and their trace steps in D1. The example sender does not call an LLM. The built-in Support agent uses an OpenAI model and a local sample-policy tool when `OPENAI_API_KEY` is configured; it never issues a refund or accesses real orders. The Overview, Review queue, Live runs, and Agents views use stored data. Evaluation and incident detection are not implemented.

1. Open **Agents**, register an agent, and save the one-time key and numeric agent ID. For an existing registered agent, use **New key** (which invalidates its previous key).
2. Set `TRACEGUARD_URL`, `TRACEGUARD_AGENT_ID`, and `TRACEGUARD_AGENT_KEY` in your shell. Do not commit the key or embed it in browser code.
3. Run `node scripts/send-example-run.mjs` to send a clearly labeled demonstration trace.
4. Open **Live runs**. The row should appear within 8 seconds; select it to inspect the submitted steps.

For local development, run `npm run setup:local` once after `npm ci`. It builds the Worker and applies pending SQL migrations idempotently. Hosted publishing applies production migrations separately.

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
    { "kind": "output", "title": "Draft ready", "detail": "Awaiting human review", "offsetMs": 1200 }
  ]
}
```

Allowed step kinds: `input`, `model`, `tool`, `policy`, `output`, `error`. Keep `detail` free of secrets and personal data; this MVP stores it as supplied. The key authenticates ingestion only. Browser read/registration routes require Site sign-in. A private hosted Site may also require a platform-level machine access route before a server outside the signed-in browser can reach `/api/runs`; the agent key alone does not bypass the Site's access policy. Local development can exercise the full API path.

## Built-in support agent

Open **Support agent**, enter fictional order details, and run it. The 30-day refund window is sample data. The model calls `check_refund_policy`, receives the result computed by TraceGuard, and drafts a reply. The question, response, and trace are stored in **Live runs**. The model does not decide eligibility or perform a refund. A guard replaces drafts that appear to claim a completed refund or real order lookup.

Every completed support draft appears in **Review queue**, where a signed-in reviewer can approve the draft or request changes with a note. A review decision is recorded once, with reviewer identity and time; it does not send the reply or issue a refund. The support endpoint allows at most 20 runs per signed-in user per UTC day to bound model spending. Failed model requests count toward that limit.

`OPENAI_API_KEY` must be set as a server-side Site secret (or in ignored `.env.local` for development) before the Run button is enabled. Each clone owner uses their own key. Do not put the key in browser code or this repository. The OpenAI API request uses `store: false`. The displayed cost is an estimate from token usage, not a billing record. The former `SENTINEL_*` example-sender environment variable names still work for compatibility; new setup should use `TRACEGUARD_*`.

This remains a controlled pilot: it has no real order connector, outbound messaging, refund action, automated evaluation, incident detection, retention policy, or multi-tenant authorization. Use fictional data only.
