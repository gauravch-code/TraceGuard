"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowRight, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Run = { id: string; agent: string; task: string; status: "success" | "review" | "failed"; costMicrousd: number; createdAt: string };
type Review = { decision: string | null };

export function Overview({ onNavigate }: { onNavigate: (view: "Support agent" | "Live runs" | "Review queue") => void }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const [runResponse, reviewResponse] = await Promise.all([fetch("/api/runs", { cache: "no-store" }), fetch("/api/reviews", { cache: "no-store" })]);
      const runData = await runResponse.json() as { runs?: Run[]; error?: string };
      const reviewData = await reviewResponse.json() as { reviews?: Review[]; error?: string };
      if (!runResponse.ok || !runData.runs) throw new Error(runData.error ?? "Could not load runs.");
      if (!reviewResponse.ok || !reviewData.reviews) throw new Error(reviewData.error ?? "Could not load reviews.");
      setRuns(runData.runs);
      setPending(reviewData.reviews.filter((row) => !row.decision).length);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load activity.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(initial); }, [refresh]);
  const succeeded = runs.filter((run) => run.status === "success").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  const cost = runs.reduce((sum, run) => sum + run.costMicrousd, 0) / 1_000_000;
  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">Live activity</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Overview</h1><p className="mt-1 text-sm text-zinc-500">The latest 100 recorded runs. No sample traffic is mixed in.</p></div><Button variant="outline" className="bg-white" onClick={() => void refresh()}><RefreshCw />Refresh</Button></div>
    {error && <p role="alert" className="mb-4 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Recorded runs", value: String(runs.length), detail: "Latest 100", tone: "text-zinc-950" }, { label: "Completed", value: String(succeeded), detail: "Successful execution", tone: "text-emerald-700" }, { label: "Pending review", value: String(pending), detail: "Support drafts", tone: "text-amber-700" }, { label: "Estimated model cost", value: `$${cost.toFixed(4)}`, detail: `${failed} failed runs in sample`, tone: "text-zinc-950" }].map((item) => <section key={item.label} className="metric-card"><p className="text-sm text-zinc-500">{item.label}</p><p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{loading ? "..." : item.value}</p><p className="mt-2 text-xs text-zinc-500">{item.detail}</p></section>)}</div>
    <div className="mt-5 flex flex-wrap gap-2"><Button className="bg-[#101311] hover:bg-[#252a27]" onClick={() => onNavigate("Support agent")}>Run support agent <ArrowRight /></Button><Button variant="outline" className="bg-white" onClick={() => onNavigate("Review queue")}>Open review queue</Button></div>
    <section className="panel mt-5 min-w-0"><div className="flex items-center justify-between border-b border-zinc-200 p-4"><div><h2 className="text-sm font-semibold">Recent runs</h2><p className="mt-1 text-xs text-zinc-500">Newest activity from registered agents</p></div><Button variant="ghost" size="sm" onClick={() => onNavigate("Live runs")}>All runs <ArrowRight /></Button></div>{loading ? <p className="p-8 text-center text-sm text-zinc-500">Loading activity...</p> : runs.length === 0 ? <div className="grid min-h-44 place-items-center p-8 text-center"><div><Activity className="mx-auto size-7 text-zinc-300" /><p className="mt-3 text-sm text-zinc-500">No runs recorded yet.</p></div></div> : <div className="overflow-x-auto"><Table><TableHeader><TableRow className="bg-zinc-50"><TableHead className="pl-5">Agent</TableHead><TableHead>Task</TableHead><TableHead>Status</TableHead><TableHead className="pr-5 text-right">Received</TableHead></TableRow></TableHeader><TableBody>{runs.slice(0, 8).map((run) => <TableRow key={run.id}><TableCell className="pl-5 text-sm font-medium">{run.agent}</TableCell><TableCell className="text-sm">{run.task}</TableCell><TableCell><Badge variant="outline" className="rounded-md capitalize">{run.status}</Badge></TableCell><TableCell className="pr-5 text-right text-xs text-zinc-500">{new Date(`${run.createdAt.replace(" ", "T")}Z`).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></div>}</section>
  </>;
}
