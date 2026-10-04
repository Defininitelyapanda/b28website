"use client";
import Link from "next/link";
import { Activity, Clapperboard, LayoutDashboard, LifeBuoy, MessageSquare, PencilLine } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Mark } from "@/components/public/site-chrome";

const groups = [
  { label: "Content", items: [["Library", "/admin2714#content", Clapperboard], ["Editor", "/admin2714#editor", PencilLine]] },
  { label: "Communication", items: [["Contact leads", "/admin2714#messages", MessageSquare]] },
  { label: "System", items: [["Activity log", "/admin2714#activity", Activity], ["Recovery", "/admin2714/recovery", LifeBuoy]] },
] as const;

export function AdminNav() {
  return <Sidebar><SidebarHeader><Link href="/" className="brand"><Mark/><span>B28<br/>Studio</span></Link></SidebarHeader><SidebarContent>
    <SidebarGroup><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild><Link href="/admin2714"><LayoutDashboard/>Dashboard</Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
    {groups.map((group) => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.map(([label, href, Icon]) => <SidebarMenuItem key={href}><SidebarMenuButton asChild><Link href={href}><Icon/>{label}</Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}
  </SidebarContent><SidebarFooter><small>Private studio</small></SidebarFooter></Sidebar>;
}
