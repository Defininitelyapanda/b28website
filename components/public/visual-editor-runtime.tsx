"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { CustomElement, ElementOverride } from "@/lib/site-settings";
import { resizeGeometry, rotationDelta, type ResizeHandle } from "@/lib/transform-geometry";

export type SelectedVisualElement = { path: string; selector: string; tag: string; label: string; text: string; src: string; href: string; alt: string; canEditText: boolean; locked?: boolean; styles: Record<string, string> };
type VisualCommand =
  | { source: "b28-builder"; type: "apply"; override: ElementOverride }
  | { source: "b28-builder"; type: "select-clear" }
  | { source: "b28-builder"; type: "select-all" }
  | { source: "b28-builder"; type: "custom"; path: string; items: CustomElement[] }
  | { source: "b28-builder"; type: "state"; path: string; overrides: ElementOverride[]; items: CustomElement[] };

const editableTextTags = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "button", "span", "em", "strong", "small", "label"]);
type ElementSnapshot = { selector: string; html: string; style: string | null; hidden: boolean; src: string | null; href: string | null; alt: string | null; locked: string | null };

function isLocked(element: HTMLElement) { return Boolean(element.closest('[data-editor-locked="true"]')); }

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
  return { path, selector: cssPath(element), tag, label: element.getAttribute("aria-label") || element.textContent?.trim().slice(0, 80) || tag, text: element.innerText || "", src: element instanceof HTMLImageElement || element instanceof HTMLIFrameElement ? element.getAttribute("src") || "" : "", href: element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "", alt: element instanceof HTMLImageElement ? element.alt : "", locked: isLocked(element), canEditText: editableTextTags.has(tag) && !isLocked(element), styles: { color: computed.color, "background-color": computed.backgroundColor, "background-image": computed.backgroundImage, "font-family": computed.fontFamily, "font-size": computed.fontSize, "font-weight": computed.fontWeight, "text-align": computed.textAlign, "line-height": computed.lineHeight, "letter-spacing": computed.letterSpacing, padding: computed.padding, margin: computed.margin, width: computed.width, height: computed.height, "border-radius": computed.borderRadius, opacity: computed.opacity, rotate: computed.rotate } };
}

function setElementText(element: HTMLElement, value: string) {
  if (editableTextTags.has(element.tagName.toLocaleLowerCase()) && element.textContent !== value) element.textContent = value;
}

function applyOverride(override: ElementOverride) {
  const element = safeQuery(override.selector);
  if (!element) return;
  if (override.text !== undefined) setElementText(element, override.text);
  if (override.src !== undefined && (element instanceof HTMLImageElement || element instanceof HTMLIFrameElement)) element.src = override.src;
  if (override.href !== undefined && element instanceof HTMLAnchorElement) element.href = override.href;
  if (override.alt !== undefined && element instanceof HTMLImageElement) element.alt = override.alt;
  element.hidden = Boolean(override.hidden);
  if (override.locked) { element.dataset.editorLocked = "true"; element.removeAttribute("contenteditable"); } else delete element.dataset.editorLocked;
  for (const [property, value] of Object.entries(override.styles)) element.style.setProperty(property, value);
}

function rememberElement(selector: string, snapshots: Map<string, ElementSnapshot>) {
  if (snapshots.has(selector)) return;
  const element = safeQuery(selector); if (!element) return;
  snapshots.set(selector, { selector, html: element.innerHTML, style: element.getAttribute("style"), hidden: element.hidden, src: element.getAttribute("src"), href: element.getAttribute("href"), alt: element.getAttribute("alt"), locked: element.getAttribute("data-editor-locked") });
}

function restoreElements(snapshots: Map<string, ElementSnapshot>) {
  const attribute = (element: HTMLElement, name: string, value: string | null) => value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
  for (const snapshot of snapshots.values()) {
    const element = safeQuery(snapshot.selector); if (!element) continue;
    element.innerHTML = snapshot.html; attribute(element, "style", snapshot.style); attribute(element, "src", snapshot.src); attribute(element, "href", snapshot.href); attribute(element, "alt", snapshot.alt); attribute(element, "data-editor-locked", snapshot.locked); element.hidden = snapshot.hidden;
  }
}

