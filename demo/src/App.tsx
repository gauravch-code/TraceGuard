import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, BookOpen, Bot, Check, CheckCircle2,
  ChevronRight, CircleDot, ClipboardCheck, Clock3, Code2, Copy, Database,
  ExternalLink, FileSearch, Filter, Gauge, GitFork, KeyRound, LayoutDashboard,
  Menu, MoreHorizontal, Play, RefreshCw, RotateCcw, Search,
  ShieldCheck, Sparkles, Terminal, TestTube2, X, XCircle,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { agents, chartData, scenarios, seedReviews, seedRuns, type Review, type Run, type RunStatus, type Step } from "./data";

type View = "overview" | "lab" | "reviews" | "runs" | "agents";

const navigation = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "lab" as const, label: "Run lab", icon: TestTube2 },
  { id: "reviews" as const, label: "Review queue", icon: ClipboardCheck },
  { id: "runs" as const, label: "Live runs", icon: Activity },
  { id: "agents" as const, label: "Agents", icon: Bot },
];

const viewMeta: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Command center", title: "Overview", description: "Operational health across every connected agent." },
  lab: { eyebrow: "Interactive sandbox", title: "Run lab", description: "Launch a simulated workflow and watch its trace assemble live." },
  reviews: { eyebrow: "Human oversight", title: "Review queue", description: "Resolve agent outputs that crossed a confidence or policy threshold." },
  runs: { eyebrow: "Observability", title: "Live runs", description: "Search, filter, and reconstruct every recorded execution." },
  agents: { eyebrow: "Fleet", title: "Agents", description: "Health, models, versions, and performance in one place." },
};

function statusClass(status: RunStatus) { return `status status-${status}`; }
function statusLabel(status: RunStatus) { return status === "success" ? "Successful" : status === "review" ? "Needs review" : "Failed"; }
function money(value: number) { return `$${value.toFixed(4)}`; }

function StatusBadge({ status }: { status: RunStatus }) {
  return <span className={statusClass(status)}><span />{statusLabel(status)}</span>;
}

function Metric({ label, value, trend, tone, icon: Icon }: { label: string; value: string; trend: string; tone: string; icon: typeof Activity }) {
  return <article className="metric">
    <div className={`metric-icon ${tone}`}><Icon size={17} /></div>
    <p>{label}</p><strong>{value}</strong><span>{trend}</span>
  </article>;
}

