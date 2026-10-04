"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Send, Trash2 } from "lucide-react";
import type { ContentBlock, ContentItem, ContentStatus, ContentType } from "@/lib/cms-types";

type Draft = {
  id?: string;
  type: ContentType;
  slug: string;
  title: string;
  status: ContentStatus;
  excerpt: string;
  body: string;
  coverImage: string;
  featured: boolean;
  data: Record<string, unknown>;
  blocks: ContentBlock[];
};

const newDraft = (): Draft => ({ type: "project", slug: "", title: "", status: "draft", excerpt: "", body: "", coverImage: "", featured: false, data: {}, blocks: [] });

export function AdminStudio({ initial }: { initial: ContentItem[] }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [flash, setFlash] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const visible = useMemo(() => items.filter((item) => filter === "all" || item.type === filter), [items, filter]);

  useEffect(() => {
    if (!localStorage.getItem("b28-recovered-draft")) return;
    const frame = requestAnimationFrame(() => setFlash("Recovered unsaved draft available. Choose Restore or start a new item."));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!draft.title) return;
    const id = window.setTimeout(() => localStorage.setItem("b28-recovered-draft", JSON.stringify(draft)), 700);
    return () => window.clearTimeout(id);
  }, [draft]);

  function edit(item: ContentItem) {
    const blocks = Array.isArray(item.data.blocks) ? item.data.blocks as ContentBlock[] : [];
    setDraft({ ...item, coverImage: item.coverImage || "", blocks });
    setFlash("");
    document.getElementById("editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetDraft() {
    setDraft(newDraft());
    setFlash("");
    document.getElementById("editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function restore() {
    try {
      const value = localStorage.getItem("b28-recovered-draft");
      if (!value) return;
      setDraft(JSON.parse(value) as Draft);
      setFlash("Draft restored.");
    } catch {
      localStorage.removeItem("b28-recovered-draft");
      setFlash("The recovered draft was invalid and has been cleared.");
    }
  }

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function addBlock() {
    field("blocks", [...draft.blocks, { id: crypto.randomUUID(), type: "text", order: draft.blocks.length, data: { text: "" } }]);
  }

  function updateBlock(id: string, patch: Partial<ContentBlock>) {
    field("blocks", draft.blocks.map((block) => block.id === id ? { ...block, ...patch } : block).map((block, index) => ({ ...block, order: index })));
  }

  function moveBlock(index: number, delta: number) {
    const next = [...draft.blocks];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    field("blocks", next.map((block, order) => ({ ...block, order })));
  }

  async function save(status: ContentStatus = draft.status) {
    setSaving(true);
    setFlash("");
    const payload = { ...draft, status, data: { ...draft.data, blocks: draft.blocks }, sortOrder: 0, scheduledAt: null, changeSummary: status === "published" ? "Published from studio" : "Saved draft from studio" };
    try {
      const response = await fetch("/api/admin2714/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json() as { success: boolean; data?: ContentItem; error?: { message?: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error?.message || "Save failed.");
      setItems((current) => [result.data!, ...current.filter((item) => item.id !== result.data!.id)]);
      edit(result.data);
      localStorage.removeItem("b28-recovered-draft");
      setFlash(status === "published" ? "Published successfully." : "Draft saved.");
    } catch (error) {
      setFlash(error instanceof Error ? `${error.message} Your local draft is still safe.` : "Save failed. Your local draft is still safe.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="admin-grid admin-studio-grid">
    <section className="admin-panel" id="content">
      <div className="admin-topbar admin-panel-heading">
        <div><p className="admin-label">Library</p><h2>Content</h2></div>
        <div className="admin-actions">
          <label className="sr-only" htmlFor="content-filter">Filter content type</label>
          <select id="content-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
            <option value="all">All content</option><option value="project">Projects</option><option value="article">Journal</option><option value="page">Pages</option><option value="service">Services</option><option value="team">Team</option>
          </select>
          <button className="admin-button" type="button" onClick={resetDraft}><Plus size={15}/> New</button>
        </div>
      </div>
      <div className="admin-table-scroll">
        <table className="content-table">
          <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>{visible.map((item) => <tr key={item.id} className={draft.id === item.id ? "selected" : ""} onClick={() => edit(item)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") edit(item); }} tabIndex={0} aria-selected={draft.id === item.id}>
            <td><strong>{item.title}</strong></td><td>{item.type}</td><td><span className="status-pill">{item.status}</span></td><td>{new Date(item.updatedAt).toLocaleDateString()}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!visible.length && <p className="empty-state">No content matches this filter.</p>}
    </section>

    <section className="admin-panel admin-editor" id="editor">
      <p className="admin-label">Editor</p>
      <h2>{draft.id ? `Edit ${draft.title}` : "Create content"}</h2>
      {flash && <div className="admin-flash" role="status">{flash} {flash.startsWith("Recovered") && <button className="admin-button secondary" type="button" onClick={restore}>Restore</button>}</div>}
      <form className="admin-form" onSubmit={(event) => { event.preventDefault(); void save("draft"); }}>
        <label>Type<select value={draft.type} onChange={(event) => field("type", event.target.value as ContentType)}><option value="project">Project</option><option value="article">Journal article</option><option value="page">Page</option><option value="service">Service</option><option value="team">Team member</option></select></label>
        <label>Slug<input value={draft.slug} onChange={(event) => field("slug", event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))} required/></label>
        <label className="wide">Title<input value={draft.title} onChange={(event) => field("title", event.target.value)} required/></label>
        <label className="wide">Excerpt<textarea value={draft.excerpt} onChange={(event) => field("excerpt", event.target.value)}/></label>
        <label className="wide">Body<textarea value={draft.body} onChange={(event) => field("body", event.target.value)}/></label>
        <label className="wide">Cover image path<input value={draft.coverImage} onChange={(event) => field("coverImage", event.target.value)} placeholder="/media/example.jpg"/></label>
        <label className="checkbox-field"><input type="checkbox" checked={draft.featured} onChange={(event) => field("featured", event.target.checked)}/> Featured</label>
        <div className="block-list"><div className="admin-topbar admin-panel-heading"><h2>Content blocks</h2><button type="button" className="admin-button secondary" onClick={addBlock}><Plus size={14}/> Add block</button></div>{draft.blocks.map((block, index) => <div className="block-row" key={block.id}>
          <select aria-label="Block type" value={block.type} onChange={(event) => updateBlock(block.id, { type: event.target.value as ContentBlock["type"] })}><option value="text">Text</option><option value="quote">Quote</option><option value="image">Image</option><option value="video">Video</option><option value="gallery">Gallery</option><option value="stats">Statistics</option><option value="timeline">Timeline</option><option value="cta">CTA</option></select>
          <input aria-label="Block content" value={String(block.data.text || "")} onChange={(event) => updateBlock(block.id, { data: { ...block.data, text: event.target.value } })}/>
          <button type="button" disabled={index === 0} onClick={() => moveBlock(index, -1)} aria-label="Move block up"><ChevronUp/></button>
          <button type="button" disabled={index === draft.blocks.length - 1} onClick={() => moveBlock(index, 1)} aria-label="Move block down"><ChevronDown/></button>
          <button type="button" onClick={() => field("blocks", draft.blocks.filter((item) => item.id !== block.id))} aria-label="Delete block"><Trash2/></button>
        </div>)}</div>
        <div className="admin-actions wide"><button className="admin-button secondary" type="submit" disabled={saving}><Save size={15}/> {saving ? "Saving…" : "Save draft"}</button><button className="admin-button" type="button" disabled={saving || !draft.title || !draft.slug} onClick={() => void save("published")}><Send size={15}/> Publish</button></div>
      </form>
    </section>
  </div>;
}
