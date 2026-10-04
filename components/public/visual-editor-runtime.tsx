"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { CustomElement, ElementOverride } from "@/lib/site-settings";

export type SelectedVisualElement = { path: string; selector: string; tag: string; label: string; text: string; src: string; href: string; alt: string; canEditText: boolean; styles: Record<string, string> };
type VisualCommand =
  | { source: "b28-builder"; type: "apply"; override: ElementOverride }
  | { source: "b28-builder"; type: "select-clear" }
  | { source: "b28-builder"; type: "custom"; path: string; items: CustomElement[] }
  | { source: "b28-builder"; type: "state"; path: string; overrides: ElementOverride[]; items: CustomElement[] };

const editableTextTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "button", "span", "em", "strong", "small", "label"]);

function tellParent(type: string, detail: Record<string, unknown> = {}) {
  window.parent.postMessage({ source: "b28-visual-editor", type, ...detail }, window.location.origin);
}

function safeQuery(selector: string) {
  try { return document.querySelector<HTMLElement>(selector); } catch { return null; }
}

function cssPath(element: HTMLElement) {
  if (element.dataset.editId) return `[data-edit-id="${CSS.escape(element.dataset.editId)}"]`;
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  while (current && !current.classList.contains("site-shell")) {
    let part = current.tagName.toLocaleLowerCase();
    if (current.id) { part += `#${CSS.escape(current.id)}`; parts.unshift(part); break; }
    const parentElement: HTMLElement | null = current.parentElement;
    if (parentElement) {
      const siblings = [...parentElement.children].filter((candidate) => candidate.tagName === current!.tagName);
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
    }
    parts.unshift(part); current = parentElement;
  }
  return `.site-shell ${parts.join(" > ")}`;
}

function visualData(element: HTMLElement, path: string): SelectedVisualElement {
  const computed = getComputedStyle(element);
  const tag = element.tagName.toLocaleLowerCase();
  return { path, selector: cssPath(element), tag, label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || tag, text: element.innerText || "", src: element instanceof HTMLImageElement || element instanceof HTMLIFrameElement ? element.getAttribute("src") || "" : "", href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "", alt: element instanceof HTMLImageElement ? element.alt : "", canEditText: editableTextTags.has(tag), styles: { color: computed.color, "background-color": computed.backgroundColor, "background-image": computed.backgroundImage, "font-family": computed.fontFamily, "font-size": computed.fontSize, "font-weight": computed.fontWeight, "text-align": computed.textAlign, "line-height": computed.lineHeight, "letter-spacing": computed.letterSpacing, padding: computed.padding, margin: computed.margin, width: computed.width, height: computed.height, "border-radius": computed.borderRadius, opacity: computed.opacity } };
}

function setElementText(element: HTMLElement, value: string) {
  if (editableTextTags.has(element.tagName.toLocaleLowerCase())) element.textContent = value;
}

function applyOverride(override: ElementOverride) {
  const element = safeQuery(override.selector);
  if (!element) return;
  if (override.text !== undefined) setElementText(element, override.text);
  if (override.src !== undefined && (element instanceof HTMLImageElement || element instanceof HTMLIFrameElement)) element.src = override.src;
  if (override.href !== undefined && element instanceof HTMLAnchorElement) element.href = override.href;
  if (override.alt !== undefined && element instanceof HTMLImageElement) element.alt = override.alt;
  element.hidden = Boolean(override.hidden);
  for (const [property, value] of Object.entries(override.styles)) element.style.setProperty(property, value);
}

function embedUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.hostname.includes("youtube.com")) { const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1); return id ? `https://www.youtube.com/embed/${id}` : value; }
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    return url.toString();
  } catch { return value; }
}