function Overview({ runs, pending, go, openRun }: { runs: Run[]; pending: number; go: (v: View) => void; openRun: (run: Run) => void }) {
  return <div className="view-stack">
    <section className="metrics-grid">
      <Metric label="Runs today" value="1,284" trend="12.4% from yesterday" tone="teal" icon={Activity} />
      <Metric label="Success rate" value="96.8%" trend="Within target range" tone="blue" icon={CheckCircle2} />
      <Metric label="Median latency" value="1.42s" trend="180ms faster this week" tone="amber" icon={Gauge} />
      <Metric label="Pending review" value={String(pending)} trend="Oldest item: 27 min" tone="rose" icon={ClipboardCheck} />
    </section>

    <section className="overview-grid">
      <div className="panel chart-panel">
        <div className="panel-heading"><div><h2>Execution volume</h2><p>Runs and errors across the last 8 hours</p></div><button className="quiet-button" onClick={() => go("runs")}>Explore runs <ArrowRight size={15} /></button></div>
        <div className="chart-wrap" aria-label="Execution volume chart">
          <AreaChart responsive style={{ width: "100%", height: "100%", maxWidth: "100%" }} data={chartData} margin={{ top: 14, right: 8, left: -24, bottom: 0 }}>
            <defs><linearGradient id="runFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#397a70" stopOpacity={.26} /><stop offset="100%" stopColor="#397a70" stopOpacity={.015} /></linearGradient></defs>
            <CartesianGrid stroke="#222c25" vertical={false} /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#77857c", fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "#77857c", fontSize: 11 }} />
            <Tooltip contentStyle={{ border: "1px solid #2b3930", borderRadius: 6, color: "#e8f1eb", background: "#131915", boxShadow: "0 12px 34px rgba(0,0,0,.35)", fontSize: 12 }} />
            <Area type="monotone" dataKey="runs" stroke="#397a70" strokeWidth={2.5} fill="url(#runFill)" activeDot={{ r: 4, fill: "#397a70" }} />
          </AreaChart>
        </div>
        <div className="chart-legend"><span><i className="legend-run" />Runs</span><span><i className="legend-error" />21 errors · 1.6%</span></div>
      </div>
      <div className="panel fleet-panel">
        <div className="panel-heading"><div><h2>Agent health</h2><p>Current fleet status</p></div><button className="icon-button" title="Open agents" onClick={() => go("agents")}><ChevronRight size={18} /></button></div>
        <div className="health-list">{agents.map((agent) => <button key={agent.id} onClick={() => go("agents")} className="health-row">
          <span className="agent-avatar" style={{ background: agent.color }}>{agent.name.split(" ").map((x) => x[0]).join("")}</span>
          <span className="health-copy"><strong>{agent.name}</strong><small>{agent.lastSeen}</small></span>
          <span className={agent.health === "healthy" ? "health-good" : "health-watch"}><i />{agent.health === "healthy" ? "Healthy" : "Watch"}</span>
        </button>)}</div>
        <button className="fleet-link" onClick={() => go("agents")}>View fleet details <ArrowRight size={14} /></button>
      </div>
    </section>

    <section className="panel runs-panel">
      <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest executions across the workspace</p></div><button className="secondary-button" onClick={() => go("lab")}><Play size={15} />Simulate run</button></div>
      <div className="table-wrap"><table><thead><tr><th>Agent</th><th>Task</th><th>Status</th><th>Duration</th><th>Cost</th><th>Received</th><th><span className="sr-only">Open</span></th></tr></thead>
        <tbody>{runs.slice(0, 5).map((run) => <tr key={run.id} onClick={() => openRun(run)}><td><span className="table-agent"><i style={{ background: agents.find((a) => a.id === run.agentId)?.color }} />{run.agent}</span></td><td className="task-cell">{run.task}</td><td><StatusBadge status={run.status} /></td><td>{(run.duration / 1000).toFixed(2)}s</td><td>{money(run.cost)}</td><td className="muted-cell">{run.time}</td><td><ChevronRight size={15} /></td></tr>)}</tbody>
      </table></div>
    </section>
  </div>;
}

const simulationSteps: Record<string, Step[]> = {
  research: [
    { kind: "input", title: "Task received", detail: "Map the strongest arguments for local-first AI.", offset: 0 },
    { kind: "model", title: "Research plan created", detail: "Separated privacy, latency, reliability, and cost claims.", offset: 260 },
    { kind: "tool", title: "Sources retrieved", detail: "Ranked 11 sources and retained 7 authoritative references.", offset: 680 },
    { kind: "policy", title: "Citation coverage checked", detail: "Every factual claim is supported by a retained source.", offset: 1180 },
    { kind: "output", title: "Brief completed", detail: "Produced a structured brief with citations and counterarguments.", offset: 1620 },
  ],
  invoice: [
    { kind: "input", title: "Document received", detail: "Invoice INV-3912 queued for extraction.", offset: 0 },
    { kind: "tool", title: "Document parsed", detail: "Detected vendor header, 9 line items, and totals block.", offset: 190 },
    { kind: "model", title: "Fields normalized", detail: "Mapped extracted values to the invoice schema.", offset: 470 },
    { kind: "policy", title: "Confidence threshold triggered", detail: "Purchase-order reference scored 0.78; human verification required.", offset: 720 },
    { kind: "output", title: "Extraction staged", detail: "Structured result sent to the review queue.", offset: 910 },
  ],
  code: [
    { kind: "input", title: "Change set received", detail: "Permissions middleware update with 4 changed files.", offset: 0 },
    { kind: "tool", title: "Repository context loaded", detail: "Read affected modules, tests, and authorization conventions.", offset: 340 },
    { kind: "model", title: "Risk analysis completed", detail: "Traced role propagation and cache invalidation paths.", offset: 940 },
    { kind: "tool", title: "Tests passed", detail: "142 checks passed with no snapshot changes.", offset: 1840 },
    { kind: "output", title: "Review published", detail: "Reported one medium-priority edge case with a suggested patch.", offset: 2320 },
  ],
  failure: [
    { kind: "input", title: "Task received", detail: "Build a source-backed brief from four required domains.", offset: 0 },
    { kind: "model", title: "Retrieval plan created", detail: "Prepared targeted queries for each required domain.", offset: 210 },
    { kind: "tool", title: "Source access degraded", detail: "Three required domains rejected automated access.", offset: 620 },
    { kind: "error", title: "Coverage requirement failed", detail: "Stopped safely rather than producing an under-sourced brief.", offset: 860 },
  ],
};

