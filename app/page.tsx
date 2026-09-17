"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, BrainCircuit, ClipboardCheck, LayoutDashboard, MessageSquareText, ShieldCheck } from "lucide-react";
import { Agents } from "@/app/agents";
import { LiveRuns } from "@/app/live-runs";
import { Overview } from "@/app/overview";
import { ReviewQueue } from "@/app/review-queue";
import { SupportAgent } from "@/app/support-agent";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

type View = "Overview" | "Support agent" | "Review queue" | "Live runs" | "Agents";

const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Support agent", icon: MessageSquareText },
  { label: "Review queue", icon: ClipboardCheck },
  { label: "Live runs", icon: Activity },
  { label: "Agents", icon: Bot },
] as const;

function Navigation({ active, onChange }: { active: View; onChange: (view: View) => void }) {
  const { setOpenMobile } = useSidebar();
  return <SidebarMenu className="gap-1">{navItems.map((item) => <SidebarMenuItem key={item.label}><SidebarMenuButton isActive={active === item.label} onClick={() => { onChange(item.label); setOpenMobile(false); }} className="h-10 text-white/60 hover:bg-white/7 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:text-white"><item.icon className="size-4" /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>;
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("Support agent");

  useEffect(() => {
    type AgentTool = { name: string; title: string; description: string; inputSchema: object; annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }; execute: (input: unknown) => unknown };
    type AgentDocument = Document & { modelContext?: { registerTool: (tool: AgentTool, options?: { signal?: AbortSignal }) => void | Promise<void> } };
    const context = (document as AgentDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "navigate_traceguard", title: "Open TraceGuard view", description: "Open one of the live TraceGuard workspace views.",
      inputSchema: { type: "object", properties: { view: { type: "string", enum: navItems.map((item) => item.label) } }, required: ["view"], additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute(input) {
        const view = (input as { view?: View })?.view;
        if (!view || !navItems.some((item) => item.label === view)) throw new Error("Unknown view");
        setActiveView(view);
        return { view };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
    <Sidebar collapsible="icon" className="border-r-0 bg-[#101311]">
      <SidebarHeader className="h-16 justify-center border-b border-white/8 px-3"><div className="flex items-center gap-3 overflow-hidden px-1"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#8ef0ce] text-[#0b251d]"><BrainCircuit className="size-[18px]" /></span><div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-[15px] font-semibold text-white">TraceGuard</p><p className="truncate text-xs text-white/45">Agent operations</p></div></div></SidebarHeader>
      <SidebarContent className="bg-[#101311] px-2 py-4"><SidebarGroup className="p-0"><SidebarGroupLabel className="px-3 text-[11px] font-medium uppercase text-white/35 group-data-[collapsible=icon]:hidden">Workspace</SidebarGroupLabel><SidebarGroupContent><Navigation active={activeView} onChange={setActiveView} /></SidebarGroupContent></SidebarGroup></SidebarContent>
      <SidebarFooter className="border-t border-white/8 bg-[#101311] px-4 py-3"><div className="flex items-center gap-2 text-xs text-white/50 group-data-[collapsible=icon]:hidden"><ShieldCheck className="size-4 text-[#8ef0ce]" />Private workspace</div></SidebarFooter>
    </Sidebar>
    <SidebarInset className="min-w-0 bg-[#f4f5f2]"><header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-zinc-200/80 bg-white/92 px-4 backdrop-blur md:px-7"><SidebarTrigger className="text-zinc-500" /><div className="h-5 w-px bg-zinc-200" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-zinc-900">TraceGuard workspace</p><p className="truncate text-xs text-zinc-500">{activeView}</p></div></header>
      <main className="mx-auto w-full max-w-[1480px] p-4 md:p-7">
        {activeView === "Overview" && <Overview onNavigate={setActiveView} />}
        {activeView === "Support agent" && <SupportAgent onViewTrace={() => setActiveView("Live runs")} />}
        {activeView === "Review queue" && <ReviewQueue />}
        {activeView === "Live runs" && <LiveRuns onRegister={() => setActiveView("Agents")} />}
        {activeView === "Agents" && <Agents />}
      </main>
    </SidebarInset>
  </SidebarProvider>;
}
