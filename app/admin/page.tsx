import { AdminNav } from "@/components/admin/admin-nav";
import { AdminStudio } from "@/components/admin/studio";
import { PasskeySettings } from "@/components/admin/passkey-settings";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { dashboardStats, ensureAdmin, ensureSeedData, listContacts, listContent } from "@/lib/cms";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const user = await requireAdmin("/admin");
  await ensureAdmin(user);
  await ensureSeedData(user.userId);
  const [stats, items, contacts] = await Promise.all([dashboardStats(), listContent(undefined, true, 200), listContacts()]);
  const published = items.filter((item) => item.status === "published").length;
  const drafts = items.filter((item) => item.status === "draft").length;
  return <SidebarProvider><AdminNav email={user.email}/><SidebarInset><main className="admin-main">
    <div className="admin-topbar"><div><SidebarTrigger/><p className="section-kicker">Editorial workspace</p><h1>Good work starts here.</h1></div><a className="admin-button secondary" href="/" target="_blank">View site</a></div>
    <section className="stats-grid"><div className="stat-card"><strong>{items.length}</strong><span>Total content</span></div><div className="stat-card"><strong>{published}</strong><span>Published</span></div><div className="stat-card"><strong>{drafts}</strong><span>Drafts</span></div><div className="stat-card"><strong>{stats.unread}</strong><span>New messages</span></div></section>
    <AdminStudio initial={items}/>
    <PasskeySettings canEnroll={user.authMethod === "google"}/>
    <div className="admin-grid"><section className="admin-panel" id="messages"><h2>Contact pipeline</h2><table className="content-table"><thead><tr><th>Name</th><th>Project</th><th>Status</th><th>Received</th></tr></thead><tbody>{contacts.map((contact) => <tr key={String(contact.id)}><td>{String(contact.name)}<br/><small>{String(contact.email)}</small></td><td>{String(contact.project_type)}</td><td><span className="status-pill">{String(contact.status)}</span></td><td>{new Date(String(contact.created_at)).toLocaleDateString()}</td></tr>)}</tbody></table></section>
      <section className="admin-panel" id="activity"><h2>Recent activity</h2>{stats.activity.map((entry) => <div className="activity-row" key={String(entry.id)}>{String(entry.action)} · {String(entry.object_type)}<span>{new Date(String(entry.created_at)).toLocaleString()}</span></div>)}</section>
    </div>
  </main></SidebarInset></SidebarProvider>;
}
