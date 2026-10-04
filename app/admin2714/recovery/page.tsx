import type { Metadata } from "next";
import Link from "next/link";
import { SidebarProvider } from "@/components/ui/sidebar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "B28 Studio recovery", robots: { index: false, follow: false } };

export default function Recovery() {
  return <SidebarProvider><main className="admin-main"><p className="section-kicker">Emergency recovery</p><h1>Safe mode</h1><div className="admin-panel"><p>This minimal route stays separate from the main studio so B28 can inspect system health and return to a known working surface.</p><div className="admin-actions"><a className="admin-button" href="/api/health" target="_blank">Inspect health</a><Link className="admin-button secondary" href="/admin2714">Return to studio</Link><Link className="admin-button secondary" href="/">Open public site</Link></div></div></main></SidebarProvider>;
}