function embedUrl(value: string) {
  try {
    const url = new URL(value, window.location.origin);
    if (url.hostname.includes("youtube.com")) { const id = url.searchParams.get("v") || url.pathname.split("/").filter(Boolean).at(-1); return id ? `https://www.youtube.com/embed/${id}` : value; }
    if (url.hostname === "youtu.be") return `https://www.youtube.com/embed/${url.pathname.slice(1)}`;
    return url.toString();
  } catch { return value; }
}

function customNode(item: CustomElement, safeMode = false) {
  let element: HTMLElement;
  if (item.type === "image") { const image = document.createElement("img"); image.src = item.src; image.alt = item.content; element = image; }
  else if (item.type === "embed" && safeMode) { element = document.createElement("div"); element.textContent = "Embedded media disabled in safe mode"; element.className = "visual-safe-placeholder"; }
  else if (item.type === "embed") { const frame = document.createElement("iframe"); frame.src = embedUrl(item.src || item.href); frame.title = item.content || "Embedded media"; frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"; frame.allowFullscreen = true; element = frame; }
  else if (item.type === "button") { const link = document.createElement("a"); link.href = item.href || "#"; link.textContent = item.content || "Button"; link.className = "button light"; element = link; }
  else if (item.type === "divider") element = document.createElement("hr");
  else if (item.type === "spacer") element = document.createElement("div");
  else if (item.type === "gallery") {
    element = document.createElement("section"); element.className = "visual-image-layout"; element.style.setProperty("--layout-columns", String(item.columns || 1)); element.style.setProperty("--layout-mobile-columns", String(Math.min(item.columns || 1, 2)));
    (item.cards || []).forEach((card, index) => {
      const cell = document.createElement("article"); cell.dataset.editId = `custom-${item.id}-card-${index}`;
      const image = document.createElement("img"); image.src = card.image; image.alt = card.heading || "Image"; image.dataset.editId = `custom-${item.id}-image-${index}`; cell.append(image);
      if (card.heading) { const heading = document.createElement("h3"); heading.textContent = card.heading; heading.dataset.editId = `custom-${item.id}-heading-${index}`; cell.append(heading); }
      if (card.body) { const body = document.createElement("p"); body.textContent = card.body; body.dataset.editId = `custom-${item.id}-body-${index}`; cell.append(body); }
      element.append(cell);
    });
  }
  else if (["section", "header", "footer"].includes(item.type)) {
    element = document.createElement(item.type); element.className = "visual-inserted-section";
    if (item.type !== "section") { const heading = document.createElement("h2"); heading.textContent = item.type === "header" ? "Your new header" : "Your new footer"; heading.dataset.editId = `custom-${item.id}-title`; element.append(heading); }
  }
  else { element = document.createElement(item.type === "heading" ? "h2" : "p"); element.textContent = item.content; }
  element.dataset.customElement = item.id; element.dataset.editId = `custom-${item.id}`; element.classList.add("visual-custom-element");
  for (const [property, value] of Object.entries(item.styles)) element.style.setProperty(property, value);
  if (item.type === "spacer" && !item.styles.height) element.style.height = "80px";
  if (item.type === "embed" && !item.styles.height) { element.style.width = "100%"; element.style.height = "min(70vh, 720px)"; }
  return element;
}

function renderCustomElements(path: string, items: CustomElement[], safeMode = false) {
  const main = document.querySelector(".site-shell main"); if (!main) return;
  document.querySelectorAll<HTMLElement>("[data-custom-element]").forEach((element) => element.remove());
  let zone = main.querySelector<HTMLElement>(":scope > .visual-custom-zone");
  if (!zone) { zone = document.createElement("section"); zone.className = "visual-custom-zone wrap section-pad"; main.append(zone); }
  zone.replaceChildren();
  const afterAnchors = new Map<HTMLElement, HTMLElement>();
  for (const item of items.filter((entry) => entry.path === path).sort((a, b) => a.order - b.order)) {
    const node = customNode(item, safeMode); const anchor = item.anchorSelector ? safeQuery(item.anchorSelector) : null;
    if (!anchor) zone.append(node);
    else if (item.placement === "before") anchor.before(node);
    else if (item.placement === "inside" && !["IMG", "HR", "IFRAME", "INPUT"].includes(anchor.tagName)) anchor.append(node);
    else { const previous = afterAnchors.get(anchor) || anchor; previous.after(node); afterAnchors.set(anchor, node); }
  }
  zone.hidden = !zone.children.length;
}

function makeToolbar(path: string, selected: () => HTMLElement | null, selectElement: (element: HTMLElement) => void) {
  const toolbar = document.createElement("div"); toolbar.className = "visual-inline-toolbar"; toolbar.dataset.visualUi = "true"; document.body.append(toolbar);
  const transform = document.createElement("div"); transform.className = "visual-transform-box"; transform.dataset.visualUi = "true"; document.body.append(transform);
  let cancelDrag: (() => void) | null = null;
  const action = (label: string, handler: () => void, className = "") => { const button = document.createElement("button"); button.type = "button"; button.textContent = label; button.className = className; button.addEventListener("click", (event) => { event.preventDefault(); event.stopPropagation(); handler(); }); toolbar.append(button); };
  const refresh = () => {
    const element = selected(); if (!element || !element.isConnected) { toolbar.hidden = true; transform.hidden = true; return; }
    toolbar.hidden = false; toolbar.replaceChildren(); const data = visualData(element, path);
    const lockOwner = element.closest<HTMLElement>('[data-editor-locked="true"]') || element;
    action(data.locked ? "Unlock" : "Lock", () => tellParent("change", { element: visualData(lockOwner, path), patch: { locked: !data.locked } }));
    if (!data.locked) {
      if (data.canEditText) { action("Edit text", () => { element.setAttribute("contenteditable", "plaintext-only"); element.focus(); }); action("B", () => tellParent("change", { element: data, patch: { styles: { "font-weight": getComputedStyle(element).fontWeight === "700" ? "400" : "700" } } }), "strong"); action("I", () => tellParent("change", { element: data, patch: { styles: { "font-style": getComputedStyle(element).fontStyle === "italic" ? "normal" : "italic" } } }), "italic"); }
      if (element instanceof HTMLImageElement || element instanceof HTMLIFrameElement) action("Replace", () => tellParent("request-upload", { element: data, field: "src" }));
      else action("Background image", () => tellParent("request-upload", { element: data, field: "background-image" }));
      if (element instanceof HTMLAnchorElement) action("Link", () => { const href = window.prompt("Enter the link URL", element.getAttribute("href") || ""); if (href !== null) tellParent("change", { element: data, patch: { href } }); });
      action("Duplicate", () => tellParent("action", { action: "duplicate", element: data })); action("Delete", () => tellParent("action", { action: "delete", element: data }), "danger");
    }
    const rect = element.getBoundingClientRect(); toolbar.style.left = `${Math.max(8, Math.min(window.innerWidth - toolbar.offsetWidth - 8, rect.left))}px`; toolbar.style.top = `${Math.max(8, rect.top - 65)}px`;
    transform.hidden = Boolean(data.locked); const width = element.offsetWidth; const height = element.offsetHeight;
    transform.style.left = `${rect.left + rect.width / 2 - width / 2}px`; transform.style.top = `${rect.top + rect.height / 2 - height / 2}px`; transform.style.width = `${width}px`; transform.style.height = `${height}px`; transform.style.rotate = getComputedStyle(element).rotate;
  };
  const beginTransform = (mode: "move" | "rotate" | ResizeHandle, event: PointerEvent) => {
    const element = selected(); if (!element || isLocked(element) || event.button !== 0) return;
    cancelDrag?.(); event.preventDefault(); event.stopPropagation(); element.removeAttribute("contenteditable");
    const handle = event.currentTarget instanceof HTMLElement ? event.currentTarget : event.target as HTMLElement; const pointerId = event.pointerId; handle.setPointerCapture(pointerId);
    const startX = event.clientX; const startY = event.clientY; const rect = element.getBoundingClientRect(); const computed = getComputedStyle(element);
    const width = element.offsetWidth; const height = element.offsetHeight; const angle = Number.parseFloat(computed.rotate) || 0;
    const left = Number.parseFloat(element.style.left) || 0; const top = Number.parseFloat(element.style.top) || 0; let changed = false; let ended = false;
    const previousCursor = document.documentElement.style.cursor; document.documentElement.style.cursor = mode === "move" ? "grabbing" : mode === "rotate" ? "crosshair" : getComputedStyle(handle).cursor; document.documentElement.classList.add("visual-dragging");
    const originalStyle = element.getAttribute("style");
    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      if (!pointer.buttons) { finish(); return; }
      const dx = pointer.clientX - startX; const dy = pointer.clientY - startY; if (!changed && Math.hypot(dx, dy) < 3) return; changed = true;
      if (mode === "rotate") { let rotation = angle + rotationDelta(startX, startY, pointer.clientX, pointer.clientY, rect.left + rect.width / 2, rect.top + rect.height / 2); if (pointer.shiftKey) rotation = Math.round(rotation / 15) * 15; element.style.rotate = `${Math.round(rotation)}deg`; }
      else {
        element.style.position = computed.position === "static" ? "relative" : computed.position;
        if (mode === "move") { element.style.left = `${Math.round(left + dx)}px`; element.style.top = `${Math.round(top + dy)}px`; }
        else { const next = resizeGeometry(width, height, dx, dy, mode, angle); if (computed.display === "inline") element.style.display = "inline-block"; element.style.boxSizing = "border-box"; element.style.minWidth = "0"; element.style.minHeight = "0"; element.style.maxWidth = "none"; element.style.maxHeight = "none"; element.style.flexShrink = "0"; element.style.width = `${Math.round(next.width)}px`; element.style.height = `${Math.round(next.height)}px`; element.style.left = `${Math.round(left + next.left)}px`; element.style.top = `${Math.round(top + next.top)}px`; }
      }
      refresh();
    };
    const finish = (cancelled = false) => {
      if (ended) return; ended = true;
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", cancel); window.removeEventListener("blur", cancel); handle.removeEventListener("lostpointercapture", lost);
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId); document.documentElement.style.cursor = previousCursor; document.documentElement.classList.remove("visual-dragging"); cancelDrag = null;
      if (cancelled) { if (originalStyle === null) element.removeAttribute("style"); else element.setAttribute("style", originalStyle); }
      else if (changed) tellParent("change", { element: visualData(element, path), patch: { styles: Object.fromEntries(["position", "left", "top", "display", "box-sizing", "width", "height", "rotate", "min-width", "min-height", "max-width", "max-height", "flex-shrink"].map((property) => [property, element.style.getPropertyValue(property)])) } });
      selectElement(element); refresh();
    };
    const up = (pointer: PointerEvent) => { if (pointer.pointerId === pointerId) finish(); };
    const cancel = () => finish(true); const lost = () => finish(); cancelDrag = cancel;
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", cancel); window.addEventListener("blur", cancel); handle.addEventListener("lostpointercapture", lost);
  };
  const addHandle = (mode: "move" | "rotate" | ResizeHandle, label: string) => { const button = document.createElement("button"); button.type = "button"; button.className = mode === "move" ? "visual-move-handle" : mode === "rotate" ? "visual-rotate-handle" : `visual-resize-handle handle-${mode}`; button.title = label; button.setAttribute("aria-label", label); if (mode === "move") button.textContent = "✥"; if (mode === "rotate") button.textContent = "↻"; button.addEventListener("pointerdown", (event) => beginTransform(mode, event)); transform.append(button); };
  addHandle("move", "Drag to reposition"); addHandle("rotate", "Drag to rotate (Shift snaps to 15 degrees)");
  (["n","s","e","w","ne","nw","se","sw"] as ResizeHandle[]).forEach((handle) => addHandle(handle, ["e","w"].includes(handle) ? "Drag to adjust width" : ["n","s"].includes(handle) ? "Drag to adjust height" : "Drag to resize corner"));
  window.addEventListener("scroll", refresh, true); window.addEventListener("resize", refresh);
  return { toolbar, refresh, beginMove: (event: PointerEvent) => beginTransform("move", event), destroy: () => { cancelDrag?.(); toolbar.remove(); transform.remove(); window.removeEventListener("scroll", refresh, true); window.removeEventListener("resize", refresh); } };
}