function RunLab({ addRun, openRun }: { addRun: (run: Run) => void; openRun: (run: Run) => void }) {
  const [scenario, setScenario] = useState(scenarios[0]);
  const [stage, setStage] = useState(-1);
  const [completed, setCompleted] = useState<Run | null>(null);
  const steps = simulationSteps[scenario.id];
  const running = stage >= 0 && stage < steps.length;
  function select(next: typeof scenarios[number]) { if (running) return; setScenario(next); setStage(-1); setCompleted(null); }
  function run() {
    if (running) return;
    setCompleted(null); setStage(0);
    let current = 0;
    const timer = window.setInterval(() => {
      current += 1; setStage(current);
      if (current >= steps.length) {
        window.clearInterval(timer);
        const agent = agents.find((item) => item.name === scenario.agent)!;
        const created: Run = { id: `run_demo_${Date.now().toString(36)}`, agent: scenario.agent, agentId: agent.id, task: scenario.task, model: agent.model, status: scenario.status, duration: steps.at(-1)!.offset, cost: scenario.status === "failed" ? .0013 : .0034, time: "just now", steps };
        setCompleted(created); addRun(created);
      }
    }, 620);
  }
  return <div className="lab-layout">
    <section className="scenario-column"><div className="section-label">Choose a scenario</div><div className="scenario-list">{scenarios.map((item) => <button key={item.id} className={item.id === scenario.id ? "scenario active" : "scenario"} onClick={() => select(item)}>
      <span className="scenario-icon">{item.id === "research" ? <FileSearch /> : item.id === "invoice" ? <Database /> : item.id === "code" ? <Code2 /> : <AlertTriangle />}</span>
      <span><strong>{item.label}</strong><small>{item.description}</small></span><CircleDot size={16} />
    </button>)}</div>
      <div className="demo-note"><ShieldCheck size={17} /><div><strong>Safe demo environment</strong><p>Every result is deterministic. No API calls, keys, or external data.</p></div></div>
    </section>
    <section className="run-console panel">
      <div className="console-top"><div><span className="console-agent"><i style={{ background: agents.find((a) => a.name === scenario.agent)?.color }} />{scenario.agent}</span><h2>{scenario.task}</h2><p>{scenario.description}</p></div><button className="primary-button" onClick={run} disabled={running}>{running ? <><RefreshCw className="spin" size={16} />Running</> : <><Play size={16} />Run simulation</>}</button></div>
      <div className="trace-console">
        <div className="trace-header"><span>Execution trace</span><span>{running ? "Streaming" : completed ? statusLabel(completed.status) : "Ready"}</span></div>
        <div className="trace-body">{stage < 0 ? <div className="trace-empty"><Sparkles size={28} /><h3>Ready to observe</h3><p>Start the simulation to watch planning, tools, policies, and outputs arrive in sequence.</p></div> : steps.map((step, index) => <div key={step.title} className={`trace-step ${index < stage ? "done" : index === stage && running ? "current" : index <= stage ? "done" : "waiting"}`}>
          <span className={`step-mark kind-${step.kind}`}>{index < stage || !running && index <= stage ? <Check size={14} /> : index === stage ? <CircleDot size={14} /> : index + 1}</span>
          <div><div className="step-title"><strong>{step.title}</strong><span>{step.offset}ms</span></div><p>{step.detail}</p><small>{step.kind}</small></div>
        </div>)}</div>
      </div>
      {completed && <div className={`run-result result-${completed.status}`}><div>{completed.status === "success" ? <CheckCircle2 /> : completed.status === "review" ? <ClipboardCheck /> : <XCircle />}<span><strong>{statusLabel(completed.status)}</strong><small>{(completed.duration / 1000).toFixed(2)}s · {money(completed.cost)} estimated</small></span></div><button onClick={() => openRun(completed)}>Inspect trace <ArrowRight size={15} /></button></div>}
    </section>
  </div>;
}

