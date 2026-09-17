"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, RefreshCw, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Step = { kind: string; title: string; detail: string; offsetMs: number };
type ReviewRun = {
  id: string; status: "success" | "review"; createdAt: string; steps: Step[];
  decision: "approved_draft" | "changes_requested" | null;
  note: string | null; reviewerEmail: string | null; reviewedAt: string | null;
};

function displayTime(value: string) {
  return new Date(`${value.replace(" ", "T")}Z`).toLocaleString();
}

export function ReviewQueue() {
  const [rows, setRows] = useState<ReviewRun[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState("pending");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/reviews", { cache: "no-store" });
      const data = await response.json() as { reviews?: ReviewRun[]; error?: string };
      if (!response.ok || !data.reviews) throw new Error(data.error ?? "Could not load reviews.");
      setRows(data.reviews);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load reviews.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(initial); }, [refresh]);
  const pending = rows.filter((row) => !row.decision);
  const reviewed = rows.filter((row) => Boolean(row.decision));
  const visible = tab === "pending" ? pending : reviewed;
  const selected = useMemo(() => visible.find((row) => row.id === selectedId) ?? visible[0] ?? null, [visible, selectedId]);

  async function decide(decision: "approved_draft" | "changes_requested") {
    if (!selected) return;
    if (decision === "changes_requested" && !note.trim()) { setError("Add a reason before requesting changes."); return; }
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId: selected.id, decision, note: note.trim() }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not save review.");
      setNote("");
      setSelectedId(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save review.");
    } finally {
      setWorking(false);
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">Human oversight</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Review queue</h1><p className="mt-1 text-sm text-zinc-500">Approve a draft or request changes. Nothing is sent to a customer.</p></div><Button variant="outline" className="bg-white" onClick={() => void refresh()}><RefreshCw />Refresh</Button></div>
    <div className="mb-4 grid gap-3 sm:grid-cols-3">{[{ label: "Pending", value: pending.length }, { label: "Approved drafts", value: reviewed.filter((row) => row.decision === "approved_draft").length }, { label: "Changes requested", value: reviewed.filter((row) => row.decision === "changes_requested").length }].map((item) => <section className="metric-card" key={item.label}><p className="text-sm text-zinc-500">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p><p className="mt-2 text-xs text-zinc-500">Recent support runs</p></section>)}</div>
    <Tabs value={tab} onValueChange={(value) => { setTab(value); setSelectedId(null); setNote(""); }} className="mb-3"><TabsList variant="line"><TabsTrigger value="pending">Pending</TabsTrigger><TabsTrigger value="reviewed">Reviewed</TabsTrigger></TabsList></Tabs>
    {error && <p role="alert" className="mb-3 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}
    {loading ? <p className="py-12 text-center text-sm text-zinc-500">Loading reviews...</p> : <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(270px,0.7fr)_minmax(0,1.3fr)]">
      <section className="panel min-w-0 divide-y divide-zinc-100" aria-label={`${tab} support runs`}>{visible.length ? visible.map((row) => <button key={row.id} onClick={() => { setSelectedId(row.id); setNote(""); setError(""); }} className={`w-full p-4 text-left hover:bg-zinc-50 ${selected?.id === row.id ? "bg-[#edf5f1]" : ""}`}><div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-xs text-zinc-500">{row.id.slice(0, 17)}</span><Badge variant="outline" className={`rounded-md ${row.status === "review" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{row.status === "review" ? "Outside window" : "Within window"}</Badge></div><p className="mt-2 line-clamp-2 text-sm font-medium">{row.steps.find((step) => step.kind === "input")?.detail.split("\n")[0] ?? "Support request"}</p><p className="mt-2 text-xs text-zinc-500">{displayTime(row.createdAt)}</p></button>) : <p className="p-8 text-center text-sm text-zinc-500">{tab === "pending" ? "No drafts waiting for review." : "No reviews recorded yet."}</p>}</section>
      {selected && <section className="panel min-w-0 p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-medium uppercase text-zinc-500">Support draft</p><h2 className="mt-1 break-all font-mono text-sm font-semibold">{selected.id}</h2></div>{selected.decision && <Badge variant="outline" className="rounded-md">{selected.decision === "approved_draft" ? "Draft approved" : "Changes requested"}</Badge>}</div><div className="mt-5 border-t border-zinc-100 pt-4"><h3 className="text-sm font-semibold">Customer question and order facts</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{selected.steps.find((step) => step.kind === "input")?.detail ?? "Input unavailable"}</p></div><div className="mt-5 border-t border-zinc-100 pt-4"><h3 className="text-sm font-semibold">Policy check</h3><p className="mt-2 text-sm leading-6 text-zinc-700">{selected.steps.find((step) => step.kind === "tool")?.detail ?? "Policy check unavailable"}</p></div><div className="mt-5 border-t border-zinc-100 pt-4"><h3 className="text-sm font-semibold">Draft reply</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{selected.steps.find((step) => step.kind === "output")?.detail ?? "Draft unavailable"}</p></div>{selected.decision ? <div className="mt-5 border-t border-zinc-100 pt-4 text-sm"><p className="font-medium">Reviewed by {selected.reviewerEmail}</p><p className="mt-1 text-zinc-500">{selected.reviewedAt ? displayTime(selected.reviewedAt) : ""}</p>{selected.note && <p className="mt-3 whitespace-pre-wrap break-words text-zinc-700">{selected.note}</p>}</div> : <div className="mt-5 border-t border-zinc-100 pt-4"><label htmlFor="review-note" className="mb-1.5 block text-sm font-medium">Review note</label><Textarea id="review-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="Required when requesting changes" className="bg-white" /><div className="mt-3 flex flex-wrap gap-2"><Button disabled={working} className="bg-[#101311] hover:bg-[#252a27]" onClick={() => void decide("approved_draft")}><Check />Approve draft</Button><Button disabled={working} variant="outline" onClick={() => void decide("changes_requested")}><RotateCcw />Request changes</Button></div><p className="mt-3 text-xs text-zinc-500">This records a review decision only. It does not send the reply or issue a refund.</p></div>}</section>}
    </div>}
  </>;
}
