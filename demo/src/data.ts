export type Step = { kind: "input" | "model" | "tool" | "policy" | "output" | "error"; title: string; detail: string; offset: number };
export type RunStatus = "success" | "review" | "failed";
export type Run = { id: string; agent: string; agentId: string; task: string; model: string; status: RunStatus; duration: number; cost: number; time: string; steps: Step[] };
export type Review = { id: string; runId: string; agent: string; title: string; summary: string; confidence: number; age: string; priority: "high" | "normal"; decision?: "approved" | "changes" };
export type Agent = { id: string; name: string; purpose: string; model: string; version: string; health: "healthy" | "watch"; success: number; runs: number; latency: string; lastSeen: string; color: string };

export const chartData = [
  { time: "09:00", runs: 42, errors: 2 }, { time: "10:00", runs: 57, errors: 1 },
  { time: "11:00", runs: 49, errors: 3 }, { time: "12:00", runs: 71, errors: 2 },
  { time: "13:00", runs: 64, errors: 1 }, { time: "14:00", runs: 86, errors: 4 },
  { time: "15:00", runs: 93, errors: 2 }, { time: "16:00", runs: 81, errors: 1 },
];

const input = (detail: string): Step => ({ kind: "input", title: "Task received", detail, offset: 0 });
const model = (detail: string, offset = 240): Step => ({ kind: "model", title: "Plan generated", detail, offset });
const tool = (title: string, detail: string, offset = 610): Step => ({ kind: "tool", title, detail, offset });
const output = (detail: string, offset = 1220): Step => ({ kind: "output", title: "Result produced", detail, offset });

export const seedRuns: Run[] = [
  { id: "run_7f2a9c81", agentId: "research", agent: "Research Analyst", task: "Compare vector database indexing strategies", model: "gpt-4o-mini", status: "success", duration: 1840, cost: .0042, time: "2 min ago", steps: [input("Compare HNSW and IVF indexing for a 10M document corpus."), model("Planned a source-backed comparison across recall, memory, and query latency."), tool("Search completed", "Collected 8 technical sources and discarded 2 low-authority results."), { kind: "policy", title: "Citation check passed", detail: "All factual claims map to a retrieved source.", offset: 1430 }, output("Delivered a comparison table with a workload-specific recommendation.", 1840)] },
  { id: "run_18c4e520", agentId: "invoice", agent: "Invoice Processor", task: "Extract fields from vendor invoice INV-2048", model: "gpt-4o-mini", status: "review", duration: 920, cost: .0011, time: "8 min ago", steps: [input("Extract vendor, date, subtotal, tax, and total from invoice INV-2048."), tool("Document parsed", "Detected 18 text blocks and one line-item table.", 180), model("Mapped fields to the invoice schema; tax value has lower confidence.", 510), { kind: "policy", title: "Confidence threshold triggered", detail: "Tax confidence 0.71 is below the 0.85 auto-approve threshold.", offset: 760 }, output("Structured invoice created and routed to human review.", 920)] },
  { id: "run_b31d05aa", agentId: "code", agent: "Code Review Agent", task: "Review authentication middleware change", model: "gpt-4.1-mini", status: "success", duration: 3120, cost: .0086, time: "14 min ago", steps: [input("Review pull request #184 for security and regression risks."), tool("Repository context loaded", "Read 6 changed files, 14 tests, and authentication conventions.", 420), model("Analyzed token validation paths and session invalidation behavior.", 1280), tool("Test suite completed", "142 tests passed in 38.4 seconds.", 2740), output("Reported one medium-priority finding with a line-level suggestion.", 3120)] },
  { id: "run_d901bf43", agentId: "support", agent: "Support Copilot", task: "Draft response for delayed shipment", model: "gpt-4o-mini", status: "success", duration: 1260, cost: .0028, time: "21 min ago", steps: [input("Draft a response for a package delayed by four business days."), model("Identified apology, current status, and next-step requirements."), tool("Shipping policy checked", "Delay qualifies for expedited replacement review.", 570), { kind: "policy", title: "Promise guard passed", detail: "Draft does not claim an action was completed.", offset: 970 }, output("Created an empathetic response ready for review.", 1260)] },
  { id: "run_4e220bd7", agentId: "research", agent: "Research Analyst", task: "Summarize quarterly market signals", model: "gpt-4o-mini", status: "failed", duration: 870, cost: .0016, time: "34 min ago", steps: [input("Summarize recent market signals across five specified sources."), model("Created a retrieval plan for each source."), { kind: "tool", title: "Source fetch incomplete", detail: "Two sources returned access-denied responses.", offset: 690 }, { kind: "error", title: "Coverage requirement not met", detail: "Run stopped because fewer than four sources were available.", offset: 870 }] },
  { id: "run_a92ef013", agentId: "invoice", agent: "Invoice Processor", task: "Reconcile purchase order PO-771", model: "gpt-4o-mini", status: "success", duration: 780, cost: .0009, time: "46 min ago", steps: [input("Match invoice line items against purchase order PO-771."), tool("Records matched", "Matched 12 of 12 line items by SKU and quantity.", 260), model("Validated totals and checked tolerance rules.", 490), output("Reconciliation completed with no variance.", 780)] },
];