function customNode(item: CustomElement) {
  let element: HTMLElement;
  if (item.type === "image") { const image = document.createElement("img"); image.src = item.src; image.alt = item.content; element = image; }
  else if (item.type === "embed") { const frame = document.createElement("iframe"); frame.src = embedUrl(item.src || item.href); frame.title = item.content || "Embedded media"; frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"; frame.allowFullscreen = true; element = frame; }
  else if (item.type === "button") { const link = document.createElement("a"); link.href = item.href || "#"; link.textContent = item.content || "Button"; link.className = "button light"; element = link; }
  else if (item.type === "divider") element = document.createElement("hr");
  else if (item.type === "spacer") element = document.createElement("div");
  else { element = document.createElement(item.type === "heading" ? "h2" : "p"); element.textContent = item.content; }
  element.dataset.customElement = item.id; element.dataset.editId = `custom-${item.id}`; element.classList.add("visual-custom-element");
  for (const [property, value] of Object.entries(item.styles)) element.style.setProperty(property, value);
  if (item.type === "spacer" && !item.styles.height) element.style.height = "80px";
  if (item.type === "embed" && !item.styles.height) { element.style.width = "100%"; element.style.height = "min(70vh, 720px)"; }
  return element;
}

function renderCustomElements(path: string, items: CustomElement[]) {
  const main = document.querySelector(".site-shell main"); if (!main) return;
  document.querySelectorAll<HTMLElement>("[data-custom-element]").forEach((element) => element.remove());
  let zone = main.querySelector<HTMLElement>(":scope > .visual-custom-zone");
  if (!zone) { zone = document.createElement("section"); zone.className = "visual-custom-zone wrap section-pad"; main.append(zone); }
  zone.replaceChildren();
  for (const item of items.filter((entry) => entry.path === path).sort((a, b) => a.order - b.order)) {
    const node = customNode(item); const anchor = item.anchorSelector ? safeQuery(item.anchorSelector) : null;
    if (!anchor) zone.append(node);
    else if (item.placement === "before") anchor.before(node);
    else if (item.placement === "inside") anchor.append(node);
    else anchor.after(node);
  }
  zone.hidden = !zone.children.length;
}

function makeToolbar(path: string, selected: () => HTMLElement | null, selectElement: (element: HTMLElement) => void) {
  const toolbar = document.createElement("div"); toolbar.className = "visual-inline-toolbar"; toolbar.dataset.visualUi = "true"; document.body.append(toolbar);
  const action = (label: string, handler: () => void, className = "") => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = className; button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); handler(); }); toolbar.append(button); };
  const refresh = () => {
    const element = selected(); if (!element) { toolbar.hidden = true; return; }
    toolbar.hidden = false; toolbar.replaceChildren(); const data = visualData(element, path);
    if (data.canEditText) { action("Edit text", () => { element.setAttribute("contenteditable", "plaintext-only"); element.focus(); }); action("B", () => tellParent("change", { element: data, patch: { styles: { "font-weight": getComputedStyle(element).fontWeight === "700" ? "400" : "700" } } }), "strong"); action("I", () => tellParent("change", { element: data, patch: { styles: { "font-style": getComputedStyle(element).fontStyle === "italic" ? "normal" : "italic" } } }), "italic"); }
    if (element instanceof HTMLImageElement || element instanceof HTMLIFrameElement) action("Replace", () => tellParent("request-upload", { element: data, field: "src" }));
    else action("Background image", () => tellParent("request-upload", { element: data, field: "background-image" }));
    if (element instanceof HTMLAnchorElement) action("Link", () => { const href = window.prompt("Enter the link URL", element.getAttribute("href") || ""); if (href !== null) tellParent("change", { element: data, patch: { href } }); });
    action("Duplicate", () => tellParent("action", { action: "duplicate", element: data })); action("Delete", () => tellParent("action", { action: "delete", element: data }), "danger");
    const rect = element.getBoundingClientRect(); toolbar.style.left = `${Math.max(8, Math.min(window.innerWidth - toolbar.offsetWidth - 8, rect.left))}px`; toolbar.style.top = `${Math.max(8, rect.top - 45)}px`;
  };
  window.addEventListener("scroll", refresh, true); window.addEventListener("resize", refresh); return { toolbar, refresh, destroy: () => { toolbar.remove(); window.removeEventListener("scroll", refresh, true); window.removeEventListener("resize", refresh); }, selectElement };
}