function Reviews({ reviews, decide }: { reviews: Review[]; decide: (id: string, decision: "approved" | "changes") => void }) {
  const [filter, setFilter] = useState<"pending" | "resolved">("pending");
  const visible = reviews.filter((review) => filter === "pending" ? !review.decision : Boolean(review.decision));
  return <div className="view-stack">
    <div className="segmented"><button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")}>Pending <span>{reviews.filter((r) => !r.decision).length}</span></button><button className={filter === "resolved" ? "active" : ""} onClick={() => setFilter("resolved")}>Resolved <span>{reviews.filter((r) => r.decision).length}</span></button></div>
    <section className="review-list">{visible.length === 0 ? <div className="empty-state"><CheckCircle2 /><h2>Queue cleared</h2><p>All review items have a decision.</p></div> : visible.map((review) => <article className="review-item" key={review.id}>
      <div className="review-main"><div className="review-meta"><span className={review.priority === "high" ? "priority high" : "priority"}>{review.priority} priority</span><span>{review.agent}</span><span>{review.age} ago</span></div><h2>{review.title}</h2><p>{review.summary}</p><button className="run-reference"><Terminal size={14} />{review.runId}<ChevronRight size={14} /></button></div>
      <aside className="confidence"><div className="confidence-ring" style={{ "--value": `${review.confidence * 3.6}deg` } as React.CSSProperties}><span>{review.confidence}%</span></div><small>Agent confidence</small></aside>
      <div className="review-actions">{review.decision ? <span className={`decision decision-${review.decision}`}>{review.decision === "approved" ? <Check /> : <RotateCcw />}{review.decision === "approved" ? "Approved" : "Changes requested"}</span> : <><button className="secondary-button" onClick={() => decide(review.id, "changes")}><RotateCcw size={15} />Request changes</button><button className="primary-button" onClick={() => decide(review.id, "approved")}><Check size={15} />Approve</button></>}</div>
    </article>)}</section>
  </div>;
}

