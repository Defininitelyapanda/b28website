"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp, Clock3, Copy, ExternalLink, FileText, Images, Laptop, Monitor, PanelLeft, PanelRight, Maximize2, Plus, Redo2, RotateCcw, Save, Search, Send, Smartphone, Trash2, Undo2, Upload, X } from "lucide-react";
import "./workspace.css";
import { InsertPanel } from "./insert-panel";
import type { ContentBlock, ContentItem, ContentStatus, ContentType } from "@/lib/cms-types";
import { contentPath } from "@/lib/content-url";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type CustomElement, type ElementOverride, type SitePageKey, type SiteSettings } from "@/lib/site-settings";
import { SiteDesignInspector } from "./site-design-editor";
import { ElementInspector } from "./element-inspector";
import type { SelectedVisualElement } from "@/components/public/visual-editor-runtime";

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
  sortOrder: number;
  data: Record<string, unknown>;
  blocks: ContentBlock[];
};

type Viewport = "desktop" | "tablet" | "mobile";
type PreviewMode = "design" | "site";
type DesignVersion = { id: string; version: number; summary: string; author: string; createdAt: string };
type MediaItem = { id: string; storage_key: string; filename: string; title: string; alt_text: string; mime_type: string; size: number; created_at: string };

const typeLabels: Record<ContentType, string> = { page: "Page", project: "Project", article: "Journal", service: "Service", team: "Team" };
const typeDescriptions: Record<ContentType, string> = {
  page: "Create a standalone page and add it to navigation.",
  project: "Add a film to the Projects archive.",
  article: "Publish once to update every Journal section across the site.",
  service: "Add a capability to the Services page.",
  team: "Add a profile to the About page.",
};
const publicPages: Array<[SitePageKey, string, string]> = [["home", "Home", "/"], ["work", "Projects", "/work"], ["about", "About", "/about"], ["services", "Services", "/services"], ["journal", "Journal", "/journal"], ["contact", "Contact", "/contact"]];

function freshDraft(type: ContentType = "page"): Draft {
  return { type, slug: "", title: "", status: "draft", excerpt: "", body: "", coverImage: "", featured: false, sortOrder: 0, data: {}, blocks: [] };
}

function fromItem(item: ContentItem): Draft {
  return { ...item, coverImage: item.coverImage || "", blocks: Array.isArray(item.data.blocks) ? item.data.blocks as ContentBlock[] : [] };
}

function slugify(value: string) {
  return value.toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
}

function blockLabel(type: ContentBlock["type"]) {
  return ({ text: "Text", quote: "Quote", image: "Image", video: "Video", gallery: "Gallery", stats: "Statistics", timeline: "Timeline", cta: "Button" } as const)[type];
}

