"use client";
import Link from "next/link";
import { Activity, Archive, BookOpen, Clapperboard, FileText, FolderOpen, Image, LayoutDashboard, LifeBuoy, MessageSquare, Settings, Users } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Mark } from "@/components/public/site-chrome";

const groups = [
  { label: "Content", items: [["Studio", "/admin", Clapperboard], ["Pages", "/admin#pages", FileText], ["Projects", "/admin#projects", FolderOpen], ["Journal", "/admin#journal", BookOpen], ["Team", "/admin#team", Users]] },
  { label: "Media & communication", items: [["Media library", "/admin#media", Image], ["Contact leads", "/admin#messages", MessageSquare]] },
  { label: "System", items: [["Backups", "/admin#backups", Archive], ["Activity log", "/admin#activity", Activity], ["Recovery", "/admin/recovery", LifeBuoy], ["Settings", "/admin#settings", Settings]] },
] as const;

export function AdminNav({ email }: { email: string }) {
  return <Sidebar><SidebarHeader><Link href="/" className="brand"><Mark/><span>B28<br/>Studio</span></Link></SidebarHeader><SidebarContent>
    <SidebarGroup><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild><Link href="/admin"><LayoutDashboard/>Dashboard</Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
    {groups.map((group) => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{group.items.map(([label, href, Icon]) => <SidebarMenuItem key={href}><SidebarMenuButton asChild><Link href={href}><Icon/>{label}</Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>)}
  </SidebarContent><SidebarFooter><small>{email}</small><Link href="/api/auth/logout">Sign out</Link></SidebarFooter></Sidebar>;
}