function Runs({ runs, openRun }: { runs: Run[]; openRun: (run: Run) => void }) {
  const [query, setQuery] = useState(""); const [status, setStatus] = useState("all"); const [agent, setAgent] = useState("all");
  const visible = useMemo(() => runs.filter((run) => `${run.agent} ${run.task} ${run.id}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || run.status === status) && (agent === "all" || run.agentId === agent)), [runs, query, status, agent]);
  return <div className="view-stack">
    <section className="run-stats"><div><span>Received</span><strong>{runs.length + 1278}</strong></div><div><span>Successful</span><strong>1,243</strong></div><div><span>Needs review</span><strong>18</strong></div><div><span>Failed</span><strong>23</strong></div></section>
    <section className="panel runs-panel"><div className="filters"><label className="search-box"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search run, agent, or task" /></label><label><Filter size={15} /><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="success">Successful</option><option value="review">Needs review</option><option value="failed">Failed</option></select></label><label><Bot size={15} /><select value={agent} onChange={(e) => setAgent(e.target.value)}><option value="all">All agents</option>{agents.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label></div>
      <div className="table-wrap"><table><thead><tr><th>Run</th><th>Agent / task</th><th>Status</th><th>Duration</th><th>Cost</th><th>Received</th><th /></tr></thead><tbody>{visible.map((run) => <tr key={run.id} onClick={() => openRun(run)}><td className="mono">{run.id}</td><td><strong className="table-title">{run.agent}</strong><small className="table-subtitle">{run.task}</small></td><td><StatusBadge status={run.status} /></td><td>{(run.duration / 1000).toFixed(2)}s</td><td>{money(run.cost)}</td><td className="muted-cell">{run.time}</td><td><ChevronRight size={15} /></td></tr>)}</tbody></table>{visible.length === 0 && <div className="empty-table">No runs match those filters.</div>}</div>
    </section>
  </div>;
}

function Agents({ connect }: { connect: () => void }) {
  return <div className="view-stack">
    <div className="section-actions"><div className="fleet-summary"><span><i className="health-dot" />4 agents online</span><span>1,284 runs today</span><span>96.8% successful</span></div><button className="primary-button" onClick={connect}><Bot size={16} />Connect agent</button></div>
    <section className="agent-grid">{agents.map((agent) => <article className="agent-card" key={agent.id}><div className="agent-card-top"><span className="agent-avatar large" style={{ background: agent.color }}>{agent.name.split(" ").map((x) => x[0]).join("")}</span><div><h2>{agent.name}</h2><p>{agent.purpose}</p></div><button className="icon-button" title="Agent options"><MoreHorizontal size={18} /></button></div><div className="agent-tags"><span>{agent.model}</span><span>{agent.version}</span><span className={agent.health === "healthy" ? "healthy-tag" : "watch-tag"}><i />{agent.health}</span></div><div className="agent-numbers"><div><span>Success</span><strong>{agent.success}%</strong></div><div><span>Runs</span><strong>{agent.runs}</strong></div><div><span>Median</span><strong>{agent.latency}</strong></div></div><div className="agent-foot"><span>Last run {agent.lastSeen}</span><button>View activity <ArrowRight size={14} /></button></div></article>)}</section>
    <section className="integration-strip"><div className="integration-icon"><Code2 /></div><div><h2>Instrument any agent</h2><p>Send structured run events from Python, TypeScript, or any HTTP client.</p></div><button className="secondary-button" onClick={connect}><Terminal size={15} />View integration</button></section>
  </div>;
}

function TraceDrawer({ run, close }: { run: Run; close: () => void }) {
  return <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="Run trace"><button className="drawer-scrim" onClick={close} aria-label="Close trace" /><aside className="drawer"><header><div><StatusBadge status={run.status} /><h2>{run.task}</h2><p>{run.agent} · {run.model}</p><code>{run.id}</code></div><button className="icon-button" onClick={close} title="Close"><X size={19} /></button></header><div className="drawer-body"><div className="trace-metrics"><div><Clock3 /><span>Duration<strong>{(run.duration / 1000).toFixed(2)}s</strong></span></div><div><BarChart3 /><span>Est. cost<strong>{money(run.cost)}</strong></span></div><div><Activity /><span>Steps<strong>{run.steps.length}</strong></span></div></div><div className="drawer-section-title"><h3>Execution trace</h3><span>Recorded live</span></div><div className="drawer-timeline">{run.steps.map((step) => <div className="drawer-step" key={`${step.title}-${step.offset}`}><span className={`drawer-mark kind-${step.kind}`}>{step.kind === "error" ? <X size={14} /> : step.kind === "tool" ? <Terminal size={14} /> : step.kind === "model" ? <Sparkles size={14} /> : <Check size={14} />}</span><div><div><strong>{step.title}</strong><time>+{step.offset}ms</time></div><p>{step.detail}</p><small>{step.kind}</small></div></div>)}</div></div></aside></div>;
}

function ConnectModal({ close, notify }: { close: () => void; notify: (text: string) => void }) {
  const snippet = `await fetch("https://your-traceguard.app/api/runs", {\n  method: "POST",\n  headers: { Authorization: "Bearer <agent-key>" },\n  body: JSON.stringify({ agentId, task, status, steps })\n});`;
  function copy() { void navigator.clipboard.writeText(snippet); notify("Integration snippet copied"); }
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-scrim" onClick={close} aria-label="Close modal" /><section className="modal"><header><span className="modal-icon"><KeyRound /></span><div><h2>Connect an agent</h2><p>Send your first trace in a few lines.</p></div><button className="icon-button" aria-label="Close integration dialog" onClick={close}><X /></button></header><div className="modal-body"><div className="sdk-tabs"><button className="active">TypeScript</button><button>Python</button><button>cURL</button></div><pre><code>{snippet}</code><button className="copy-button" onClick={copy} title="Copy snippet"><Copy size={15} /></button></pre><div className="modal-note"><ShieldCheck size={16} /><span>Demo only. No endpoint or credential is created here. Clone the repository to connect a real agent.</span></div></div><footer><a href="https://github.com/gauravch-code/TraceGuard" target="_blank" rel="noreferrer" className="secondary-button"><GitFork size={15} />Open repository</a><button className="primary-button" onClick={close}>Done</button></footer></section></div>;
}

function WelcomeGuide({ close, start }: { close: () => void; start: () => void }) {
  return <div className="guide-layer" role="dialog" aria-modal="true" aria-labelledby="guide-title">
    <div className="guide-backdrop" />
    <section className="welcome-guide">
      <div className="guide-copy">
        <span className="guide-kicker"><Sparkles size={14} />Interactive product tour</span>
        <h2 id="guide-title">See what your AI agent actually did.</h2>
        <p>TraceGuard is an operations console for AI agents. It records each run so you can understand the decisions, tools, failures, cost, and human approvals behind the final output.</p>
        <div className="guide-outcomes">
          <div><span><Activity /></span><p><strong>Observe</strong>Reconstruct every execution step.</p></div>
          <div><span><AlertTriangle /></span><p><strong>Investigate</strong>Find the exact point a run failed.</p></div>
          <div><span><ClipboardCheck /></span><p><strong>Control</strong>Route uncertain outputs to people.</p></div>
        </div>
        <div className="guide-actions"><button className="guide-skip" onClick={close}>Explore on my own</button><button className="guide-start" onClick={start}>Start the 90-second tour <ArrowRight size={16} /></button></div>
      </div>
      <div className="guide-visual" aria-label="Example AI agent execution trace">
        <div className="guide-window">
          <div className="guide-window-bar"><span /><span /><span /><small>run_7f2a9c81</small></div>
          <div className="guide-window-head"><div><small>Research Analyst</small><strong>Compare indexing strategies</strong></div><StatusBadge status="success" /></div>
          <div className="guide-trace">
            <div><span><MessageIcon kind="input" /></span><p><strong>Task received</strong><small>Compare HNSW and IVF for 10M documents</small></p><time>0ms</time></div>
            <div><span><MessageIcon kind="model" /></span><p><strong>Plan generated</strong><small>Compare recall, memory, and latency</small></p><time>240ms</time></div>
            <div><span><MessageIcon kind="tool" /></span><p><strong>Sources retrieved</strong><small>8 technical sources ranked</small></p><time>610ms</time></div>
            <div><span><MessageIcon kind="policy" /></span><p><strong>Citation check</strong><small>All claims mapped to a source</small></p><time>1.4s</time></div>
            <div><span><MessageIcon kind="output" /></span><p><strong>Result delivered</strong><small>Recommendation ready for review</small></p><time>1.8s</time></div>
          </div>
          <div className="guide-window-foot"><span>5 steps recorded</span><span>1.84s</span><span>$0.0042</span></div>
        </div>
      </div>
    </section>
  </div>;
}

function MessageIcon({ kind }: { kind: Step["kind"] }) {
  return kind === "model" ? <Sparkles /> : kind === "tool" ? <Terminal /> : kind === "policy" ? <ShieldCheck /> : kind === "output" ? <Check /> : <ArrowRight />;
}

const tourStops: Array<{ view: View; label: string; title: string; copy: string }> = [
  { view: "lab", label: "Run a workflow", title: "Watch an execution unfold", copy: "Choose any scenario and start the simulation. TraceGuard streams the model, tool, policy, and output steps in the order they happened." },
  { view: "runs", label: "Inspect evidence", title: "Reconstruct any run", copy: "Open a row to inspect its complete timeline, latency, model, outcome, and estimated cost. Search and filters help isolate the run you need." },
  { view: "reviews", label: "Add human judgment", title: "Resolve uncertain outputs", copy: "Confidence and policy thresholds route risky work here. Approve it or request changes while preserving the decision trail." },
  { view: "agents", label: "Instrument your fleet", title: "Bring any agent", copy: "TraceGuard is not tied to one use case. Register research, document, coding, support, or custom agents through the ingestion API." },
];

function TourCoach({ step, next, close }: { step: number; next: () => void; close: () => void }) {
  const stop = tourStops[step];
  return <aside className="tour-coach" aria-live="polite">
    <div className="coach-progress"><span>Guided tour</span><div>{tourStops.map((_, index) => <i key={index} className={index <= step ? "active" : ""} />)}</div><button onClick={close} aria-label="Exit guided tour"><X size={15} /></button></div>
    <span className="coach-step">{step + 1} of {tourStops.length} · {stop.label}</span>
    <h2>{stop.title}</h2><p>{stop.copy}</p>
    <div className="coach-actions"><button onClick={close}>Exit tour</button><button onClick={next}>{step === tourStops.length - 1 ? "Finish" : "Next"}<ArrowRight size={14} /></button></div>
  </aside>;
}

export function App() {
  const [view, setView] = useState<View>("overview");
  const [runs, setRuns] = useState(seedRuns);
  const [reviews, setReviews] = useState(seedReviews);
  const [selected, setSelected] = useState<Run | null>(null);
  const [menu, setMenu] = useState(false);
  const [connect, setConnect] = useState(false);
  const [toast, setToast] = useState("");
  const [guideOpen, setGuideOpen] = useState(true);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const pending = reviews.filter((review) => !review.decision).length;
  function notify(text: string) { setToast(text); window.setTimeout(() => setToast(""), 2400); }
  function go(next: View) { setView(next); setMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function addRun(run: Run) { setRuns((current) => [run, ...current.filter((item) => item.id !== run.id)]); notify("Simulation added to live runs"); }
  function decide(id: string, decision: "approved" | "changes") { setReviews((current) => current.map((item) => item.id === id ? { ...item, decision } : item)); notify(decision === "approved" ? "Output approved" : "Changes requested"); }
  function reset() { setRuns(seedRuns); setReviews(seedReviews); setSelected(null); go("overview"); notify("Demo workspace reset"); }
  function startTour() { setGuideOpen(false); setTourStep(0); go(tourStops[0].view); }
  function advanceTour() {
    if (tourStep === null) return;
    if (tourStep === tourStops.length - 1) { setTourStep(null); go("overview"); notify("Tour complete. The workspace is yours."); return; }
    const next = tourStep + 1; setTourStep(next); go(tourStops[next].view);
  }
  const meta = viewMeta[view];
  return <div className="app-shell">
    <aside className={menu ? "sidebar open" : "sidebar"}><div className="brand"><span><ShieldCheck /></span><div><strong>TraceGuard</strong><small>Agent operations</small></div><button className="mobile-close" aria-label="Close navigation" onClick={() => setMenu(false)}><X /></button></div><nav><p>Workspace</p>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "active" : ""} onClick={() => go(id)}><Icon size={17} /><span>{label}</span>{id === "reviews" && pending > 0 && <b>{pending}</b>}</button>)}</nav><div className="sidebar-bottom"><div className="demo-status"><span><i />Demo mode</span><small>No keys · No API calls</small></div><a href="https://github.com/gauravch-code/TraceGuard" target="_blank" rel="noreferrer"><GitFork size={16} /><span>View source</span><ExternalLink size={13} /></a></div></aside>
    {menu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenu(false)} />}
    <main className="main-shell"><header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenu(true)}><Menu /></button><div className="workspace-label"><span className="workspace-mark">TG</span><div><strong>Demo workspace</strong><small>Interactive sample data</small></div></div><div className="top-actions"><button className="guide-button" onClick={() => setGuideOpen(true)}><BookOpen size={15} /><span>How it works</span></button><span className="live-pill"><i />Live simulation</span><button className="icon-button reset-button" title="Reset demo" onClick={reset}><RotateCcw size={17} /></button><a className="github-button" href="https://github.com/gauravch-code/TraceGuard" target="_blank" rel="noreferrer"><GitFork size={16} /><span>GitHub</span></a></div></header>
      <div className="content"><div className="page-heading"><div><p>{meta.eyebrow}</p><h1>{meta.title}</h1><span>{meta.description}</span></div>{view === "overview" && <button className="primary-button" onClick={() => go("lab")}><Play size={16} />Run simulation</button>}</div>
        {view === "overview" && <Overview runs={runs} pending={pending} go={go} openRun={setSelected} />}
        {view === "lab" && <RunLab addRun={addRun} openRun={setSelected} />}
        {view === "reviews" && <Reviews reviews={reviews} decide={decide} />}
        {view === "runs" && <Runs runs={runs} openRun={setSelected} />}
        {view === "agents" && <Agents connect={() => setConnect(true)} />}
      </div>
    </main>
    {selected && <TraceDrawer run={selected} close={() => setSelected(null)} />}
    {connect && <ConnectModal close={() => setConnect(false)} notify={notify} />}
    {guideOpen && <WelcomeGuide close={() => setGuideOpen(false)} start={startTour} />}
    {tourStep !== null && <TourCoach step={tourStep} next={advanceTour} close={() => setTourStep(null)} />}
    {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
  </div>;
}
