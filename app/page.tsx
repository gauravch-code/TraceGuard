"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bell, Bot, Box, BrainCircuit, Check, ChevronRight,
  CircleDollarSign, Clock3, Code2, Gauge, GitBranch, LayoutDashboard,
  MoreHorizontal, Play, RefreshCw, Search, Settings, ShieldAlert, Sparkles,
  TerminalSquare, Users, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { DashboardViews, type DashboardView } from "@/app/dashboard-views";

type RunStatus = "success" | "review" | "failed";
type Run = {
  id: string; agent: string; task: string; model: string; status: RunStatus;
  duration: string; cost: string; score: number; time: string;
};

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Live runs", icon: Activity, count: "12" },
  { label: "Evaluations", icon: Gauge },
  { label: "Incidents", icon: ShieldAlert, count: "3" },
  { label: "Agents", icon: Bot },
  { label: "Prompts", icon: GitBranch },
] as const;

const runs: Run[] = [
  { id: "run_8f2a", agent: "Support Copilot", task: "Refund eligibility check", model: "GPT-5.2", status: "review", duration: "4.8s", cost: "$0.042", score: 71, time: "18 sec ago" },
  { id: "run_8f29", agent: "Research Analyst", task: "Competitor pricing brief", model: "Claude Sonnet", status: "success", duration: "12.1s", cost: "$0.128", score: 94, time: "41 sec ago" },
  { id: "run_8f28", agent: "Invoice Processor", task: "Extract vendor line items", model: "GPT-4.1 mini", status: "failed", duration: "2.4s", cost: "$0.011", score: 38, time: "1 min ago" },
  { id: "run_8f27", agent: "Sales Qualifier", task: "Enrich inbound lead", model: "GPT-5.2", status: "success", duration: "6.7s", cost: "$0.057", score: 91, time: "2 min ago" },
  { id: "run_8f26", agent: "Support Copilot", task: "Draft subscription response", model: "GPT-5.2", status: "success", duration: "3.9s", cost: "$0.035", score: 96, time: "3 min ago" },
];

const volume = [42, 51, 46, 63, 58, 71, 67, 82, 75, 88, 83, 91, 78, 86, 96, 89, 99, 92, 84, 95, 89, 76, 82, 74];
const statusStyles: Record<RunStatus, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  review: "border-amber-200 bg-amber-50 text-amber-700",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
};

function MetricCard({ label, value, detail, icon: Icon, tone = "ink" }: {
  label: string; value: string; detail: string; icon: typeof Activity;
  tone?: "ink" | "teal" | "amber" | "rose";
}) {
  const iconTone = {
    ink: "bg-zinc-900 text-white", teal: "bg-teal-100 text-teal-700",
    amber: "bg-amber-100 text-amber-700", rose: "bg-rose-100 text-rose-700",
  }[tone];
  return (
    <section className="metric-card">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-zinc-500">{label}</p><p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p></div>
        <span className={`flex size-9 items-center justify-center rounded-md ${iconTone}`}><Icon className="size-4" /></span>
      </div>
      <p className="mt-4 text-xs text-zinc-500">{detail}</p>
    </section>
  );
}

function StatusBadge({ status }: { status: RunStatus }) {
  const Icon = status === "success" ? Check : status === "review" ? AlertTriangle : XCircle;
  return <Badge variant="outline" className={`rounded-md capitalize ${statusStyles[status]}`}><Icon className="size-3" />{status}</Badge>;
}

