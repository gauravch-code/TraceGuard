"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, Bot, BrainCircuit, Check, CheckCircle2,
  CircleDollarSign, Clock3, Code2, Copy, FileCheck2, Filter, Gauge, GitCompare,
  History, KeyRound, Layers3, Play, Plus, Search, ShieldAlert, Sparkles,
  TimerReset, UserRound, Wrench, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DashboardView = "Overview" | "Live runs" | "Evaluations" | "Incidents" | "Agents" | "Prompts";

const allRuns = [
  ["run_8f2a", "Support Copilot", "Refund eligibility check", "Review", "71", "4.8s", "$0.042", "18 sec ago"],
  ["run_8f29", "Research Analyst", "Competitor pricing brief", "Passed", "94", "12.1s", "$0.128", "41 sec ago"],
  ["run_8f28", "Invoice Processor", "Extract vendor line items", "Failed", "38", "2.4s", "$0.011", "1 min ago"],
  ["run_8f27", "Sales Qualifier", "Enrich inbound lead", "Passed", "91", "6.7s", "$0.057", "2 min ago"],
  ["run_8f26", "Support Copilot", "Draft subscription response", "Passed", "96", "3.9s", "$0.035", "3 min ago"],
  ["run_8f25", "Research Analyst", "Summarize market filings", "Passed", "89", "18.5s", "$0.164", "4 min ago"],
  ["run_8f24", "Sales Qualifier", "Score enterprise opportunity", "Review", "68", "7.1s", "$0.063", "5 min ago"],
  ["run_8f23", "Invoice Processor", "Match purchase order", "Passed", "98", "3.2s", "$0.018", "6 min ago"],
];

const agents = [
  { name: "Support Copilot", owner: "Customer Experience", model: "GPT-5.2", runs: "8,491", success: 97.4, latency: "3.8s", status: "Healthy", version: "v2.8.4", icon: BrainCircuit, tone: "bg-teal-50 text-teal-700" },
  { name: "Research Analyst", owner: "Strategy", model: "Claude Sonnet", runs: "3,208", success: 95.1, latency: "11.6s", status: "Healthy", version: "v1.6.2", icon: Sparkles, tone: "bg-violet-50 text-violet-700" },
  { name: "Invoice Processor", owner: "Finance Ops", model: "GPT-4.1 mini", runs: "4,122", success: 91.8, latency: "2.7s", status: "Degraded", version: "v3.1.0", icon: FileCheck2, tone: "bg-amber-50 text-amber-700" },
  { name: "Sales Qualifier", owner: "Revenue", model: "GPT-5.2", runs: "2,608", success: 96.2, latency: "6.4s", status: "Healthy", version: "v1.9.7", icon: UserRound, tone: "bg-sky-50 text-sky-700" },
];

const incidents = [
  { id: "INC-204", title: "PII detected in tool output", agent: "Support Copilot", severity: "Critical", runs: 4, opened: "12 min ago", owner: "Unassigned", detail: "A customer email address and partial card number were included in a downstream ticket payload. The action was blocked before delivery." },
  { id: "INC-203", title: "Tool timeout regression", agent: "Invoice Processor", severity: "High", runs: 11, opened: "28 min ago", owner: "Maya Chen", detail: "The vendor lookup tool exceeded its 2-second timeout in 18% of sampled runs after the latest deployment." },
  { id: "INC-202", title: "Cost threshold exceeded", agent: "Research Analyst", severity: "Medium", runs: 23, opened: "1 hr ago", owner: "Jon Bell", detail: "Average cost per completed research brief increased 22% due to longer retrieved context and one additional reasoning pass." },
  { id: "INC-201", title: "Citation coverage below target", agent: "Research Analyst", severity: "Low", runs: 7, opened: "3 hr ago", owner: "Ari Stone", detail: "Seven outputs contained claims without a matching retrieved source. No externally published output was affected." },
];