export function VisualEditorRuntime({ overrides, customElements }: { overrides: ElementOverride[]; customElements: CustomElement[] }) {
  const pathname = usePathname();
  useEffect(() => {
    const applyAll = () => { renderCustomElements(pathname, customElements); overrides.filter((entry) => entry.path === pathname).forEach(applyOverride); };
    applyAll(); const timer = window.setTimeout(applyAll, 150); const editing = new URLSearchParams(window.location.search).get("visual-editor") === "1";
    if (!editing) return () => window.clearTimeout(timer);
    document.documentElement.classList.add("visual-editing"); let hovered: HTMLElement | null = null; let selected: HTMLElement | null = null; let editTimer = 0;
    const selectElement = (element: HTMLElement) => { selected?.removeAttribute("data-visual-selected"); if (selected && selected !== element) selected.removeAttribute("contenteditable"); selected = element; selected.dataset.visualSelected = "true"; const data = visualData(selected, pathname); tellParent("selected", { element: data }); if (data.canEditText) { selected.setAttribute("contenteditable", "plaintext-only"); selected.focus(); } toolbar.refresh(); };
    const toolbar = makeToolbar(pathname, () => selected, selectElement);
    const hover = (event: MouseEvent) => { const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *"); if (!target || target.closest("script,style") || (event.target as HTMLElement).closest("[data-visual-ui]")) return; if (hovered && hovered !== selected) hovered.removeAttribute("data-visual-hover"); hovered = target; if (hovered !== selected) hovered.dataset.visualHover = "true"; };
    const choose = (event: MouseEvent) => { if ((event.target as HTMLElement).closest("[data-visual-ui]")) return; const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *"); if (!target || target.closest("script,style")) return; event.preventDefault(); event.stopPropagation(); selectElement(target); };
    const input = (event: Event) => { const target = event.target as HTMLElement; if (!selected || target !== selected || !selected.isContentEditable) return; window.clearTimeout(editTimer); editTimer = window.setTimeout(() => tellParent("change", { element: visualData(selected!, pathname), patch: { text: selected!.innerText } }), 250); };
    const keyboard = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "z") { event.preventDefault(); tellParent("shortcut", { action: event.shiftKey ? "redo" : "undo" }); return; } if ((event.key === "Delete" || event.key === "Backspace") && selected && !selected.isContentEditable) { event.preventDefault(); tellParent("action", { action: "delete", element: visualData(selected, pathname) }); } };
    const message = (event: MessageEvent<VisualCommand>) => {
      if (event.origin !== window.location.origin || event.data?.source !== "b28-builder") return;
      const command = event.data;
      if (command.type === "apply") { applyOverride(command.override); toolbar.refresh(); }
      if (command.type === "custom") renderCustomElements(command.path, command.items);
      if (command.type === "state") { const commandPath = command.path; renderCustomElements(commandPath, command.items); command.overrides.filter((entry) => entry.path === commandPath).forEach(applyOverride); }
      if (command.type === "select-clear") { selected?.removeAttribute("data-visual-selected"); selected?.removeAttribute("contenteditable"); selected = null; toolbar.refresh(); }
    };
    document.addEventListener("mousemove", hover, true); document.addEventListener("click", choose, true); document.addEventListener("input", input, true); document.addEventListener("keydown", keyboard, true); window.addEventListener("message", message); tellParent("ready", { path: pathname });
    return () => { window.clearTimeout(timer); window.clearTimeout(editTimer); toolbar.destroy(); document.documentElement.classList.remove("visual-editing"); document.removeEventListener("mousemove", hover, true); document.removeEventListener("click", choose, true); document.removeEventListener("input", input, true); document.removeEventListener("keydown", keyboard, true); window.removeEventListener("message", message); };
  }, [pathname, overrides, customElements]);
  return null;
}