export function SiteBuilder({ initial, initialSettings, recoveredDesignDraft = false, safeMode = false }: { initial: ContentItem[]; initialSettings: SiteSettings; recoveredDesignDraft?: boolean; safeMode?: boolean }) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [history, setHistory] = useState<Draft[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [query, setQuery] = useState("");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("design");
  const [showPages, setShowPages] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [toolTab, setToolTab] = useState<"insert" | "properties">("insert");
  const [previewPath, setPreviewPath] = useState("/");
  const [previewKey, setPreviewKey] = useState(0);
  const [status, setStatus] = useState(safeMode ? "Safe mode — embeds and motion disabled" : recoveredDesignDraft ? "Recovered saved design draft" : "Ready");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [siteSettings, setSiteSettings] = useState(initialSettings);
  const [designHistory, setDesignHistory] = useState<SiteSettings[]>([initialSettings]);
  const [designHistoryIndex, setDesignHistoryIndex] = useState(0);
  const [designTarget, setDesignTarget] = useState<"global" | SitePageKey | null>("home");
  const [selectedElement, setSelectedElement] = useState<SelectedVisualElement | null>(null);
  const [designDirty, setDesignDirty] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [designVersions, setDesignVersions] = useState<DesignVersion[]>([]);
  const [showMedia, setShowMedia] = useState(false);
  const [localRecovery, setLocalRecovery] = useState<SiteSettings | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaQuery, setMediaQuery] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const uploadReceiver = useRef<(path: string) => void>(() => undefined);
  const settingsRef = useRef(initialSettings);
  const designHistoryRef = useRef<SiteSettings[]>([initialSettings]);
  const designHistoryIndexRef = useRef(0);
  const designRevisionRef = useRef(0);
  const copiedElementRef = useRef<SelectedVisualElement | null>(null);
  const designRequestsRef = useRef<Promise<unknown>>(Promise.resolve());

  function requestDesign(url: string, body: unknown) {
    const task = designRequestsRef.current.catch(() => undefined).then(async () => {
      const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json() as { success?: boolean; data?: SiteSettings; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Design changes could not be saved.");
      return result;
    });
    designRequestsRef.current = task;
    return task;
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { try {
      const raw = localStorage.getItem("b28-site-design-draft");
      if (!raw) return;
      const saved = JSON.parse(raw) as { settings?: Partial<SiteSettings> };
      if (saved.settings) {
        const settings = normalizeSiteSettings(saved.settings);
        if (JSON.stringify(settings) !== JSON.stringify(initialSettings)) setLocalRecovery(settings);
      }
    } catch { /* Browser recovery is optional when storage is unavailable. */ } }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSettings]);

  const visible = useMemo(() => items.filter((item) => (filter === "all" || item.type === filter) && `${item.title} ${item.slug}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [items, filter, query]);
  const visibleMedia = useMemo(() => mediaItems.filter((item) => `${item.filename} ${item.title} ${item.alt_text}`.toLocaleLowerCase().includes(mediaQuery.toLocaleLowerCase())), [mediaItems, mediaQuery]);

  function sendContentPreview() {
    if (!draft) return;
    previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "content-preview", item: { ...draft, data: { ...draft.data, blocks: draft.blocks } }, settings: settingsRef.current }, window.location.origin);
  }

  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (event.source === previewRef.current?.contentWindow && event.origin === window.location.origin && event.data?.source === "b28-content-preview" && event.data.type === "ready") sendContentPreview();
    };
    window.addEventListener("message", ready);
    sendContentPreview();
    return () => window.removeEventListener("message", ready);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, siteSettings, previewMode]);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setTimeout(() => localStorage.setItem("b28-builder-draft", JSON.stringify(draft)), 500);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    if (!designTarget || !designDirty || saving) return;
    const revision = designRevisionRef.current;
    try { localStorage.setItem("b28-site-design-draft", JSON.stringify({ savedAt: new Date().toISOString(), settings: siteSettings })); } catch { /* Server autosave still works without browser storage. */ }
    const timer = window.setTimeout(async () => {
      setStatus("Saving draft…");
      try {
        await requestDesign("/api/admin2714/site", { action: "save-draft", settings: settingsRef.current });
        if (designRevisionRef.current === revision) { setDesignDirty(false); setStatus("Draft saved"); }
      } catch { setStatus(navigator.onLine ? "Saving failed — changes remain local" : "Offline — changes remain local"); }
    }, 1_500);
    return () => window.clearTimeout(timer);
  }, [designDirty, designTarget, siteSettings, saving]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== previewRef.current?.contentWindow || event.origin !== window.location.origin || event.data?.source !== "b28-visual-editor") return;
      if (event.data.type === "selected") { setSelectedElement(event.data.element as SelectedVisualElement); setStatus(`Editing ${event.data.element.tag} element`); }
      if (event.data.type === "selection") setStatus(`${event.data.elements.length} components selected in the canvas`);
      if (event.data.type === "ready") sendDesignState();
      if (event.data.type === "shortcut") {
        if (event.data.action === "redo") redo(); else if (event.data.action === "undo") undo(); else if (event.data.action === "save") void saveDesignDraft(); else if (event.data.action === "preview") setPreviewMode((mode) => mode === "site" ? "design" : "site"); else if (event.data.action === "copy" && selectedElement) { copiedElementRef.current = selectedElement; setStatus("Element copied"); } else if (event.data.action === "paste" && copiedElementRef.current) duplicateVisual(copiedElementRef.current); else if (event.data.action === "deselect") clearElement();
      }
      if (event.data.type === "change") applyVisualPatch(event.data.element as SelectedVisualElement, event.data.patch as Partial<ElementOverride>);
      if (event.data.type === "action") { if (event.data.action === "delete-selection") deleteVisualSelection(event.data.elements as SelectedVisualElement[]); else if (event.data.action === "duplicate") duplicateVisual(event.data.element as SelectedVisualElement); else deleteVisual(event.data.element as SelectedVisualElement); }
      if (event.data.type === "request-upload") requestUpload((path) => applyVisualPatch(event.data.element as SelectedVisualElement, event.data.field === "src" ? { src: path } : { styles: { "background-image": `url("${path}")`, "background-size": "cover", "background-position": "center" } }));
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  // The dependencies below intentionally refresh the bridge whenever its history snapshot changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designHistoryIndex, designTarget, previewPath, selectedElement, siteSettings]);

  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable;
      const key = event.key.toLocaleLowerCase();
      if (!typing && (event.ctrlKey || event.metaKey) && key === "a") { event.preventDefault(); previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "select-all" }, window.location.origin); return; }
      if ((event.ctrlKey || event.metaKey) && key === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); }
      else if ((event.ctrlKey || event.metaKey) && key === "s") { event.preventDefault(); if (designTarget) void saveDesignDraft(); else if (draft) void save("draft"); }
      else if ((event.ctrlKey || event.metaKey) && key === "p") { event.preventDefault(); setPreviewMode((mode) => mode === "site" ? "design" : "site"); }
      else if (!typing && (event.ctrlKey || event.metaKey) && key === "c" && selectedElement) { event.preventDefault(); copiedElementRef.current = selectedElement; setStatus("Element copied"); }
      else if (!typing && (event.ctrlKey || event.metaKey) && key === "v" && copiedElementRef.current) { event.preventDefault(); duplicateVisual(copiedElementRef.current); }
      else if (event.key === "Escape") clearElement();
      else if (!typing && selectedElement && (event.key === "Delete" || event.key === "Backspace")) { event.preventDefault(); deleteVisual(selectedElement); }
    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designHistoryIndex, designTarget, historyIndex, selectedElement, siteSettings]);

  function select(item: ContentItem) {
    setDesignTarget(null);
    const next = fromItem(item);
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewPath(contentPath(item.type, item.slug)); setPreviewMode("design"); setShowInspector(true); setStatus(`${typeLabels[item.type]} selected`);
  }

  function create(type: ContentType) {
    setDesignTarget(null);
    const next = freshDraft(type);
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewMode("design"); setShowInspector(true); setShowCreate(false); setStatus(`New ${typeLabels[type].toLocaleLowerCase()}`);
  }

  function commit(next: Draft) {
    const nextHistory = [...history.slice(0, historyIndex + 1), next].slice(-80);
    setDraft(next); setHistory(nextHistory); setHistoryIndex(nextHistory.length - 1); setStatus("Unsaved changes");
  }

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    if (!draft) return;
    commit({ ...draft, [key]: value });
  }

  function titleField(value: string) {
    if (!draft) return;
    const previousAutoSlug = slugify(draft.title);
    commit({ ...draft, title: value, slug: !draft.slug || draft.slug === previousAutoSlug ? slugify(value) : draft.slug });
  }

  function dataField(key: string, value: unknown) {
    if (!draft) return;
    commit({ ...draft, data: { ...draft.data, [key]: value } });
  }

  function seoField(key: string, value: unknown) {
    if (!draft) return;
    const seo = draft.data.seo && typeof draft.data.seo === "object" ? draft.data.seo as Record<string, unknown> : {};
    commit({ ...draft, data: { ...draft.data, seo: { ...seo, [key]: value } } });
  }

  function commitDesign(next: SiteSettings, message = "Unsaved design changes") {
    const nextHistory = [...designHistoryRef.current.slice(0, designHistoryIndexRef.current + 1), next].slice(-100); const nextIndex = nextHistory.length - 1;
    designRevisionRef.current += 1; settingsRef.current = next; designHistoryRef.current = nextHistory; designHistoryIndexRef.current = nextIndex; setSiteSettings(next); setDesignHistory(nextHistory); setDesignHistoryIndex(nextIndex); setDesignDirty(true); setStatus(message);
  }

  function restoreDesign(index: number, message: string) {
    const next = designHistoryRef.current[index]; if (!next) return;
    designRevisionRef.current += 1; settingsRef.current = next; designHistoryIndexRef.current = index; setDesignHistoryIndex(index); setSiteSettings(next); setDesignDirty(true); sendDesignState(next); clearElement(); setStatus(message);
  }

  function undo() {
    if (designTarget) { const index = designHistoryIndexRef.current; if (index > 0) restoreDesign(index - 1, "Design change undone"); return; }
    if (historyIndex <= 0) return;
    const index = historyIndex - 1; setHistoryIndex(index); setDraft(history[index]); setStatus("Change undone");
  }

  function redo() {
    if (designTarget) { const index = designHistoryIndexRef.current; if (index < designHistoryRef.current.length - 1) restoreDesign(index + 1, "Design change restored"); return; }
    if (historyIndex >= history.length - 1) return;
    const index = historyIndex + 1; setHistoryIndex(index); setDraft(history[index]); setStatus("Change restored");
  }

  function addBlock(type: ContentBlock["type"]) {
    if (!draft) return;
    const block: ContentBlock = { id: crypto.randomUUID(), type, order: draft.blocks.length, data: { text: "" } };
    commit({ ...draft, blocks: [...draft.blocks, block] });
  }

  function updateBlock(id: string, data: Partial<ContentBlock>) {
    if (!draft) return;
    commit({ ...draft, blocks: draft.blocks.map((block) => block.id === id ? { ...block, ...data } : block) });
  }

  function moveBlock(index: number, movement: number) {
    if (!draft) return;
    const target = index + movement;
    if (target < 0 || target >= draft.blocks.length) return;
    const blocks = [...draft.blocks]; [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    commit({ ...draft, blocks: blocks.map((block, order) => ({ ...block, order })) });
  }

  function removeBlock(id: string) {
    if (!draft) return;
    commit({ ...draft, blocks: draft.blocks.filter((block) => block.id !== id).map((block, order) => ({ ...block, order })) });
  }

  async function save(statusValue: ContentStatus) {
    if (!draft || !draft.title || !draft.slug) { setStatus("Add a title and URL slug first"); return; }
    setSaving(true); setStatus(statusValue === "published" ? "Publishing…" : "Saving…");
    try {
      const response = await fetch("/api/admin2714/content", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...draft, status: statusValue, data: { ...draft.data, blocks: draft.blocks }, scheduledAt: null, changeSummary: statusValue === "published" ? "Published from visual builder" : "Saved from visual builder" }) });
      const result = await response.json() as { success: boolean; data?: ContentItem; publicPath?: string; error?: { message?: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error?.message || "Save failed.");
      const saved = fromItem(result.data);
      setItems((current) => [result.data!, ...current.filter((item) => item.id !== result.data!.id)]);
      setDraft(saved); setHistory([saved]); setHistoryIndex(0); localStorage.removeItem("b28-builder-draft");
      setPreviewPath(result.publicPath || contentPath(saved.type, saved.slug)); setPreviewKey((key) => key + 1); setPreviewMode("site");
      setStatus(statusValue === "published" ? "Published — live preview refreshed" : "Draft saved");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Save failed"); }
    finally { setSaving(false); }
  }

  function duplicate() {
    if (!draft) return;
    const next = { ...draft, id: undefined, title: `${draft.title} copy`, slug: `${draft.slug || "item"}-copy`, status: "draft" as const, publishedAt: undefined, createdAt: undefined, updatedAt: undefined } as Draft;
    setDraft(next); setHistory([next]); setHistoryIndex(0); setPreviewMode("design"); setStatus("Copy created — save when ready");
  }

  async function remove() {
    if (!draft?.id || !window.confirm(`Delete “${draft.title}”? This removes it from the public site.`)) return;
    setSaving(true); setStatus("Deleting…");
    try {
      const response = await fetch(`/api/admin2714/content?id=${encodeURIComponent(draft.id)}`, { method: "DELETE" });
      const result = await response.json() as { success: boolean; error?: { message?: string } };
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Delete failed.");
      setItems((current) => current.filter((item) => item.id !== draft.id)); setDraft(null); setHistory([]); setHistoryIndex(-1); setPreviewPath("/"); setPreviewKey((key) => key + 1); setPreviewMode("site"); setStatus("Item deleted");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Delete failed"); }
    finally { setSaving(false); }
  }

  async function upload(file: File) {
    setSaving(true); setStatus("Uploading media…");
    try {
      const form = new FormData(); form.set("file", file); form.set("altText", draft?.title || file.name);
      const response = await fetch("/api/admin2714/media", { method: "POST", body: form });
      const result = await response.json() as { success: boolean; data?: { key: string }; error?: { message?: string } };
      if (!response.ok || !result.success || !result.data) throw new Error(result.error?.message || "Upload failed.");
      uploadReceiver.current(result.data.key); setShowMedia(false); setStatus("Media uploaded and selected");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Upload failed"); }
    finally { setSaving(false); if (uploadRef.current) uploadRef.current.value = ""; }
  }

  function editDesign(target: "global" | SitePageKey, path = "/") {
    setDraft(null); setSelectedElement(null); setDesignTarget(target); setPreviewPath(path); setPreviewMode("design"); setStatus(target === "global" ? "Editing global design" : `Editing ${target} page`);
  }

  async function saveDesignDraft() {
    setSaving(true); setStatus("Saving draft…"); const revision = designRevisionRef.current;
    try {
      await requestDesign("/api/admin2714/site", { action: "save-draft", settings: settingsRef.current });
      if (designRevisionRef.current === revision) setDesignDirty(false); setStatus("Draft saved");
    } catch (error) { setStatus(error instanceof Error ? `${error.message} Your changes remain local.` : "Saving failed — changes remain local"); }
    finally { setSaving(false); }
  }

  async function saveDesign() {
    const changes = Math.max(1, designHistoryIndexRef.current); if (!window.confirm(`You are about to publish ${changes} design change${changes === 1 ? "" : "s"}. Continue?`)) return;
    setSaving(true); setStatus("Publishing design…");
    try {
      const result = await requestDesign("/api/admin2714/site", { action: "publish", settings: settingsRef.current });
      if (result.data) { settingsRef.current = result.data; designHistoryRef.current = [result.data]; designHistoryIndexRef.current = 0; designRevisionRef.current = 0; setSiteSettings(result.data); setDesignHistory([result.data]); setDesignHistoryIndex(0); setDesignDirty(false); localStorage.removeItem("b28-site-design-draft"); }
      setPreviewKey((key) => key + 1); setStatus("Design published to the live site");
    } catch (error) { setStatus(`${error instanceof Error ? error.message : "Publishing failed."} Your draft is safe.`); }
    finally { setSaving(false); }
  }

  async function restoreLastSavedDesign() {
    setSaving(true); setStatus("Loading last saved design…");
    try {
      const result = await requestDesign("/api/admin2714/site", { action: "discard-draft" });
      if (!result.data) throw new Error("Last saved design could not be loaded.");
      const saved = result.data; settingsRef.current = saved; designHistoryRef.current = [saved]; designHistoryIndexRef.current = 0; designRevisionRef.current = 0; setSiteSettings(saved); setDesignHistory([saved]); setDesignHistoryIndex(0); setDesignDirty(false); localStorage.removeItem("b28-site-design-draft"); sendDesignState(saved); clearElement(); setStatus("Restored the last published design — no page reload");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Last saved design could not be loaded."); }
    finally { setSaving(false); }
  }

  async function openDesignVersions() {
    setShowVersions(true); setStatus("Loading design history…");
    try { const response = await fetch("/api/admin2714/site/versions", { cache: "no-store" }); const result = await response.json() as { success?: boolean; data?: DesignVersion[]; error?: { message?: string } }; if (!response.ok || !result.success) throw new Error(result.error?.message || "Version history could not be loaded."); setDesignVersions(result.data || []); setStatus("Version history ready"); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Version history could not be loaded."); }
  }

  async function restoreDesignVersion(version: number) {
    setSaving(true); setStatus(`Restoring version ${version} to draft…`);
    try { const result = await requestDesign("/api/admin2714/site/versions", { version }); if (!result.data) throw new Error("Version could not be restored."); const restored = result.data; settingsRef.current = restored; designHistoryRef.current = [restored]; designHistoryIndexRef.current = 0; designRevisionRef.current = 0; setSiteSettings(restored); setDesignHistory([restored]); setDesignHistoryIndex(0); setDesignDirty(false); try { localStorage.removeItem("b28-site-design-draft"); } catch {} sendDesignState(restored); clearElement(); setShowVersions(false); setStatus(`Version ${version} restored as a safe draft`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Version could not be restored."); }
    finally { setSaving(false); }
  }

  async function loadMedia() {
    try { const response = await fetch("/api/admin2714/media", { cache: "no-store" }); const result = await response.json() as { success?: boolean; data?: MediaItem[]; error?: { message?: string } }; if (!response.ok || !result.success) throw new Error(result.error?.message || "Media library could not be loaded."); setMediaItems(result.data || []); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Media library could not be loaded."); }
  }
  function requestUpload(receiver: (path: string) => void) { uploadReceiver.current = receiver; setShowMedia(true); void loadMedia(); }
  function openMediaLibrary() { requestUpload((path) => { void navigator.clipboard?.writeText(path); setStatus("Media URL copied"); }); }
  function chooseMedia(item: MediaItem) { uploadReceiver.current(item.storage_key); setShowMedia(false); setStatus(`${item.filename} selected`); }
  function applyElement(override: ElementOverride) { previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "apply", override }, window.location.origin); }
  function clearElement() { setSelectedElement(null); previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "select-clear" }, window.location.origin); }
  function sendDesignState(settings: SiteSettings = settingsRef.current) { previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "state", path: previewPath, settings, overrides: settings.elementOverrides, items: settings.customElements }, window.location.origin); }
  function updateElementSettings(next: SiteSettings) { commitDesign(next, "Unsaved element changes"); previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "custom", path: previewPath, items: next.customElements }, window.location.origin); }
  function applyVisualPatch(element: SelectedVisualElement, patch: Partial<ElementOverride>) {
    const current = settingsRef.current;
    const existing = current.elementOverrides.find((item) => item.path === element.path && item.selector === element.selector);
    if ((existing?.locked || element.locked) && patch.locked !== false) return;
    const override: ElementOverride = { id: existing?.id || crypto.randomUUID(), path: element.path, selector: element.selector, tag: element.tag, ...existing, ...patch, styles: { ...(existing?.styles || {}), ...(patch.styles || {}) } };
    const next = { ...current, elementOverrides: [...current.elementOverrides.filter((item) => !(item.path === element.path && item.selector === element.selector)), override] };
    commitDesign(next, "Unsaved element changes"); applyElement(override);
  }
  function duplicateVisual(element: SelectedVisualElement) {
    const current = settingsRef.current;
    const root = current.customElements.find((item) => element.selector === `[data-edit-id="custom-${item.id}"]`);
    if (root) {
      const copy = { ...root, id: crypto.randomUUID(), anchorSelector: element.selector, placement: "after" as const, order: current.customElements.filter((entry) => entry.path === element.path).length };
      const overrides = current.elementOverrides.filter((entry) => entry.path === element.path && entry.selector.includes(`custom-${root.id}`)).map((entry) => ({ ...entry, id: crypto.randomUUID(), locked: false, selector: entry.selector.replace(`custom-${root.id}`, `custom-${copy.id}`) }));
      updateElementSettings({ ...current, customElements: [...current.customElements, copy], elementOverrides: [...current.elementOverrides, ...overrides] }); sendDesignState(settingsRef.current); return;
    }
    const type = element.tag === "img" ? "image" : element.tag === "iframe" ? "embed" : /^h[1-6]$/.test(element.tag) ? "heading" : element.tag === "a" || element.tag === "button" ? "button" : "text";
    const item: CustomElement = { id: crypto.randomUUID(), path: element.path, type, content: element.text, src: element.src, href: element.href, order: current.customElements.filter((entry) => entry.path === element.path).length, anchorSelector: element.selector, placement: "after", styles: {} };
    updateElementSettings({ ...current, customElements: [...current.customElements, item] });
  }
  function deleteVisual(element: SelectedVisualElement) {
    if (element.locked) return;
    const current = settingsRef.current; const root = current.customElements.find((item) => element.selector === `[data-edit-id="custom-${item.id}"]`);
    if (root) updateElementSettings({ ...current, customElements: current.customElements.filter((item) => item.id !== root.id) });
    else applyVisualPatch(element, { hidden: true });
    clearElement();
  }

  function deleteVisualSelection(elements: SelectedVisualElement[]) {
    const current = settingsRef.current;
    const unlocked = elements.filter((element) => !element.locked);
    const roots = new Set(current.customElements.filter((item) => unlocked.some((element) => element.selector === `[data-edit-id="custom-${item.id}"]`)).map((item) => item.id));
    const overrides = [...current.elementOverrides];
    for (const element of unlocked) {
      const index = overrides.findIndex((item) => item.path === element.path && item.selector === element.selector);
      if (index >= 0) { if (!overrides[index].locked) overrides[index] = { ...overrides[index], hidden: true }; }
      else overrides.push({ id: crypto.randomUUID(), path: element.path, selector: element.selector, tag: element.tag, styles: {}, hidden: true });
    }
    const next = { ...current, customElements: current.customElements.filter((item) => !roots.has(item.id)), elementOverrides: overrides };
    commitDesign(next, `Removed ${unlocked.length} selected components`); sendDesignState(next); clearElement();
  }

  return <div className="builder-shell">
    <header className="builder-toolbar">
      <div className="builder-brand"><Link href="/" aria-label="Return to public site"><ArrowLeft size={17}/></Link><span className="builder-logo">B28</span><div><strong>B28 Studio</strong><small role="status">{status}</small></div></div>
      <div className="builder-location"><span>Website editor</span><strong>{draft?.title || publicPages.find(([, , path]) => path === previewPath)?.[1] || previewPath}</strong></div>
      <div className="builder-toolbar-actions"><button aria-label="Undo" title="Undo (Ctrl+Z)" onClick={undo} disabled={designTarget ? designHistoryIndex <= 0 : !draft || historyIndex <= 0}><Undo2 size={16}/></button><button aria-label="Redo" title="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={designTarget ? designHistoryIndex >= designHistory.length - 1 : !draft || historyIndex >= history.length - 1}><Redo2 size={16}/></button>{designTarget ? <><button onClick={() => void openDesignVersions()} disabled={saving} title="Version history"><Clock3 size={15}/><span>History</span></button><button onClick={() => void restoreLastSavedDesign()} disabled={saving} title="Back to last saved"><RotateCcw size={15}/><span>Restore</span></button><button onClick={() => void saveDesignDraft()} disabled={saving || !designDirty}><Save size={15}/><span>Save draft</span></button><button className="primary" onClick={() => void saveDesign()} disabled={saving}><Send size={15}/><span>Publish changes</span></button></> : <><button onClick={() => void save("draft")} disabled={!draft || saving}><Save size={15}/><span>Save draft</span></button><button className="primary" onClick={() => void save("published")} disabled={!draft || saving}><Send size={15}/><span>Publish</span></button></>}</div>
    </header>
    <div className="builder-workspace-bar">
      <div className="builder-panel-controls"><button onClick={() => previewRef.current?.contentWindow?.postMessage({ source: "b28-builder", type: "select-all" }, window.location.origin)} title="Select all in the current area (Ctrl+A)"><FileText size={16}/><span>Select all</span></button><button className={showInspector && toolTab === "insert" ? "active" : ""} onClick={() => { setToolTab("insert"); setShowInspector(true); setPreviewMode("design"); if (!designTarget) editDesign("home"); }}><Plus size={17}/><span>Insert</span></button><button aria-controls="builder-pages" aria-expanded={showPages} className={showPages ? "active" : ""} onClick={() => setShowPages((value) => !value)} title="Toggle pages sidebar"><PanelLeft size={17}/><span>Pages</span></button><button aria-controls="builder-properties" aria-expanded={showInspector} className={showInspector ? "active" : ""} onClick={() => { setToolTab("properties"); setShowInspector((value) => toolTab === "properties" ? !value : true); }} title="Toggle properties sidebar"><PanelRight size={17}/><span>Properties</span></button><button onClick={() => { const hide = showPages || showInspector; setShowPages(!hide); setShowInspector(!hide); }} title="Show or hide both sidebars"><Maximize2 size={16}/><span>Focus canvas</span></button></div>
      <div className="builder-toolbar-center"><button className={previewMode === "design" ? "active" : ""} onClick={() => setPreviewMode("design")}>Edit</button><button className={previewMode === "site" ? "active" : ""} onClick={() => setPreviewMode("site")}>Live site</button><span className="builder-divider"/><button aria-label="Desktop preview" className={viewport === "desktop" ? "active" : ""} onClick={() => setViewport("desktop")}><Monitor size={16}/></button><button aria-label="Tablet preview" className={viewport === "tablet" ? "active" : ""} onClick={() => setViewport("tablet")}><Laptop size={16}/></button><button aria-label="Mobile preview" className={viewport === "mobile" ? "active" : ""} onClick={() => setViewport("mobile")}><Smartphone size={16}/></button></div>
      <span className="builder-canvas-note">{viewport === "desktop" ? "Browser width · 1:1" : viewport === "tablet" ? "820 × 1180 · 1:1" : "390 × 844 · 1:1"}</span>
    </div>
    {localRecovery && <section className="builder-version-panel" role="dialog" aria-modal="true" aria-label="Recover browser draft"><div className="builder-version-card"><header><div><small>Draft recovery</small><h2>Unsaved browser changes found</h2><p>Recover these changes into the editor, or keep the version loaded from the server. Publishing remains a separate step.</p></div></header><div className="builder-media-tools"><button onClick={() => { commitDesign(localRecovery, "Browser draft recovered — review before publishing"); editDesign("home"); sendDesignState(localRecovery); setLocalRecovery(null); }}>Recover browser draft</button><button onClick={() => { try { localStorage.removeItem("b28-site-design-draft"); } catch {} setLocalRecovery(null); }}>Keep server version</button></div></div></section>}
    {showVersions && <section className="builder-version-panel" role="dialog" aria-modal="true" aria-label="Site design version history"><div className="builder-version-card"><header><div><small>Site recovery</small><h2>Version history</h2><p>Restoring creates a draft. The live website stays unchanged until you publish.</p></div><button aria-label="Close version history" onClick={() => setShowVersions(false)}><X size={18}/></button></header><div>{designVersions.length ? designVersions.map((version) => <article key={version.id}><span><strong>Version {version.version}</strong><small>{version.createdAt ? new Date(version.createdAt).toLocaleString() : "Unknown date"} · {version.author}</small><small>{version.summary}</small></span><button onClick={() => void restoreDesignVersion(version.version)} disabled={saving}>Restore to draft</button></article>) : <p>No design snapshots yet. A snapshot is created automatically before every publish.</p>}</div></div></section>}
    {showMedia && <section className="builder-version-panel" role="dialog" aria-modal="true" aria-label="Media library"><div className="builder-version-card builder-media-library"><header><div><small>Assets</small><h2>Media library</h2><p>Choose an existing asset or upload a new image or video.</p></div><button aria-label="Close media library" onClick={() => setShowMedia(false)}><X size={18}/></button></header><div className="builder-media-tools"><label className="builder-search"><Search size={14}/><input value={mediaQuery} onChange={(event) => setMediaQuery(event.target.value)} placeholder="Search media"/></label><button onClick={() => uploadRef.current?.click()}><Upload size={15}/> Upload new</button></div><div className="builder-media-grid">{visibleMedia.map((item) => <button key={item.id} onClick={() => chooseMedia(item)} title={`Use ${item.filename}`}>{item.mime_type.startsWith("image/") ? <span className="builder-media-thumb" role="img" aria-label={item.alt_text || item.title || item.filename} style={{ backgroundImage: `url("${item.storage_key.replace(/["\\]/g, "")}")` }}/> : <span className="builder-media-file"><FileText size={28}/>{item.mime_type}</span>}<span><strong>{item.title || item.filename}</strong><small>{Math.max(1, Math.round(item.size / 1024))} KB</small></span></button>)}{!visibleMedia.length && <p>No matching media. Upload an asset to begin.</p>}</div></div></section>}
    <input ref={uploadRef} className="sr-only" type="file" accept="image/*,video/mp4,video/webm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }}/>

    <aside className="builder-left" id="builder-pages" hidden={!showPages} aria-label="Pages and assets">
      <div className="builder-side-heading"><div><small>Website</small><strong>Pages & content</strong></div><button aria-label="Add content" onClick={() => setShowCreate(!showCreate)}><Plus size={17}/></button></div>
      {showCreate && <div className="builder-create-menu">{(Object.keys(typeLabels) as ContentType[]).map((type) => <button key={type} onClick={() => create(type)}><strong>{typeLabels[type]}</strong><span>{typeDescriptions[type]}</span></button>)}</div>}
      <nav className="builder-public-pages" aria-label="Public pages"><button className={designTarget === "global" ? "active" : ""} onClick={() => editDesign("global")}><FileText size={15}/><span>Global design</span><small>all pages</small></button>{publicPages.map(([key, label, path]) => <button key={path} className={designTarget === key ? "active" : ""} onClick={() => editDesign(key, path)}><FileText size={15}/><span>{label}</span><small>{path}</small></button>)}<button onClick={openMediaLibrary}><Images size={15}/><span>Media library</span><small>images & video</small></button></nav>
      <div className="builder-library-heading"><strong>Managed content</strong><span>{items.length}</span></div>
      <label className="builder-search"><Search size={14}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search"/></label>
      <div className="builder-filter">{(["all", "page", "project", "article", "service", "team"] as const).map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)}>{type === "all" ? "All" : typeLabels[type]}</button>)}</div>
      <div className="builder-items">{visible.map((item) => <button key={item.id} className={draft?.id === item.id ? "active" : ""} onClick={() => select(item)}><span className={`builder-type type-${item.type}`}>{typeLabels[item.type].slice(0, 1)}</span><span><strong>{item.title}</strong><small>/{item.slug} · {item.status}</small></span></button>)}{!visible.length && <p>No matching content.</p>}</div>
    </aside>

    <main className="builder-canvas" aria-label="Public website canvas">
      <div className={`builder-device ${viewport}`}>
        {previewMode === "site" ? <iframe ref={previewRef} key={`live-${previewPath}-${previewKey}`} src={`${previewPath}${safeMode ? `${previewPath.includes("?") ? "&" : "?"}safe=1` : ""}`} title={`Live public page: ${previewPath}`}/> : designTarget ? <iframe ref={previewRef} key={`editor-${previewPath}-${previewKey}`} src={`${previewPath}${previewPath.includes("?") ? "&" : "?"}visual-editor=1${safeMode ? "&safe=1" : ""}`} title={`Visual editor for ${previewPath}`}/> : draft ? <iframe ref={previewRef} src="/admin2714/preview" title="Draft rendered with the public website layout"/> : null}
      </div>
    </main>

    <aside className="builder-inspector" id="builder-properties" hidden={!showInspector} aria-label="Selection properties">
      <div className="builder-panel-heading"><strong>{toolTab === "insert" ? "Insert components" : "Properties"}</strong><button aria-label="Hide tools sidebar" onClick={() => setShowInspector(false)}><X size={16}/></button></div>
      <div className="builder-panel-tabs"><button className={toolTab === "insert" ? "active" : ""} onClick={() => setToolTab("insert")}>Insert</button><button className={toolTab === "properties" ? "active" : ""} onClick={() => setToolTab("properties")}>Properties</button></div>
      {toolTab === "insert" && <InsertPanel settings={siteSettings} path={previewPath} selected={selectedElement} onChange={(next) => { updateElementSettings(next); if (next.navigationLinks !== siteSettings.navigationLinks) sendDesignState(next); }} onMedia={requestUpload} onPage={() => { setToolTab("properties"); create("page"); }} onBackground={(styles) => { if (selectedElement) applyVisualPatch(selectedElement, { styles }); }}/>}
      <div hidden={toolTab !== "properties"}>
      {designTarget ? <><ElementInspector selected={selectedElement} path={previewPath} settings={siteSettings} onChange={updateElementSettings} onApply={applyElement} onUpload={requestUpload} onClose={clearElement}/><details className="builder-page-settings"><summary>Page and site settings</summary><SiteDesignInspector settings={siteSettings} target={designTarget} onChange={(next) => { commitDesign(next); sendDesignState(next); }} onUpload={requestUpload} onReset={() => { commitDesign(DEFAULT_SITE_SETTINGS, "Design reset locally — publish to apply"); sendDesignState(DEFAULT_SITE_SETTINGS); }}/></details></> : !draft ? <div className="builder-inspector-empty"><strong>Nothing selected</strong><p>Select a page, global design, or managed content to edit it.</p></div> : <>
        <div className="builder-inspector-head"><div><small>{draft.id ? "Editing" : "Creating"}</small><strong>{draft.title || `New ${typeLabels[draft.type]}`}</strong></div><button aria-label="Close editor" onClick={() => { setDraft(null); setPreviewMode("site"); }}><X size={17}/></button></div>
        <div className="builder-inspector-actions"><button onClick={duplicate}><Copy size={14}/> Duplicate</button>{draft.status === "published" && draft.slug && <a href={contentPath(draft.type, draft.slug)} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open</a>}<button className="danger" onClick={() => void remove()} disabled={!draft.id || saving}><Trash2 size={14}/> Delete</button></div>
        <div className="builder-fields">
          <label>Content type<select value={draft.type} onChange={(event) => field("type", event.target.value as ContentType)}>{(Object.keys(typeLabels) as ContentType[]).map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label>
          <label>Title<input value={draft.title} onChange={(event) => titleField(event.target.value)} placeholder="Give it a clear title"/></label>
          <label>URL slug<div className="builder-slug"><span>/</span><input value={draft.slug} onChange={(event) => field("slug", slugify(event.target.value))}/></div></label>
          <label>Short description<textarea value={draft.excerpt} onChange={(event) => field("excerpt", event.target.value)} placeholder="Used on cards and search results"/></label>
          <label>Main content<textarea className="builder-body-input" value={draft.body} onChange={(event) => field("body", event.target.value)} placeholder="Write the main story here…"/></label>
          <label>Cover image<div className="builder-media-field"><input value={draft.coverImage} onChange={(event) => field("coverImage", event.target.value)} placeholder="/media/image.jpg"/><button type="button" onClick={() => requestUpload((path) => field("coverImage", path))}><Upload size={14}/></button></div></label>
          <TypeFields draft={draft} setData={dataField}/>
          <details className="builder-seo-panel"><summary>SEO & social sharing</summary><div className="builder-type-fields"><label>SEO title<input value={String((draft.data.seo as Record<string, unknown> | undefined)?.title || "")} onChange={(event) => seoField("title", event.target.value)} placeholder={draft.title || "Automatic from title"}/></label><label className="wide">SEO description<textarea value={String((draft.data.seo as Record<string, unknown> | undefined)?.description || "")} onChange={(event) => seoField("description", event.target.value)} placeholder={draft.excerpt || "Automatic from description"}/></label><label className="wide">Canonical URL<input value={String((draft.data.seo as Record<string, unknown> | undefined)?.canonical || "")} onChange={(event) => seoField("canonical", event.target.value)} placeholder="https://example.com/page"/></label><label className="wide">Social image<div className="builder-media-field"><input value={String((draft.data.seo as Record<string, unknown> | undefined)?.socialImage || "")} onChange={(event) => seoField("socialImage", event.target.value)} placeholder="Uses cover image when empty"/><button type="button" onClick={() => requestUpload((path) => seoField("socialImage", path))}><Upload size={14}/></button></div></label><label className="builder-check wide"><input type="checkbox" checked={(draft.data.seo as Record<string, unknown> | undefined)?.index !== false} onChange={(event) => seoField("index", event.target.checked)}/> Allow search engines to index this page</label></div></details>
          <label className="builder-check"><input type="checkbox" checked={draft.featured} onChange={(event) => field("featured", event.target.checked)}/> Feature this item prominently</label>
        </div>
        <div className="builder-blocks"><div className="builder-section-title"><div><small>Layout</small><strong>Content blocks</strong></div></div><div className="builder-block-palette">{(["text", "image", "quote", "video", "cta", "gallery", "stats", "timeline"] as ContentBlock["type"][]).map((type) => <button key={type} onClick={() => addBlock(type)}><Plus size={12}/>{blockLabel(type)}</button>)}</div>{draft.blocks.map((block, index) => <BlockEditor key={block.id} block={block} index={index} count={draft.blocks.length} update={(data) => updateBlock(block.id, { data: { ...block.data, ...data } })} move={moveBlock} remove={() => removeBlock(block.id)} upload={requestUpload}/>)}</div>
      </>}
      </div>
    </aside>
  </div>;
}