export const seedReviews: Review[] = [
  { id: "rev_201", runId: "run_18c4e520", agent: "Invoice Processor", title: "Verify extracted tax amount", summary: "The agent extracted $184.20 in tax, but the source region was partially obscured. Confirm against the invoice image before export.", confidence: 71, age: "8 min", priority: "high" },
  { id: "rev_202", runId: "run_aa6204d1", agent: "Support Copilot", title: "Review account credit language", summary: "Draft recommends a courtesy credit. Confirm the customer tier and approval limit before sending.", confidence: 84, age: "18 min", priority: "normal" },
  { id: "rev_203", runId: "run_3ff61090", agent: "Research Analyst", title: "Validate unsupported market claim", summary: "One conclusion relies on a single secondary source. Add a primary source or soften the claim.", confidence: 78, age: "27 min", priority: "normal" },
];

export const agents: Agent[] = [
  { id: "research", name: "Research Analyst", purpose: "Source-backed research and synthesis", model: "gpt-4o-mini", version: "v2.4.1", health: "healthy", success: 98.2, runs: 486, latency: "1.9s", lastSeen: "2 min ago", color: "#397a70" },
  { id: "invoice", name: "Invoice Processor", purpose: "Document extraction and reconciliation", model: "gpt-4o-mini", version: "v1.8.0", health: "healthy", success: 96.4, runs: 392, latency: "0.9s", lastSeen: "8 min ago", color: "#5c6f96" },
  { id: "code", name: "Code Review Agent", purpose: "Repository-aware pull request review", model: "gpt-4.1-mini", version: "v3.1.2", health: "healthy", success: 97.6, runs: 247, latency: "3.2s", lastSeen: "14 min ago", color: "#91693e" },
  { id: "support", name: "Support Copilot", purpose: "Grounded response drafting", model: "gpt-4o-mini", version: "v2.0.6", health: "watch", success: 93.8, runs: 159, latency: "1.3s", lastSeen: "21 min ago", color: "#9b5263" },
];

export const scenarios = [
  { id: "research", label: "Research brief", agent: "Research Analyst", task: "Map the strongest arguments for local-first AI", description: "Retrieval, source ranking, synthesis, and citation validation.", status: "success" as const },
  { id: "invoice", label: "Invoice extraction", agent: "Invoice Processor", task: "Extract and validate invoice INV-3912", description: "Document parsing, schema mapping, and confidence routing.", status: "review" as const },
  { id: "code", label: "Code review", agent: "Code Review Agent", task: "Review a permissions change for regressions", description: "Repository context, test execution, and risk classification.", status: "success" as const },
  { id: "failure", label: "Recovery path", agent: "Research Analyst", task: "Build a brief from unavailable sources", description: "A controlled failure showing traceable recovery behavior.", status: "failed" as const },
];
