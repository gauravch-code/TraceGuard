"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TraceStep = { kind: string; title: string; detail: string; offsetMs: number };
type StoredRun = { id: string; agentId: number; agent: string; model: string; task: string; status: "success" | "review" | "failed"; durationMs: number; costMicrousd: number; steps: TraceStep[]; createdAt: string };

function statusTone(status: StoredRun["status"]) {
  return status === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : status === "review" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-rose-200 bg-rose-50 text-rose-700";
}

export function LiveRuns({ onRegister }: { onRegister: () => void }) {
  const [runs, setRuns] = useState<StoredRun[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [agent, setAgent] = useState("all");
  const [selected, setSelected] = useState<StoredRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/runs", { cache: "no-store" });
      const data = await response.json() as { runs: StoredRun[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not load runs");
      setRuns(data.runs);
      setSelected((current) => current ? data.runs.find((run: StoredRun) => run.id === current.id) ?? current : null);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load runs");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 8000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);
  const filtered = useMemo(() => runs.filter((run) => {
    const matchesQuery = `${run.id} ${run.agent} ${run.task}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "all" || run.status === status) && (agent === "all" || String(run.agentId) === agent);
  }), [runs, query, status, agent]);
  const agents = Array.from(new Map(runs.map((run) => [run.agentId, run.agent])).entries());
  const success = runs.filter((run) => run.status === "success").length;
  const review = runs.filter((run) => run.status === "review").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">Observability</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Live runs</h1><p className="mt-1 text-sm text-zinc-500">Real runs received from registered agents. Updates every 8 seconds.</p></div><Button variant="outline" className="bg-white" onClick={() => void refresh()}><RefreshCw />Refresh</Button></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Received", value: runs.length }, { label: "Successful", value: success }, { label: "Needs review", value: review }, { label: "Failed", value: failed }].map((item) => <section className="metric-card" key={item.label}><p className="text-sm text-zinc-500">{item.label}</p><p className="mt-2 text-2xl font-semibold text-zinc-950">{item.value}</p><p className="mt-3 text-xs text-zinc-500">Most recent 100 runs</p></section>)}</div>
    <section className="panel min-w-0"><div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="bg-white pl-9" placeholder="Search run, agent, or task" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full bg-white md:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="success">Successful</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select><Select value={agent} onValueChange={setAgent}><SelectTrigger className="w-full bg-white md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All agents</SelectItem>{agents.map(([id, name]) => <SelectItem value={String(id)} key={id}>{name}</SelectItem>)}</SelectContent></Select></div>
      {error ? <div className="p-8 text-center text-sm text-rose-700">{error} <Button variant="outline" className="ml-2" onClick={() => void refresh()}>Retry</Button></div> : loading ? <div className="p-8 text-center text-sm text-zinc-500">Loading runs...</div> : runs.length === 0 ? <div className="grid min-h-64 place-items-center p-8 text-center"><div><Activity className="mx-auto size-8 text-zinc-300" /><h2 className="mt-3 font-semibold">No runs received yet</h2><p className="mt-1 text-sm text-zinc-500">Register an agent, send its first run, and it will appear here.</p><Button className="mt-5 bg-[#101311] hover:bg-[#252a27]" onClick={onRegister}>Register agent <ArrowRight /></Button></div></div> : <><div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-zinc-50"><TableHead className="pl-5">Run</TableHead><TableHead>Agent / task</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead><TableHead>Cost</TableHead><TableHead className="pr-5 text-right">Received</TableHead></TableRow></TableHeader><TableBody>{filtered.map((run) => <TableRow key={run.id} className="cursor-pointer hover:bg-[#f7faf8]" onClick={() => setSelected(run)}><TableCell className="pl-5 font-mono text-xs text-zinc-500">{run.id.slice(0, 12)}...</TableCell><TableCell><p className="text-sm font-medium">{run.agent}</p><p className="text-xs text-zinc-500">{run.task}</p></TableCell><TableCell><Badge variant="outline" className={`rounded-md capitalize ${statusTone(run.status)}`}>{run.status}</Badge></TableCell><TableCell className="text-xs">{(run.durationMs / 1000).toFixed(2)}s</TableCell><TableCell className="text-xs">${(run.costMicrousd / 1_000_000).toFixed(4)}</TableCell><TableCell className="pr-5 text-right text-xs text-zinc-500">{new Date(`${run.createdAt.replace(" ", "T")}Z`).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></div>{filtered.length === 0 && <p className="p-8 text-center text-sm text-zinc-500">No runs match these filters.</p>}</>}
    </section>
    <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}><SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">{selected && <><SheetHeader className="border-b border-zinc-200 p-5 pr-12"><Badge variant="outline" className={`w-fit rounded-md capitalize ${statusTone(selected.status)}`}>{selected.status}</Badge><SheetTitle className="break-words text-xl">{selected.task}</SheetTitle><SheetDescription>{selected.agent} · {selected.model}</SheetDescription><p className="break-all font-mono text-xs text-zinc-400">{selected.id}</p></SheetHeader><div className="p-5"><div className="mb-6 grid grid-cols-3 gap-2"><div className="trace-stat"><span>Duration</span><strong>{(selected.durationMs / 1000).toFixed(2)}s</strong></div><div className="trace-stat"><span>Cost</span><strong>${(selected.costMicrousd / 1_000_000).toFixed(4)}</strong></div><div className="trace-stat"><span>Steps</span><strong>{selected.steps.length}</strong></div></div><h3 className="mb-3 text-sm font-semibold">Execution trace</h3><div className="space-y-0">{selected.steps.map((step, index) => <div className="trace-line" key={`${index}-${step.title}`}><span className="trace-icon bg-teal-50 text-teal-700"><Activity className="size-4" /></span><div className="min-w-0"><p className="trace-title break-words">{step.title}</p><p className="trace-copy whitespace-pre-wrap break-words">{step.detail}</p><p className="mt-1 text-[11px] uppercase text-zinc-400">{step.kind}</p></div><span className="trace-time">{step.offsetMs}ms</span></div>)}</div></div></>}</SheetContent></Sheet>
  </>;
}
