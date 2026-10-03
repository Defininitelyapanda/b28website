import Link from "next/link";
import { SidebarProvider } from "@/components/ui/sidebar";
import { requireLocalAdmin } from "@/lib/local-auth";

export const dynamic = "force-dynamic";
export default async function Recovery() {
  await requireLocalAdmin("/admin/recovery");
  return <SidebarProvider><main className="admin-main"><p className="section-kicker">Emergency recovery</p><h1>Safe mode</h1><div className="admin-panel"><p>This minimal route stays separate from the main studio so B28 can inspect system health and return to a known working surface.</p><div className="admin-actions"><a className="admin-button" href="/api/health" target="_blank">Inspect health</a><Link className="admin-button secondary" href="/admin">Return to studio</Link><Link className="admin-button secondary" href="/">Open public site</Link></div></div></main></SidebarProvider>;
}
