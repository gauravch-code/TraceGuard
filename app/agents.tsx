"use client";

import { useCallback, useEffect, useState } from "react";
import { Bot, Copy, KeyRound, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Agent = { id: number; name: string; owner: string; model: string; createdAt: string };

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [model, setModel] = useState("gpt-4o-mini");
  const [working, setWorking] = useState(false);
  const [issuedKey, setIssuedKey] = useState("");
  const [keyAgentId, setKeyAgentId] = useState<number | null>(null);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/agents", { cache: "no-store" });
      const data = await response.json() as { agents?: Agent[]; error?: string };
      if (!response.ok || !data.agents) throw new Error(data.error ?? "Could not load agents.");
      setAgents(data.agents);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load agents.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { const initial = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(initial); }, [refresh]);

  async function register() {
    setWorking(true);
    setError("");
    try {
      const response = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, owner, model }) });
      const data = await response.json() as { agent?: Agent; key?: string; error?: string };
      if (!response.ok || !data.agent || !data.key) throw new Error(data.error ?? "Registration failed.");
      setIssuedKey(data.key);
      setKeyAgentId(data.agent.id);
      setDialogOpen(false);
      setName(""); setOwner(""); setModel("gpt-4o-mini");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Registration failed.");
    } finally {
      setWorking(false);
    }
  }

  async function rotateKey(agent: Agent) {
    if (!window.confirm(`Create a new key for ${agent.name}? Its current key will stop working.`)) return;
    try {
      const response = await fetch(`/api/agents/${agent.id}/key`, { method: "POST" });
      const data = await response.json() as { key?: string; error?: string };
      if (!response.ok || !data.key) throw new Error(data.error ?? "Could not create key.");
      setIssuedKey(data.key);
      setKeyAgentId(agent.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create key.");
    }
  }

  return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-xs font-medium uppercase text-zinc-500">Registry</p><h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Agents</h1><p className="mt-1 text-sm text-zinc-500">Registered agents can send runs with their own key.</p></div><div className="flex gap-2"><Button variant="outline" size="icon" className="bg-white" aria-label="Refresh agents" title="Refresh agents" onClick={() => void refresh()}><RefreshCw /></Button><Button className="bg-[#101311] hover:bg-[#252a27]" onClick={() => setDialogOpen(true)}><Plus />Register agent</Button></div></div>
    {error && <p role="alert" className="mb-4 border-l-2 border-rose-500 bg-rose-50 px-3 py-2 text-sm text-rose-900">{error}</p>}
    {loading ? <p className="py-12 text-center text-sm text-zinc-500">Loading agents...</p> : agents.length === 0 ? <section className="panel grid min-h-52 place-items-center p-8 text-center"><div><Bot className="mx-auto size-8 text-zinc-300" /><p className="mt-3 text-sm text-zinc-500">No agents registered yet.</p></div></section> : <div className="grid gap-3 md:grid-cols-2">{agents.map((agent) => <section key={agent.id} className="panel p-5"><div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700"><Bot className="size-5" /></span><div className="min-w-0"><h2 className="truncate font-semibold">{agent.name}</h2><p className="truncate text-xs text-zinc-500">{agent.owner} · {agent.model}</p></div></div><div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4"><span className="text-xs text-zinc-500">Agent ID: {agent.id}</span><Button variant="outline" size="sm" onClick={() => void rotateKey(agent)}><KeyRound />New key</Button></div></section>)}</div>}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Register an agent</DialogTitle><DialogDescription>The model field is a label for traces; TraceGuard does not run the agent for you.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><div><label htmlFor="agent-name" className="mb-1.5 block text-sm font-medium">Agent name</label><Input id="agent-name" maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></div><div><label htmlFor="agent-owner" className="mb-1.5 block text-sm font-medium">Owner team</label><Input id="agent-owner" maxLength={80} value={owner} onChange={(event) => setOwner(event.target.value)} /></div><div><label htmlFor="agent-model" className="mb-1.5 block text-sm font-medium">Model label</label><Input id="agent-model" maxLength={80} value={model} onChange={(event) => setModel(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={working || !name.trim() || !owner.trim() || !model.trim()} onClick={() => void register()}><KeyRound />Register and create key</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={Boolean(issuedKey)} onOpenChange={(open) => { if (!open) { setIssuedKey(""); setKeyAgentId(null); } }}><DialogContent><DialogHeader><DialogTitle>Agent key created</DialogTitle><DialogDescription>Save this key now. It will not be shown again. A new key invalidates the previous one.</DialogDescription></DialogHeader><p className="text-sm">Agent ID: <strong>{keyAgentId}</strong></p><code className="block break-all rounded-md bg-zinc-100 p-3 text-xs">{issuedKey}</code><Button variant="outline" onClick={() => void navigator.clipboard.writeText(issuedKey)}><Copy />Copy key</Button><p className="text-xs text-zinc-500">Use this as a Bearer token when posting to /api/runs. Never put it in client code.</p></DialogContent></Dialog>
  </>;
}