function BlockEditor({ block, index, count, update, move, remove, upload }: { block: ContentBlock; index: number; count: number; update: (data: Record<string, string | number | boolean | string[]>) => void; move: (index: number, movement: number) => void; remove: () => void; upload: (receiver: (path: string) => void) => void }) {
  const imageLike = ["image", "video", "cta"].includes(block.type);
  return <div className="builder-block"><div className="builder-block-head"><strong>{blockLabel(block.type)}</strong><span><button disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move block up"><ChevronUp size={14}/></button><button disabled={index === count - 1} onClick={() => move(index, 1)} aria-label="Move block down"><ChevronDown size={14}/></button><button onClick={remove} aria-label="Delete block"><Trash2 size={14}/></button></span></div>
    <input value={String(block.data.heading || "")} placeholder="Optional section heading" onChange={(event) => update({ heading: event.target.value })}/>
    <div className="builder-media-field"><textarea value={String(block.data.text || "")} placeholder={imageLike ? "URL or file path" : "Block content"} onChange={(event) => update({ text: event.target.value })}/>{block.type === "image" && <button type="button" onClick={() => upload((path) => update({ text: path }))} aria-label="Upload block image"><Upload size={14}/></button>}</div>
    {imageLike && <input value={String(block.data.label || block.data.alt || "")} placeholder={block.type === "image" ? "Image description" : "Label"} onChange={(event) => update(block.type === "image" ? { alt: event.target.value } : { label: event.target.value })}/>}<details><summary>Block appearance</summary><div className="builder-block-style"><input value={String(block.data.backgroundColor || "")} placeholder="Background color" onChange={(event) => update({ backgroundColor: event.target.value })}/><div className="builder-media-field"><input value={String(block.data.backgroundImage || "")} placeholder="Background image" onChange={(event) => update({ backgroundImage: event.target.value })}/><button type="button" onClick={() => upload((path) => update({ backgroundImage: path }))}><Upload size={13}/></button></div><input value={String(block.data.textColor || "")} placeholder="Text color" onChange={(event) => update({ textColor: event.target.value })}/><select value={String(block.data.align || "left")} onChange={(event) => update({ align: event.target.value })}><option value="left">Left aligned</option><option value="center">Centered</option><option value="right">Right aligned</option></select><label>Inner spacing — {Number(block.data.padding || 0)}px<input type="range" min="0" max="160" value={Number(block.data.padding || 0)} onChange={(event) => update({ padding: Number(event.target.value) })}/></label></div></details>
  </div>;
}