const suiteRows = [
  ["Customer safety regression", "240 cases", "97.8%", "+0.4%", "8 min ago", "Passing"],
  ["Refund policy compliance", "86 cases", "92.1%", "-2.8%", "24 min ago", "Review"],
  ["Invoice extraction accuracy", "1,200 cases", "98.6%", "+0.1%", "2 hr ago", "Passing"],
  ["Research citation quality", "320 cases", "89.4%", "-4.2%", "4 hr ago", "Failing"],
];

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">{eyebrow}</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">{title}</h1><p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p></div>{action}</div>;
}

function ToneBadge({ value }: { value: string }) {
  const tone = value === "Critical" || value === "Failing" || value === "Failed" ? "border-rose-200 bg-rose-50 text-rose-700" : value === "High" || value === "Review" || value === "Degraded" ? "border-amber-200 bg-amber-50 text-amber-700" : value === "Medium" ? "border-sky-200 bg-sky-50 text-sky-700" : "border-emerald-200 bg-emerald-50 text-emerald-700";
  return <Badge variant="outline" className={`rounded-md ${tone}`}>{value}</Badge>;
}

function LiveRuns() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => allRuns.filter((run) => {
    const matchesQuery = `${run[0]} ${run[1]} ${run[2]}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || run[3].toLowerCase() === status);
  }), [query, status]);
  return <>
    <PageHeading eyebrow="Observability" title="Live runs" description="Follow every model decision, tool call, policy check, and outcome as it happens." action={<div className="flex items-center gap-2"><span className="flex h-9 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-700"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />Streaming live</span><Button variant="outline" className="bg-white"><History />Export</Button></div>} />
    <section className="panel min-w-0">
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row md:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} className="bg-white pl-9" placeholder="Search by run, agent, or task" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full bg-white md:w-[160px]"><Filter /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="passed">Passed</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select>
        <Select defaultValue="all"><SelectTrigger className="w-full bg-white md:w-[190px]"><Bot /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All agents</SelectItem><SelectItem value="support">Support Copilot</SelectItem><SelectItem value="research">Research Analyst</SelectItem><SelectItem value="invoice">Invoice Processor</SelectItem></SelectContent></Select>
      </div>
      <Table><TableHeader><TableRow className="bg-zinc-50/80"><TableHead className="pl-5 text-xs text-zinc-500">Run</TableHead><TableHead className="text-xs text-zinc-500">Agent / task</TableHead><TableHead className="text-xs text-zinc-500">Status</TableHead><TableHead className="text-xs text-zinc-500">Score</TableHead><TableHead className="text-xs text-zinc-500">Latency</TableHead><TableHead className="text-xs text-zinc-500">Cost</TableHead><TableHead className="pr-5 text-right text-xs text-zinc-500">Started</TableHead></TableRow></TableHeader><TableBody>
        {filtered.map((run) => <TableRow key={run[0]} className="cursor-pointer hover:bg-[#f7faf8]" onClick={() => toast.info(`Opening ${run[0]} trace`)}><TableCell className="pl-5 font-mono text-xs text-zinc-500">{run[0]}</TableCell><TableCell><p className="text-sm font-medium text-zinc-900">{run[1]}</p><p className="text-xs text-zinc-500">{run[2]}</p></TableCell><TableCell><ToneBadge value={run[3]} /></TableCell><TableCell><div className="flex items-center gap-2"><Progress value={Number(run[4])} className="h-1.5 w-16 bg-zinc-100 [&_[data-slot=progress-indicator]]:bg-[#2e8b7d]" /><span className="text-xs font-medium">{run[4]}</span></div></TableCell><TableCell className="text-xs text-zinc-600">{run[5]}</TableCell><TableCell className="text-xs text-zinc-600">{run[6]}</TableCell><TableCell className="pr-5 text-right text-xs text-zinc-500">{run[7]}</TableCell></TableRow>)}
      </TableBody></Table>
      {filtered.length === 0 && <div className="grid min-h-52 place-items-center p-8 text-center"><div><Search className="mx-auto size-7 text-zinc-300" /><p className="mt-3 text-sm font-medium text-zinc-700">No matching runs</p><p className="mt-1 text-xs text-zinc-500">Try a different search or status.</p></div></div>}
    </section>
  </>;
}

function Evaluations() {
  return <>
    <PageHeading eyebrow="Quality system" title="Evaluations" description="Measure task quality, policy compliance, and regressions before they reach production." action={<Button onClick={() => toast.success("Evaluation queued for 240 cases") } className="bg-[#101311] hover:bg-[#252a27]"><Play />Run evaluation</Button>} />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{l:"Overall quality",v:"94.2%",d:"+1.8% this week",i:Gauge},{l:"Policy compliance",v:"99.1%",d:"4 blocked violations",i:ShieldAlert},{l:"Cases evaluated",v:"12,480",d:"Across 8 suites",i:Layers3},{l:"Evaluation spend",v:"$184.20",d:"$0.014 per case",i:CircleDollarSign}].map(({l,v,d,i:Icon}) => <section key={l} className="metric-card"><div className="flex items-center justify-between"><p className="text-sm font-medium text-zinc-500">{l}</p><Icon className="size-4 text-zinc-400" /></div><p className="mt-3 text-2xl font-semibold text-zinc-950">{v}</p><p className="mt-3 text-xs text-zinc-500">{d}</p></section>)}
    </div>
    <Tabs defaultValue="suites">
      <TabsList variant="line" className="mb-2"><TabsTrigger value="suites">Test suites</TabsTrigger><TabsTrigger value="scorers">Scorers</TabsTrigger></TabsList>
      <TabsContent value="suites"><section className="panel"><div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4"><div><h2 className="text-[15px] font-semibold">Regression suites</h2><p className="mt-0.5 text-xs text-zinc-500">Automated checks against production-ready datasets</p></div><Button variant="outline" size="sm"><Plus />New suite</Button></div><Table><TableHeader><TableRow className="bg-zinc-50/80"><TableHead className="pl-5 text-xs text-zinc-500">Suite</TableHead><TableHead className="text-xs text-zinc-500">Dataset</TableHead><TableHead className="text-xs text-zinc-500">Pass rate</TableHead><TableHead className="text-xs text-zinc-500">Change</TableHead><TableHead className="text-xs text-zinc-500">Last run</TableHead><TableHead className="pr-5 text-right text-xs text-zinc-500">Status</TableHead></TableRow></TableHeader><TableBody>{suiteRows.map((row) => <TableRow key={row[0]}><TableCell className="pl-5"><div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-md bg-zinc-100 text-zinc-600"><FileCheck2 /></span><span className="text-sm font-medium">{row[0]}</span></div></TableCell><TableCell className="text-xs text-zinc-600">{row[1]}</TableCell><TableCell className="font-medium">{row[2]}</TableCell><TableCell className={`text-xs ${row[3].startsWith("-") ? "text-rose-600" : "text-emerald-600"}`}>{row[3]}</TableCell><TableCell className="text-xs text-zinc-500">{row[4]}</TableCell><TableCell className="pr-5 text-right"><ToneBadge value={row[5]} /></TableCell></TableRow>)}</TableBody></Table></section></TabsContent>
      <TabsContent value="scorers"><section className="panel divide-y divide-zinc-100">{[{n:"Groundedness",d:"Checks whether claims are supported by retrieved context",v:true},{n:"Policy compliance",d:"Tests output against business and safety policies",v:true},{n:"PII detection",d:"Finds sensitive data in model and tool output",v:true},{n:"Tone & style",d:"Measures adherence to the approved voice guide",v:false}].map((s) => <div key={s.n} className="flex items-center gap-4 p-5"><span className="grid size-9 place-items-center rounded-md bg-teal-50 text-teal-700"><Gauge /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.n}</p><p className="mt-0.5 text-xs text-zinc-500">{s.d}</p></div><Switch defaultChecked={s.v} aria-label={`Enable ${s.n}`} /></div>)}</section></TabsContent>
    </Tabs>
  </>;
}

function Incidents() {
  const [selected, setSelected] = useState(incidents[0]);
  const [resolved, setResolved] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/incidents").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.incidents) setResolved(data.incidents.filter((item: { status: string }) => item.status === "resolved").map((item: { incidentId: string }) => item.incidentId));
    }).catch(() => undefined);
  }, []);
  async function persistIncident(action: "assign" | "resolve") {
    const response = await fetch("/api/incidents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selected.id, action }) });
    if (!response.ok) throw new Error("Incident update failed");
  }
  const visible = incidents.filter((item) => !resolved.includes(item.id));
  return <>
    <PageHeading eyebrow="Response center" title="Incidents" description="Triage agent failures, assign ownership, and document the path to resolution." action={<Button variant="outline" className="bg-white"><TimerReset />Incident history</Button>} />
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(380px,1.1fr)]">
      <section className="panel divide-y divide-zinc-100">{visible.length ? visible.map((incident) => <button key={incident.id} onClick={() => setSelected(incident)} className={`flex w-full gap-3 p-4 text-left transition-colors ${selected.id === incident.id ? "bg-[#edf5f1]" : "hover:bg-zinc-50"}`}><span className={`mt-1 size-2.5 shrink-0 rounded-full ${incident.severity === "Critical" ? "bg-rose-500" : incident.severity === "High" ? "bg-amber-500" : incident.severity === "Medium" ? "bg-sky-500" : "bg-zinc-400"}`} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="font-mono text-[11px] text-zinc-400">{incident.id}</span><ToneBadge value={incident.severity} /></span><span className="mt-2 block text-sm font-semibold text-zinc-900">{incident.title}</span><span className="mt-1 block text-xs text-zinc-500">{incident.agent} · {incident.runs} runs · {incident.opened}</span></span><ArrowRight className="mt-2 size-4 text-zinc-400" /></button>) : <div className="grid min-h-72 place-items-center p-8 text-center"><div><CheckCircle2 className="mx-auto size-9 text-emerald-600" /><p className="mt-3 font-medium">Queue cleared</p><p className="mt-1 text-sm text-zinc-500">All incidents are resolved.</p></div></div>}</section>
      <section className="panel self-start"><div className="border-b border-zinc-200 p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ToneBadge value={selected.severity} /><span className="font-mono text-xs text-zinc-400">{selected.id}</span></div><span className="text-xs text-zinc-500">Opened {selected.opened}</span></div><h2 className="mt-4 text-xl font-semibold text-zinc-950">{selected.title}</h2><p className="mt-2 text-sm leading-6 text-zinc-600">{selected.detail}</p></div><div className="grid gap-px bg-zinc-200 sm:grid-cols-3"><div className="bg-white p-4"><p className="text-xs text-zinc-500">Affected agent</p><p className="mt-1 text-sm font-medium">{selected.agent}</p></div><div className="bg-white p-4"><p className="text-xs text-zinc-500">Runs affected</p><p className="mt-1 text-sm font-medium">{selected.runs}</p></div><div className="bg-white p-4"><p className="text-xs text-zinc-500">Owner</p><p className="mt-1 text-sm font-medium">{selected.owner}</p></div></div><div className="p-5"><h3 className="text-sm font-semibold">Recommended response</h3><div className="mt-3 space-y-3"><div className="flex gap-3 text-sm text-zinc-600"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold">1</span>Quarantine affected tool payloads and keep the block rule active.</div><div className="flex gap-3 text-sm text-zinc-600"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold">2</span>Replay the four flagged runs against the patched redaction policy.</div><div className="flex gap-3 text-sm text-zinc-600"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-zinc-100 text-xs font-semibold">3</span>Confirm no sensitive data was delivered to downstream systems.</div></div><div className="mt-6 flex gap-2"><Button className="bg-[#101311] hover:bg-[#252a27]" onClick={async () => { try { await persistIncident("assign"); setSelected({ ...selected, owner: "Alex Rivera" }); toast.success(`${selected.id} assigned to you`); } catch { toast.error("Could not assign the incident"); } }}><UserRound />Assign to me</Button><Button variant="outline" onClick={async () => { try { await persistIncident("resolve"); setResolved((items) => [...items, selected.id]); toast.success(`${selected.id} resolved`); } catch { toast.error("Could not resolve the incident"); } }}><Check />Resolve</Button></div></div></section>
    </div>
  </>;
}

function Agents() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState<Array<{ id: number; name: string; owner: string; model: string }>>([]);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("GPT-5.2");
  useEffect(() => {
    fetch("/api/agents").then((response) => response.ok ? response.json() : null).then((data) => { if (data?.agents) setCustomAgents(data.agents); }).catch(() => undefined);
  }, []);
  const registeredAgents = customAgents.map((agent) => ({ ...agent, runs: "0", success: 100, latency: "--", status: "Healthy", version: "v1.0.0", icon: Bot, tone: "bg-emerald-50 text-emerald-700" }));
  async function registerAgent() {
    if (!name.trim() || !owner.trim()) { toast.error("Add an agent name and owner team"); return; }
    try {
      const response = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, owner, model }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Registration failed");
      setCustomAgents((items) => [data.agent, ...items]);
      setName(""); setOwner(""); setModel("GPT-5.2"); setDialogOpen(false);
      toast.success("Agent registered. SDK key created.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not register the agent"); }
  }
  return <>
    <PageHeading eyebrow="Agent registry" title="Agents" description="Ownership, models, tools, risk posture, and production health in one place." action={<Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-[#101311] hover:bg-[#252a27]"><Plus />Register agent</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Register an agent</DialogTitle><DialogDescription>Add a production agent to start receiving traces and evaluations.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div><label className="mb-1.5 block text-sm font-medium">Agent name</label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Claims Copilot" /></div><div><label className="mb-1.5 block text-sm font-medium">Owner team</label><Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="e.g. Operations" /></div><div><label className="mb-1.5 block text-sm font-medium">Default model</label><Select value={model} onValueChange={setModel}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GPT-5.2">GPT-5.2</SelectItem><SelectItem value="Claude Sonnet">Claude Sonnet</SelectItem><SelectItem value="Gemini 2.5 Pro">Gemini 2.5 Pro</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={registerAgent}><KeyRound />Register & create key</Button></DialogFooter></DialogContent></Dialog>} />
    <div className="grid gap-4 md:grid-cols-2">{[...registeredAgents, ...agents].map((agent) => <section key={agent.name} className="panel"><div className="flex items-start gap-4 p-5"><span className={`grid size-10 shrink-0 place-items-center rounded-md ${agent.tone}`}><agent.icon className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-zinc-950">{agent.name}</h2><ToneBadge value={agent.status} /></div><p className="mt-1 text-xs text-zinc-500">{agent.owner} · {agent.model} · {agent.version}</p></div><Button variant="ghost" size="icon-sm" aria-label={`Open ${agent.name}`}><ArrowRight /></Button></div><div className="grid grid-cols-3 gap-px border-y border-zinc-200 bg-zinc-200"><div className="bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Runs</p><p className="mt-1 font-semibold">{agent.runs}</p></div><div className="bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Success</p><p className="mt-1 font-semibold">{agent.success}%</p></div><div className="bg-zinc-50 p-4"><p className="text-xs text-zinc-500">p95 latency</p><p className="mt-1 font-semibold">{agent.latency}</p></div></div><div className="p-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="text-zinc-500">Reliability target</span><span className="font-medium text-zinc-700">{agent.success}% / 95%</span></div><Progress value={agent.success} className="h-1.5 bg-zinc-100 [&_[data-slot=progress-indicator]]:bg-[#2e8b7d]" /><div className="mt-4 flex items-center gap-4 text-xs text-zinc-500"><span className="flex items-center gap-1.5"><Wrench className="size-3.5" />{agent.name === "Support Copilot" ? 7 : 4} tools</span><span className="flex items-center gap-1.5"><Activity className="size-3.5" />{agent.runs === "0" ? "Awaiting first run" : "Seen 18s ago"}</span></div></div></section>)}</div>
  </>;
}

function Prompts() {
  return <>
    <PageHeading eyebrow="Change control" title="Prompts & versions" description="Track every behavioral change and connect it to quality, cost, and incidents." action={<Button onClick={() => toast.success("Draft v2.9.0 created") } className="bg-[#101311] hover:bg-[#252a27]"><Plus />New version</Button>} />
    <Tabs defaultValue="versions"><TabsList variant="line" className="mb-2"><TabsTrigger value="versions">Versions</TabsTrigger><TabsTrigger value="experiments">A/B tests</TabsTrigger></TabsList><TabsContent value="versions"><div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]"><section className="panel divide-y divide-zinc-100">{[{v:"v2.8.4",n:"Tighter refund-policy grounding",a:"Maya Chen",t:"2 days ago",live:true},{v:"v2.8.3",n:"Clarify escalation criteria",a:"Jon Bell",t:"6 days ago"},{v:"v2.8.2",n:"Add concise response style",a:"Maya Chen",t:"12 days ago"},{v:"v2.8.1",n:"Tool error recovery",a:"Ari Stone",t:"18 days ago"}].map((p,i) => <button key={p.v} className={`flex w-full items-center gap-3 p-4 text-left ${i===0 ? "bg-[#edf5f1]" : "hover:bg-zinc-50"}`}><span className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-100 font-mono text-xs text-zinc-600"><Code2 /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="text-sm">{p.v}</strong>{p.live && <Badge className="rounded-md bg-[#193d33] text-white">Production</Badge>}</span><span className="mt-1 block truncate text-xs text-zinc-600">{p.n}</span><span className="mt-1 block text-[11px] text-zinc-400">{p.a} · {p.t}</span></span><ArrowRight className="size-4 text-zinc-400" /></button>)}</section><section className="panel self-start"><div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4"><div><h2 className="text-sm font-semibold">Version comparison</h2><p className="mt-0.5 text-xs text-zinc-500">v2.8.4 compared with v2.8.3</p></div><Button variant="outline" size="sm"><GitCompare />Change base</Button></div><div className="p-5"><div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="trace-stat"><span>Task success</span><strong className="text-emerald-700">+2.4%</strong></div><div className="trace-stat"><span>Avg. cost</span><strong className="text-emerald-700">-6.1%</strong></div><div className="trace-stat"><span>p95 latency</span><strong className="text-rose-700">+0.3s</strong></div></div><div className="overflow-hidden rounded-md border border-zinc-200 bg-[#151815] text-sm"><div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/50"><span>system-prompt.md</span><Button variant="ghost" size="icon-xs" className="text-white/60 hover:bg-white/10 hover:text-white" aria-label="Copy prompt"><Copy /></Button></div><pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-white/75"><code><span className="text-white/40">12</span> You are a customer support agent.\n<span className="bg-rose-500/15 text-rose-300">- Approve refunds when the request seems reasonable.</span>\n<span className="bg-emerald-500/15 text-emerald-300">+ Verify eligibility against the retrieved refund policy.</span>\n<span className="bg-emerald-500/15 text-emerald-300">+ Escalate when delivery is more than 30 days ago.</span></code></pre></div></div></section></div></TabsContent><TabsContent value="experiments"><section className="panel p-10 text-center"><GitCompare className="mx-auto size-9 text-zinc-300" /><h2 className="mt-3 font-semibold">No active experiment</h2><p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">Compare prompt or model versions on a controlled share of production traffic.</p><Button className="mt-5"><Plus />Create A/B test</Button></section></TabsContent></Tabs>
  </>;
}

export function DashboardViews({ view }: { view: Exclude<DashboardView, "Overview"> }) {
  if (view === "Live runs") return <LiveRuns />;
  if (view === "Evaluations") return <Evaluations />;
  if (view === "Incidents") return <Incidents />;
  if (view === "Agents") return <Agents />;
  return <Prompts />;
}