function NavigationMenu({ activeView, onChange }: { activeView: DashboardView; onChange: (view: DashboardView) => void }) {
  const { setOpenMobile } = useSidebar();
  return <SidebarMenu className="gap-1">
    {navItems.map((item) => (
      <SidebarMenuItem key={item.label}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarMenuButton
              isActive={activeView === item.label}
              onClick={() => { onChange(item.label); setOpenMobile(false); }}
              className="h-10 text-white/60 hover:bg-white/7 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white"
            >
              <item.icon className="size-4" /><span>{item.label}</span>
              {item.count && <span className="ml-auto rounded bg-white/8 px-1.5 py-0.5 text-[11px] text-white/55">{item.count}</span>}
            </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>;
}

export default function Home() {
  const [selectedRun, setSelectedRun] = useState<Run | null>(null);
  const [range, setRange] = useState("24h");
  const [activeView, setActiveView] = useState<DashboardView>("Overview");
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const successRate = useMemo(() => Math.round((runs.filter((run) => run.status === "success").length / runs.length) * 100), []);

  useEffect(() => {
    type AgentTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    type AgentDocument = Document & { modelContext?: { registerTool: (tool: AgentTool, options?: { signal?: AbortSignal }) => void | Promise<void> } };
    const context = (document as AgentDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const views = navItems.map((item) => item.label);
    const register = (tool: AgentTool) => { void Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); };
    register({
      name: "navigate_agentops",
      title: "Open AgentOps view",
      description: "Navigate the visible Sentinel dashboard to one of its operational views.",
      inputSchema: { type: "object", properties: { view: { type: "string", enum: views } }, required: ["view"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const view = (input as { view?: DashboardView })?.view;
        if (!view || !views.includes(view)) throw new Error("Unknown dashboard view");
        setActiveView(view);
        return { view };
      },
    });
    register({
      name: "stage_production_evaluation",
      title: "Stage production evaluation",
      description: "Open the visible production evaluation dialog without starting the evaluation.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length > 0) throw new Error("This tool does not accept input fields");
        setEvaluationOpen(true);
        return { staged: true, started: false };
      },
    });
    return () => lifecycle.abort();
  }, []);

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <Sidebar collapsible="icon" className="border-r-0 bg-[#101311]">
        <SidebarHeader className="h-16 justify-center border-b border-white/8 px-3">
          <div className="flex items-center gap-3 overflow-hidden px-1">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#8ef0ce] text-[#0b251d] shadow-[inset_0_0_0_1px_rgb(255_255_255/35%)]"><BrainCircuit className="size-[18px]" /></span>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-[15px] font-semibold text-white">Sentinel</p><p className="truncate text-xs text-white/45">Agent operations</p></div>
          </div>
        </SidebarHeader>
        <SidebarContent className="bg-[#101311] px-2 py-4">
          <SidebarGroup className="p-0">
            <SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase text-white/35 group-data-[collapsible=icon]:hidden">Monitor</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavigationMenu activeView={activeView} onChange={setActiveView} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-white/8 bg-[#101311] p-2">
          <SidebarMenu>
            <SidebarMenuItem><SidebarMenuButton className="h-10 text-white/55 hover:bg-white/7 hover:text-white"><Settings /><span>Settings</span></SidebarMenuButton></SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton className="h-11 text-white/70 hover:bg-white/7 hover:text-white">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#d9e0ff] text-xs font-bold text-[#323b68]">AR</span>
                <span className="min-w-0"><span className="block truncate text-sm font-medium">Alex Rivera</span><span className="block truncate text-[11px] text-white/35">Platform team</span></span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-[#f4f5f2]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200/80 bg-white/92 px-4 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="text-zinc-500" /><div className="hidden h-5 w-px bg-zinc-200 sm:block" />
            <div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900">Production workspace</p><p className="hidden text-xs text-zinc-500 sm:block">All systems monitored</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-1 hidden items-center gap-2 text-xs text-zinc-500 lg:flex"><span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgb(16_185_129/12%)]" />Live sync</div>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger size="sm" className="w-[112px] bg-white"><Clock3 className="size-3.5" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="1h">Last hour</SelectItem><SelectItem value="24h">Last 24h</SelectItem><SelectItem value="7d">Last 7 days</SelectItem></SelectContent>
            </Select>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon-sm" aria-label="Search"><Search /></Button></TooltipTrigger><TooltipContent>Search runs</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon-sm" className="relative" aria-label="Notifications"><Bell /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-rose-500" /></Button></TooltipTrigger><TooltipContent>Notifications</TooltipContent></Tooltip>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] p-4 md:p-7">
          {activeView === "Overview" ? <>
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-1 flex items-center gap-2"><p className="text-xs font-medium uppercase text-zinc-500">Operations overview</p><Badge variant="outline" className="rounded-md border-zinc-200 bg-white text-zinc-500">{range === "1h" ? "60 minutes" : range === "7d" ? "7 days" : "24 hours"}</Badge></div>
              <h1 className="text-2xl font-semibold text-zinc-950 md:text-[28px]">Your agents, under control.</h1>
            </div>
            <div className="flex items-center gap-2"><Button variant="outline" className="bg-white" onClick={() => toast.success("Dashboard data refreshed")}><RefreshCw />Refresh</Button><Button className="bg-[#101311] text-white hover:bg-[#252a27]" onClick={() => setEvaluationOpen(true)}><Play />Run evaluation</Button></div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Agent runs" value="18,429" detail="+12.4% from previous period" icon={Activity} />
            <MetricCard label="Success rate" value="96.8%" detail="0.7% above reliability target" icon={Check} tone="teal" />
            <MetricCard label="Needs review" value="37" detail="9 high-priority decisions" icon={ShieldAlert} tone="amber" />
            <MetricCard label="Model spend" value="$842.16" detail="18% below forecast" icon={CircleDollarSign} tone="rose" />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
            <section className="panel min-w-0">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4">
                <div><h2 className="text-[15px] font-semibold text-zinc-900">Run volume & reliability</h2><p className="mt-0.5 text-xs text-zinc-500">Production traffic across all active agents</p></div>
                <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-50 text-emerald-700">{successRate}% sampled success</Badge>
              </div>
              <div className="px-5 pb-5 pt-4">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div><p className="text-xs text-zinc-500">Peak throughput</p><p className="mt-1 text-xl font-semibold text-zinc-950">1,284 <span className="text-sm font-normal text-zinc-500">runs/hr</span></p></div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500"><span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#2e8b7d]" />Runs</span><span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-[#ef8c52]" />Errors</span></div>
                </div>
                <div className="chart-grid flex h-44 items-end gap-1.5 px-1 pt-5" aria-label="Hourly agent run volume chart">
                  {volume.map((height, index) => <div key={index} className="group relative flex h-full min-w-0 flex-1 items-end"><div className="w-full rounded-t-[3px] bg-[#2e8b7d] transition-all duration-200 group-hover:bg-[#1f6e63]" style={{ height: `${height}%` }}>{index % 5 === 0 && <span className="absolute -top-1 left-1/2 hidden -translate-x-1/2 rounded bg-zinc-900 px-1.5 py-1 text-[10px] text-white group-hover:block">{Math.round(height * 12.9)}</span>}</div></div>)}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-zinc-400"><span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>Now</span></div>
              </div>
            </section>

            <section className="panel">
              <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                <div><h2 className="text-[15px] font-semibold text-zinc-900">Open incidents</h2><p className="mt-0.5 text-xs text-zinc-500">3 require attention</p></div>
                <Button variant="ghost" size="sm" className="text-zinc-500" onClick={() => setActiveView("Incidents")}>View all <ChevronRight /></Button>
              </div>
              <div className="divide-y divide-zinc-100">
                <button className="incident-row w-full text-left"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-rose-500" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-zinc-900">PII detected in tool output</span><span className="mt-1 block text-xs text-zinc-500">Support Copilot · 4 affected runs</span></span><Badge variant="outline" className="rounded-md border-rose-200 bg-rose-50 text-rose-700">Critical</Badge></button>
                <button className="incident-row w-full text-left"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-amber-500" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-zinc-900">Tool timeout regression</span><span className="mt-1 block text-xs text-zinc-500">Invoice Processor · 11 failures</span></span><Badge variant="outline" className="rounded-md border-amber-200 bg-amber-50 text-amber-700">High</Badge></button>
                <button className="incident-row w-full text-left"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-sky-500" /><span className="min-w-0 flex-1"><span className="block text-sm font-medium text-zinc-900">Cost threshold exceeded</span><span className="mt-1 block text-xs text-zinc-500">Research Analyst · +22% today</span></span><Badge variant="outline" className="rounded-md border-sky-200 bg-sky-50 text-sky-700">Medium</Badge></button>
              </div>
              <div className="border-t border-zinc-200 bg-zinc-50/70 px-5 py-3"><div className="flex items-center justify-between text-xs"><span className="text-zinc-500">Mean time to resolve</span><span className="font-semibold text-zinc-900">18m 42s</span></div></div>
            </section>
          </div>

          <section className="panel mt-4 min-w-0">
            <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 px-5 py-4 sm:flex-row sm:items-center">
              <div><h2 className="text-[15px] font-semibold text-zinc-900">Live traces</h2><p className="mt-0.5 text-xs text-zinc-500">Recent agent decisions and tool activity</p></div>
              <div className="flex items-center gap-2"><div className="hidden items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500 sm:flex"><span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />Streaming</div><Button variant="outline" size="sm" className="bg-white" onClick={() => setActiveView("Live runs")}>All traces <ChevronRight /></Button></div>
            </div>
            <Table>
              <TableHeader><TableRow className="bg-zinc-50/75 hover:bg-zinc-50/75"><TableHead className="pl-5 text-xs text-zinc-500">Run</TableHead><TableHead className="text-xs text-zinc-500">Agent / task</TableHead><TableHead className="text-xs text-zinc-500">Status</TableHead><TableHead className="text-xs text-zinc-500">Evaluation</TableHead><TableHead className="text-xs text-zinc-500">Latency</TableHead><TableHead className="text-xs text-zinc-500">Cost</TableHead><TableHead className="pr-5 text-right text-xs text-zinc-500">Time</TableHead></TableRow></TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id} className="cursor-pointer bg-white hover:bg-[#f7faf8]" onClick={() => setSelectedRun(run)}>
                    <TableCell className="pl-5 font-mono text-xs text-zinc-500">{run.id}</TableCell>
                    <TableCell><div className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600">{run.agent === "Support Copilot" ? <Users /> : run.agent === "Research Analyst" ? <Sparkles /> : run.agent === "Invoice Processor" ? <Box /> : <Bot />}</span><div><p className="text-sm font-medium text-zinc-900">{run.agent}</p><p className="max-w-56 truncate text-xs text-zinc-500">{run.task}</p></div></div></TableCell>
                    <TableCell><StatusBadge status={run.status} /></TableCell>
                    <TableCell><div className="flex w-24 items-center gap-2"><Progress value={run.score} className="h-1.5 bg-zinc-100 [&_[data-slot=progress-indicator]]:bg-[#2e8b7d]" /><span className="text-xs font-medium text-zinc-600">{run.score}</span></div></TableCell>
                    <TableCell className="text-xs text-zinc-600">{run.duration}</TableCell><TableCell className="text-xs text-zinc-600">{run.cost}</TableCell><TableCell className="pr-5 text-right text-xs text-zinc-500">{run.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
          </> : <DashboardViews view={activeView} />}
        </main>
      </SidebarInset>

      <Sheet open={Boolean(selectedRun)} onOpenChange={(open) => !open && setSelectedRun(null)}>
        <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
          {selectedRun && <>
            <SheetHeader className="border-b border-zinc-200 p-5 pr-12"><div className="mb-2 flex items-center gap-2"><StatusBadge status={selectedRun.status} /><span className="font-mono text-xs text-zinc-400">{selectedRun.id}</span></div><SheetTitle className="text-xl">{selectedRun.task}</SheetTitle><SheetDescription>{selectedRun.agent} · {selectedRun.model} · {selectedRun.duration}</SheetDescription></SheetHeader>
            <div className="space-y-6 p-5">
              <div className="grid grid-cols-3 gap-2"><div className="trace-stat"><span>Score</span><strong>{selectedRun.score}/100</strong></div><div className="trace-stat"><span>Cost</span><strong>{selectedRun.cost}</strong></div><div className="trace-stat"><span>Steps</span><strong>6</strong></div></div>
              <section><h3 className="mb-3 text-sm font-semibold text-zinc-900">Execution trace</h3>
                <div className="trace-line"><span className="trace-icon bg-sky-50 text-sky-700"><TerminalSquare /></span><div><p className="trace-title">Input received</p><p className="trace-copy">Customer requests a refund for order #8842 after delivery.</p></div><span className="trace-time">0ms</span></div>
                <div className="trace-line"><span className="trace-icon bg-violet-50 text-violet-700"><BrainCircuit /></span><div><p className="trace-title">Intent classified</p><p className="trace-copy">refund_request · confidence 0.97</p></div><span className="trace-time">342ms</span></div>
                <div className="trace-line"><span className="trace-icon bg-amber-50 text-amber-700"><Code2 /></span><div><p className="trace-title">Tool: orders.lookup</p><p className="trace-copy">Found fulfilled order, delivered 34 days ago.</p></div><span className="trace-time">1.2s</span></div>
                <div className="trace-line"><span className="trace-icon bg-rose-50 text-rose-700"><ShieldAlert /></span><div><p className="trace-title">Policy evaluator flagged</p><p className="trace-copy">Refund window ambiguity requires human approval.</p></div><span className="trace-time">3.8s</span></div>
              </section>
              <section className="rounded-md border border-amber-200 bg-amber-50 p-4"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" /><div><p className="text-sm font-semibold text-amber-900">Human decision required</p><p className="mt-1 text-sm leading-5 text-amber-800">The agent is ready to issue a $74.99 refund outside the standard 30-day window.</p></div></div></section>
              <div className="flex gap-2"><Button className="flex-1 bg-[#101311] hover:bg-[#252a27]" onClick={() => { toast.success("Action approved and released"); setSelectedRun(null); }}><Check />Approve action</Button><Button variant="outline" className="flex-1" onClick={() => toast.success("Replay started with the current configuration")}><Play />Replay run</Button><Button variant="outline" size="icon" aria-label="More actions"><MoreHorizontal /></Button></div>
            </div>
          </>}
        </SheetContent>
      </Sheet>
      <Dialog open={evaluationOpen} onOpenChange={setEvaluationOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Run production evaluation</DialogTitle><DialogDescription>Test the latest agent versions against your regression suites before promoting changes.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div><label className="mb-1.5 block text-sm font-medium">Agent</label><Select defaultValue="support"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="support">Support Copilot · v2.8.4</SelectItem><SelectItem value="research">Research Analyst · v1.6.2</SelectItem><SelectItem value="invoice">Invoice Processor · v3.1.0</SelectItem></SelectContent></Select></div>
            <div><label className="mb-1.5 block text-sm font-medium">Test suite</label><Select defaultValue="safety"><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="safety">Customer safety regression · 240 cases</SelectItem><SelectItem value="refund">Refund policy compliance · 86 cases</SelectItem><SelectItem value="full">Full production gate · 1,846 cases</SelectItem></SelectContent></Select></div>
            <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">Estimated completion: <strong className="text-zinc-900">4 minutes</strong> · Estimated cost: <strong className="text-zinc-900">$3.42</strong></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEvaluationOpen(false)}>Cancel</Button><Button onClick={() => { setEvaluationOpen(false); toast.success("Evaluation queued for 240 cases"); }}><Play />Start evaluation</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster position="bottom-right" richColors />
    </SidebarProvider>
  );
}
