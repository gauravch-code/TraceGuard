# TraceGuard

TraceGuard is an agent-operations tool for recording AI-agent runs, inspecting their steps, and reviewing support drafts. Its built-in support agent is a working example: it checks a fictional 30-day refund policy with a deterministic tool, asks an OpenAI model to draft a reply, and stores the trace for human review. Registered external agents can submit their own runs through the ingestion API.

This is a functional pilot, not a production customer-support system. It does **not** read real orders, send messages, or issue refunds. Evaluation, automatic incident detection, retention controls, and tenant isolation are not implemented. Use fictional or non-sensitive data only.

## Clone and run

Requires Node.js 22.13+ and npm on Windows, macOS, or Linux. Each person runs a separate local D1 database and supplies **their own** OpenAI Platform API key; no shared key is included.

```sh
git clone <your-GitHub-repository-URL>
cd <repository-folder>
npm ci
npm run setup:local
```

The setup command creates `.env.local` from `.env.example` only when missing, builds the local Worker, and applies the three database migrations. It can be rerun without erasing an existing database or overwriting a key. Open `.env.local` and set:

```dotenv
OPENAI_API_KEY=your_own_key_here
```

Do not commit or share `.env.local`. The OpenAI API key stays on the server; it is never sent to browser code. Model calls use your account and may incur API charges. Without a key, you can explore run ingestion and traces, but the built-in support agent cannot call the model.

```sh
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). For local development, sign in through [http://localhost:5173/signin-with-chatgpt?return_to=/](http://localhost:5173/signin-with-chatgpt?return_to=/); this is a loopback-only simulated identity. The hosted Site uses real ChatGPT sign-in. If 5173 is occupied, use `npm run dev -- --port 5174` and substitute that port in the links.

## Try it

1. In **Support agent**, enter fictional order details and run a draft. Inspect its policy check, model call, and response in **Live runs**.
2. Open **Review queue** to approve the draft or request changes with a note. Review records a decision; it never sends a reply.
3. In **Agents**, register an external agent. Save its one-time ingestion key and agent ID, then follow [RUNS.md](RUNS.md) to POST a trace. The **Overview** and **Live runs** views reflect stored runs.

The support endpoint has a 20-run daily limit per signed-in user to bound spending. The displayed cost is an estimate, not a billing record.

## Project notes

`app/` holds the UI and API routes, `db/` the D1 schema, `drizzle/` the SQL migrations, and `scripts/` the setup and example sender. `npm run lint` and `npm run build` validate the source. Local database files under `.wrangler/` and all `.env.local` values are ignored by Git.

The checked-in `.openai/hosting.json` identifies this project's existing private Sites deployment. It is not needed for local development beyond the `DB` binding name. Fork owners who publish their **own** Site should replace its `project_id` and configure their own database binding and server-side `OPENAI_API_KEY` secret; cloning does not grant access to the original deployment. This repository currently has no GitHub remote configured, so its owner must create/push a GitHub repository before sharing a clone URL.

See [RUNS.md](RUNS.md) for the ingestion API and the pilot's limitations.
