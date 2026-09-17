"use client";

import { useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Play, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Result = { id: string; draft: string; status: "success" | "review"; remaining: number; policy: { windowDays: number; eligible: boolean; humanReviewRequired: boolean } };

export function SupportAgent({ onViewTrace }: { onViewTrace: () => void }) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [question, setQuestion] = useState("I received my order, but I would like to request a refund. What happens next?");
  const [days, setDays] = useState("34");
  const [amount, setAmount] = useState("74.99");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const initial = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/support-agent", { cache: "no-store" });
        const data = await response.json() as { configured?: boolean; remaining?: number; error?: string };
        setConfigured(response.ok && Boolean(data.configured));
        if (response.ok) setRemaining(data.remaining ?? null);
        else setError(data.error ?? "Support agent is unavailable.");
      } catch { setConfigured(false); }
    }, 0);
    return () => window.clearTimeout(initial);
  }, []);

  async function run() {
    setError("");
    setResult(null);
    setWorking(true);
    try {
      const response = await fetch("/api/support-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, daysSinceDelivery: Number(days), amountUsd: Number(amount) }) });
      const data = await response.json() as Result & { error?: string };
      if (typeof data.remaining === "number") setRemaining(data.remaining);
      if (!response.ok) throw new Error(data.error ?? "The agent could not complete this run.");
      setResult(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The agent could not complete this run.");
    } finally {
      setWorking(false);
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">Test workspace</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Support agent</h1><p className="mt-1 text-sm text-zinc-500">Draft a reply using a sample refund policy, then inspect the recorded run.</p></div><Badge variant="outline" className={`rounded-md ${configured && remaining !== 0 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>{configured === null ? "Checking key" : !configured ? "Key unavailable" : remaining === 0 ? "Daily limit reached" : "Key configured"}</Badge></div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="panel p-5"><div className="mb-5"><h2 className="text-base font-semibold text-zinc-950">New support request</h2><p className="mt-1 text-sm text-zinc-500">Use fictional details only. This test has no access to real orders.</p></div><div className="space-y-4"><div><label htmlFor="support-question" className="mb-1.5 block text-sm font-medium">Customer question</label><Textarea id="support-question" rows={5} maxLength={600} value={question} onChange={(event) => setQuestion(event.target.value)} className="min-h-32 resize-y bg-white" /></div><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="delivery-age" className="mb-1.5 block text-sm font-medium">Days since delivery</label><Input id="delivery-age" type="number" min="0" max="3650" step="1" value={days} onChange={(event) => setDays(event.target.value)} className="bg-white" /></div><div><label htmlFor="order-amount" className="mb-1.5 block text-sm font-medium">Order total (USD)</label><Input id="order-amount" type="number" min="0.01" max="10000" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="bg-white" /></div></div></div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-5"><p className="max-w-sm text-xs text-zinc-500">No refund is issued. {remaining !== null && `${remaining} runs left today (UTC).`}</p><Button className="bg-[#101311] hover:bg-[#252a27]" disabled={working || configured !== true || remaining === 0 || question.trim().length < 10 || !days || !amount} onClick={() => void run()}>{working ? <LoaderCircle className="animate-spin" /> : <Play />} {working ? "Running" : "Run agent"}</Button></div>{error && <p role="alert" className="mt-4 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}</section>
      <section className="panel self-start p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-teal-700" /><h2 className="text-base font-semibold">{result ? "Agent result" : "Sample policy"}</h2></div>{result ? <div className="mt-5"><Badge variant="outline" className={`rounded-md ${result.status === "review" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{result.policy.humanReviewRequired ? "Human review required" : "Within policy window"}</Badge><h3 className="mt-5 text-sm font-semibold">Draft reply</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-700">{result.draft}</p><div className="mt-5 border-t border-zinc-100 pt-4"><Button variant="outline" onClick={onViewTrace}>View run trace <ArrowRight /></Button></div></div> : <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-600"><p>Refund requests within 30 days of delivery are eligible for review under this fictional policy.</p><p>Requests outside that window require a human decision. The agent only drafts a response; it cannot approve or issue a refund.</p></div>}</section>
    </div>
  </>;
}
