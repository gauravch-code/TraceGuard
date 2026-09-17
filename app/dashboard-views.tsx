"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight, Bot, Check, CheckCircle2, CircleDollarSign, Code2, Copy,
  FileCheck2, Gauge, GitCompare, KeyRound, Layers3, Play, Plus,
  ShieldAlert, TimerReset, UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveRuns as RealLiveRuns } from "@/app/live-runs";
import { SupportAgent } from "@/app/support-agent";

export type DashboardView = "Overview" | "Support agent" | "Live runs" | "Evaluations" | "Incidents" | "Agents" | "Prompts";

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
    fetch("/api/incidents").then((response) => response.ok ? response.json() as Promise<{ incidents: Array<{ status: string; incidentId: string }> }> : null).then((data) => {
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
  const [issuedKey, setIssuedKey] = useState("");
  const [keyAgentId, setKeyAgentId] = useState<number | null>(null);
  const [customAgents, setCustomAgents] = useState<Array<{ id: number; name: string; owner: string; model: string }>>([]);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("GPT-5.2");
  useEffect(() => {
    fetch("/api/agents").then((response) => response.ok ? response.json() as Promise<{ agents: Array<{ id: number; name: string; owner: string; model: string }> }> : null).then((data) => { if (data?.agents) setCustomAgents(data.agents); }).catch(() => undefined);
  }, []);
  const registeredAgents = customAgents.map((agent) => ({ ...agent, runs: "0", success: 100, latency: "--", status: "Healthy", version: "v1.0.0", icon: Bot, tone: "bg-emerald-50 text-emerald-700" }));
  async function registerAgent() {
    if (!name.trim() || !owner.trim()) { toast.error("Add an agent name and owner team"); return; }
    try {
      const response = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, owner, model }) });
      const data = await response.json() as { agent: { id: number; name: string; owner: string; model: string }; key: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Registration failed");
      setCustomAgents((items) => [data.agent, ...items]);
      setName(""); setOwner(""); setModel("GPT-5.2"); setDialogOpen(false);
      setIssuedKey(data.key); setKeyAgentId(data.agent.id);
      toast.success("Agent registered. Save its key now.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not register the agent"); }
  }
  async function rotateKey(id: number) {
    if (!window.confirm("Create a new key? The previous key will stop working.")) return;
    try {
      const response = await fetch(`/api/agents/${id}/key`, { method: "POST" });
      const data = await response.json() as { key: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not create key");
      setIssuedKey(data.key); setKeyAgentId(id);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not create key"); }
  }
  return <>
    <PageHeading eyebrow="Agent registry" title="Agents" description="Ownership, models, tools, risk posture, and production health in one place." action={<Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button className="bg-[#101311] hover:bg-[#252a27]"><Plus />Register agent</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Register an agent</DialogTitle><DialogDescription>Add a production agent to start receiving traces and evaluations.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div><label className="mb-1.5 block text-sm font-medium">Agent name</label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Claims Copilot" /></div><div><label className="mb-1.5 block text-sm font-medium">Owner team</label><Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="e.g. Operations" /></div><div><label className="mb-1.5 block text-sm font-medium">Default model</label><Select value={model} onValueChange={setModel}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GPT-5.2">GPT-5.2</SelectItem><SelectItem value="Claude Sonnet">Claude Sonnet</SelectItem><SelectItem value="Gemini 2.5 Pro">Gemini 2.5 Pro</SelectItem></SelectContent></Select></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button onClick={registerAgent}><KeyRound />Register & create key</Button></DialogFooter></DialogContent></Dialog>} />
    <div className="mb-4 text-xs text-zinc-500">Registered agents below are real. Example agents and their metrics remain sample data.</div>
    <div className="grid gap-4 md:grid-cols-2">{registeredAgents.map((agent) => <section key={agent.id} className="panel p-5"><div className="flex items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-md ${agent.tone}`}><agent.icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="font-semibold">{agent.name}</h2><p className="text-xs text-zinc-500">{agent.owner} · {agent.model}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4"><span className="text-xs text-zinc-500">Agent ID: {agent.id}</span><Button variant="outline" size="sm" onClick={() => void rotateKey(agent.id)}><KeyRound />Create new key</Button></div></section>)}</div>
    <Dialog open={Boolean(issuedKey)} onOpenChange={(open) => { if (!open) { setIssuedKey(""); setKeyAgentId(null); } }}><DialogContent><DialogHeader><DialogTitle>Agent key created</DialogTitle><DialogDescription>Save this key now. It will not be shown again. Creating a new key invalidates the previous one.</DialogDescription></DialogHeader><div className="space-y-3"><p className="text-sm">Agent ID: <strong>{keyAgentId}</strong></p><code className="block break-all rounded-md bg-zinc-100 p-3 text-xs">{issuedKey}</code><Button variant="outline" onClick={async () => { await navigator.clipboard.writeText(issuedKey); toast.success("Key copied"); }}><Copy />Copy key</Button><p className="text-xs text-zinc-500">Use this as the Bearer token when posting to /api/runs. Keep it out of client code and source control.</p></div></DialogContent></Dialog>
  </>;
}

function Prompts() {
  return <>
    <PageHeading eyebrow="Change control" title="Prompts & versions" description="Track every behavioral change and connect it to quality, cost, and incidents." action={<Button onClick={() => toast.success("Draft v2.9.0 created") } className="bg-[#101311] hover:bg-[#252a27]"><Plus />New version</Button>} />
    <Tabs defaultValue="versions"><TabsList variant="line" className="mb-2"><TabsTrigger value="versions">Versions</TabsTrigger><TabsTrigger value="experiments">A/B tests</TabsTrigger></TabsList><TabsContent value="versions"><div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(420px,1.15fr)]"><section className="panel divide-y divide-zinc-100">{[{v:"v2.8.4",n:"Tighter refund-policy grounding",a:"Maya Chen",t:"2 days ago",live:true},{v:"v2.8.3",n:"Clarify escalation criteria",a:"Jon Bell",t:"6 days ago"},{v:"v2.8.2",n:"Add concise response style",a:"Maya Chen",t:"12 days ago"},{v:"v2.8.1",n:"Tool error recovery",a:"Ari Stone",t:"18 days ago"}].map((p,i) => <button key={p.v} className={`flex w-full items-center gap-3 p-4 text-left ${i===0 ? "bg-[#edf5f1]" : "hover:bg-zinc-50"}`}><span className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-100 font-mono text-xs text-zinc-600"><Code2 /></span><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="text-sm">{p.v}</strong>{p.live && <Badge className="rounded-md bg-[#193d33] text-white">Production</Badge>}</span><span className="mt-1 block truncate text-xs text-zinc-600">{p.n}</span><span className="mt-1 block text-[11px] text-zinc-400">{p.a} · {p.t}</span></span><ArrowRight className="size-4 text-zinc-400" /></button>)}</section><section className="panel self-start"><div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4"><div><h2 className="text-sm font-semibold">Version comparison</h2><p className="mt-0.5 text-xs text-zinc-500">v2.8.4 compared with v2.8.3</p></div><Button variant="outline" size="sm"><GitCompare />Change base</Button></div><div className="p-5"><div className="mb-4 grid gap-3 sm:grid-cols-3"><div className="trace-stat"><span>Task success</span><strong className="text-emerald-700">+2.4%</strong></div><div className="trace-stat"><span>Avg. cost</span><strong className="text-emerald-700">-6.1%</strong></div><div className="trace-stat"><span>p95 latency</span><strong className="text-rose-700">+0.3s</strong></div></div><div className="overflow-hidden rounded-md border border-zinc-200 bg-[#151815] text-sm"><div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-white/50"><span>system-prompt.md</span><Button variant="ghost" size="icon-xs" className="text-white/60 hover:bg-white/10 hover:text-white" aria-label="Copy prompt"><Copy /></Button></div><pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-white/75"><code><span className="text-white/40">12</span> You are a customer support agent.\n<span className="bg-rose-500/15 text-rose-300">- Approve refunds when the request seems reasonable.</span>\n<span className="bg-emerald-500/15 text-emerald-300">+ Verify eligibility against the retrieved refund policy.</span>\n<span className="bg-emerald-500/15 text-emerald-300">+ Escalate when delivery is more than 30 days ago.</span></code></pre></div></div></section></div></TabsContent><TabsContent value="experiments"><section className="panel p-10 text-center"><GitCompare className="mx-auto size-9 text-zinc-300" /><h2 className="mt-3 font-semibold">No active experiment</h2><p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">Compare prompt or model versions on a controlled share of production traffic.</p><Button className="mt-5"><Plus />Create A/B test</Button></section></TabsContent></Tabs>
  </>;
}

export function DashboardViews({ view, onNavigate }: { view: Exclude<DashboardView, "Overview">; onNavigate: (view: DashboardView) => void }) {
  if (view === "Support agent") return <SupportAgent onViewTrace={() => onNavigate("Live runs")} />;
  if (view === "Live runs") return <RealLiveRuns onRegister={() => onNavigate("Agents")} />;
  if (view === "Evaluations") return <Evaluations />;
  if (view === "Incidents") return <Incidents />;
  if (view === "Agents") return <Agents />;
  return <Prompts />;
}