export function VisualEditorRuntime({ overrides, customElements }: { overrides: ElementOverride[]; customElements: CustomElement[] }) {
  const pathname = usePathname();
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search); const safeMode = parameters.get("safe") === "1";
    const snapshots = new Map<string, ElementSnapshot>();
    let activeOverrides = overrides;
    let stateFrame = 0;
    const applyTracked = (override: ElementOverride) => { rememberElement(override.selector, snapshots); applyOverride(override); };
    const applyAll = () => { renderCustomElements(pathname, customElements, safeMode); overrides.filter((entry) => entry.path === pathname).forEach(applyTracked); };
    applyAll(); const timer = window.setTimeout(applyAll, 150); const editing = parameters.get("visual-editor") === "1";
    if (safeMode) { document.documentElement.classList.add("visual-safe-mode"); document.querySelectorAll("video").forEach((video) => video.pause()); }
    if (!editing) return () => { window.clearTimeout(timer); document.documentElement.classList.remove("visual-safe-mode"); };
    document.documentElement.classList.add("visual-editing"); let hovered: HTMLElement | null = null; let selected: HTMLElement | null = null; let editTimer = 0; let multiple: HTMLElement[] = [];
    const clearMultiple = () => { multiple.forEach((element) => element.removeAttribute("data-visual-multi-selected")); multiple = []; };
    const selectElement = (element: HTMLElement) => { clearMultiple(); selected?.removeAttribute("data-visual-selected"); if (selected && selected !== element) selected.removeAttribute("contenteditable"); selected = element; selected.dataset.visualSelected = "true"; const data = visualData(selected, pathname); rememberElement(data.selector, snapshots); tellParent("selected", { element: data }); if (data.canEditText) { selected.setAttribute("contenteditable", "plaintext-only"); selected.focus(); } toolbar.refresh(); };
    const toolbar = makeToolbar(pathname, () => selected, selectElement);
    const selectAll = () => {
      if (selected?.isContentEditable) { const range = document.createRange(); range.selectNodeContents(selected); const selection = window.getSelection(); selection?.removeAllRanges(); selection?.addRange(range); return; }
      const area = selected || document.querySelector<HTMLElement>(".site-shell"); if (!area) return;
      clearMultiple(); window.getSelection()?.removeAllRanges();
      multiple = [...area.querySelectorAll<HTMLElement>("h1,h2,h3,h4,h5,h6,p,img,a,button,hr,iframe,section,header,footer,[data-edit-id]")].filter((element) => !element.closest("[data-visual-ui]") && element.getClientRects().length > 0);
      if (!multiple.length && selected) multiple = [selected];
      multiple.forEach((element) => { element.dataset.visualMultiSelected = "true"; rememberElement(cssPath(element), snapshots); });
      tellParent("selection", { elements: multiple.map((element) => visualData(element, pathname)) });
    };
    const pointerDown = (event: PointerEvent) => { const target = event.target as HTMLElement; if (selected && selected === target && !selected.isContentEditable && !target.closest("[data-visual-ui]") && !isLocked(selected)) toolbar.beginMove(event); };
    const hover = (event: MouseEvent) => { const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *"); if (!target || target.closest("script,style") || (event.target as HTMLElement).closest("[data-visual-ui]")) return; if (hovered && hovered !== selected) hovered.removeAttribute("data-visual-hover"); hovered = target; if (hovered !== selected) hovered.dataset.visualHover = "true"; };
    const choose = (event: MouseEvent) => { if ((event.target as HTMLElement).closest("[data-visual-ui]")) return; const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *"); if (!target || target.closest("script,style")) return; event.preventDefault(); event.stopPropagation(); selectElement(target.closest<HTMLElement>('[data-editor-locked="true"]') || target); };
    const input = (event: Event) => { const target = event.target as HTMLElement; if (!selected || target !== selected || !selected.isContentEditable) return; window.clearTimeout(editTimer); editTimer = window.setTimeout(() => tellParent("change", { element: visualData(selected!, pathname), patch: { text: selected!.innerText } }), 250); };
    const keyboard = (event: KeyboardEvent) => {
      const key = event.key.toLocaleLowerCase(); const command = event.ctrlKey || event.metaKey;
      if (command && key === "a" && (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
      if (command && key === "a") { event.preventDefault(); selectAll(); return; }
      if (command && key === "z") { event.preventDefault(); tellParent("shortcut", { action: event.shiftKey ? "redo" : "undo" }); return; }
      if (command && key === "s") { event.preventDefault(); tellParent("shortcut", { action: "save" }); return; }
      if (command && key === "p") { event.preventDefault(); tellParent("shortcut", { action: "preview" }); return; }
      if (command && !selected?.isContentEditable && (key === "c" || key === "v")) { event.preventDefault(); tellParent("shortcut", { action: key === "c" ? "copy" : "paste" }); return; }
      if (event.key === "Escape") { event.preventDefault(); tellParent("shortcut", { action: "deselect" }); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && multiple.length) { event.preventDefault(); tellParent("action", { action: "delete-selection", elements: multiple.filter((element) => !isLocked(element) && !element.querySelector('[data-editor-locked="true"]')).map((element) => visualData(element, pathname)) }); clearMultiple(); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && selected && !selected.isContentEditable && !isLocked(selected)) { event.preventDefault(); tellParent("action", { action: "delete", element: visualData(selected, pathname) }); }
    };
    const message = (event: MessageEvent<VisualCommand>) => {
      if (event.source !== window.parent || event.origin !== window.location.origin || event.data?.source !== "b28-builder") return;
      const command = event.data;
      if (command.type === "apply") { activeOverrides = [...activeOverrides.filter((entry) => !(entry.path === command.override.path && entry.selector === command.override.selector)), command.override]; applyTracked(command.override); toolbar.refresh(); }
      if (command.type === "custom") { const selector = selected ? cssPath(selected) : null; renderCustomElements(command.path, command.items, safeMode); activeOverrides.filter((entry) => entry.path === command.path).forEach(applyTracked); if (selector) { selected = safeQuery(selector); if (selected) selected.dataset.visualSelected = "true"; } toolbar.refresh(); }
      if (command.type === "state") { activeOverrides = command.overrides; const commandPath = command.path; restoreElements(snapshots); renderCustomElements(commandPath, command.items, safeMode); command.overrides.filter((entry) => entry.path === commandPath).forEach(applyTracked); toolbar.refresh(); window.cancelAnimationFrame(stateFrame); stateFrame = window.requestAnimationFrame(() => { command.overrides.filter((entry) => entry.path === commandPath).forEach(applyTracked); toolbar.refresh(); }); }
      if (command.type === "select-all") selectAll();
      if (command.type === "select-clear") { clearMultiple(); selected?.removeAttribute("data-visual-selected"); selected?.removeAttribute("contenteditable"); selected = null; toolbar.refresh(); }
    };
    document.addEventListener("pointerdown", pointerDown, true); document.addEventListener("mousemove", hover, true); document.addEventListener("click", choose, true); document.addEventListener("input", input, true); document.addEventListener("keydown", keyboard, true); window.addEventListener("message", message); tellParent("ready", { path: pathname });
    return () => { window.clearTimeout(timer); window.clearTimeout(editTimer); window.cancelAnimationFrame(stateFrame); toolbar.destroy(); document.documentElement.classList.remove("visual-editing", "visual-safe-mode"); clearMultiple(); document.removeEventListener("pointerdown", pointerDown, true); document.removeEventListener("mousemove", hover, true); document.removeEventListener("click", choose, true); document.removeEventListener("input", input, true); document.removeEventListener("keydown", keyboard, true); window.removeEventListener("message", message); };
  }, [pathname, overrides, customElements]);
  return null;
}