function TypeFields({ draft, setData }: { draft: Draft; setData: (key: string, value: unknown) => void }) {
  if (draft.type === "project") return <div className="builder-type-fields"><label>Year<input value={String(draft.data.year || "")} onChange={(event) => setData("year", event.target.value)}/></label><label>Format<input value={String(draft.data.format || "")} onChange={(event) => setData("format", event.target.value)}/></label><label>Genre<input value={String(draft.data.genre || "")} onChange={(event) => setData("genre", event.target.value)}/></label><label>Runtime<input value={String(draft.data.runtime || "")} onChange={(event) => setData("runtime", event.target.value)}/></label><label className="wide">Film URL<input value={String(draft.data.youtubeUrl || "")} onChange={(event) => setData("youtubeUrl", event.target.value)}/></label><label className="wide">Trailer URL<input value={String(draft.data.trailerUrl || "")} onChange={(event) => setData("trailerUrl", event.target.value)}/></label><label className="wide">Credits, one per line<textarea value={Array.isArray(draft.data.credits) ? draft.data.credits.join("\n") : ""} onChange={(event) => setData("credits", event.target.value.split(/\r?\n/).filter(Boolean))}/></label></div>;
  if (draft.type === "article") return <div className="builder-type-fields"><label>Category<input value={String(draft.data.category || "")} onChange={(event) => setData("category", event.target.value)}/></label><label>Author<input value={String(draft.data.author || "")} onChange={(event) => setData("author", event.target.value)}/></label></div>;
  if (draft.type === "page") return <div className="builder-type-fields"><label>Kicker<input value={String(draft.data.kicker || "")} onChange={(event) => setData("kicker", event.target.value)}/></label><label>Image description<input value={String(draft.data.imageAlt || "")} onChange={(event) => setData("imageAlt", event.target.value)}/></label></div>;
  if (draft.type === "team") return <label>Role<input value={String(draft.data.role || "")} onChange={(event) => setData("role", event.target.value)}/></label>;
  return <label>Service label<input value={String(draft.data.label || "")} onChange={(event) => setData("label", event.target.value)}/></label>;
}
