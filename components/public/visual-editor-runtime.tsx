"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { CustomElement, ElementOverride } from "@/lib/site-settings";

export type SelectedVisualElement = { path: string; selector: string; tag: string; label: string; text: string; src: string; href: string; alt: string; canEditText: boolean; styles: Record<string, string> };
type VisualCommand = { source: "b28-builder"; type: "apply"; override: ElementOverride } | { source: "b28-builder"; type: "select-clear" } | { source: "b28-builder"; type: "custom"; path: string; items: CustomElement[] };

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

function setElementText(element: HTMLElement, value: string) {
  const textNode = [...element.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
  if (textNode) textNode.textContent = value;
  else if (!element.children.length) element.textContent = value;
  else {
    const leaf = element.querySelector<HTMLElement>("span,em,strong");
    if (leaf) leaf.textContent = value;
  }
}

function applyOverride(override: ElementOverride) {
  const element = safeQuery(override.selector);
  if (!element) return;
  if (override.text !== undefined) setElementText(element, override.text);
  if (override.src !== undefined && element instanceof HTMLImageElement) element.src = override.src;
  if (override.href !== undefined && element instanceof HTMLAnchorElement) element.href = override.href;
  if (override.alt !== undefined && element instanceof HTMLImageElement) element.alt = override.alt;
  element.hidden = Boolean(override.hidden);
  for (const [property, value] of Object.entries(override.styles)) element.style.setProperty(property, value);
}

function customNode(item: CustomElement) {
  let element: HTMLElement;
  if (item.type === "image") { const image = document.createElement("img"); image.src = item.src; image.alt = item.content; element = image; }
  else if (item.type === "button") { const link = document.createElement("a"); link.href = item.href || "#"; link.textContent = item.content || "Button"; link.className = "button light"; element = link; }
  else if (item.type === "divider") element = document.createElement("hr");
  else if (item.type === "spacer") element = document.createElement("div");
  else { element = document.createElement(item.type === "heading" ? "h2" : "p"); element.textContent = item.content; }
  element.dataset.customElement = item.id;
  element.dataset.editId = `custom-${item.id}`;
  element.classList.add("visual-custom-element");
  for (const [property, value] of Object.entries(item.styles)) element.style.setProperty(property, value);
  if (item.type === "spacer" && !item.styles.height) element.style.height = "80px";
  return element;
}

function renderCustomElements(path: string, items: CustomElement[]) {
  const main = document.querySelector(".site-shell main");
  if (!main) return;
  let zone = main.querySelector<HTMLElement>(":scope > .visual-custom-zone");
  if (!zone) { zone = document.createElement("section"); zone.className = "visual-custom-zone wrap section-pad"; main.append(zone); }
  zone.replaceChildren(...items.filter((item) => item.path === path).sort((a, b) => a.order - b.order).map(customNode));
  zone.hidden = !zone.children.length;
}

export function VisualEditorRuntime({ overrides, customElements }: { overrides: ElementOverride[]; customElements: CustomElement[] }) {
  const pathname = usePathname();
  useEffect(() => {
    const applyAll = () => { renderCustomElements(pathname, customElements); overrides.filter((entry) => entry.path === pathname).forEach(applyOverride); };
    applyAll();
    const timer = window.setTimeout(applyAll, 150);
    const editing = new URLSearchParams(window.location.search).get("visual-editor") === "1";
    if (!editing) return () => window.clearTimeout(timer);
    document.documentElement.classList.add("visual-editing");
    let hovered: HTMLElement | null = null;
    let selected: HTMLElement | null = null;
    const hover = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *");
      if (!target || target.closest("script,style")) return;
      if (hovered && hovered !== selected) hovered.removeAttribute("data-visual-hover");
      hovered = target; if (hovered !== selected) hovered.dataset.visualHover = "true";
    };
    const choose = (event: MouseEvent) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>(".site-shell *");
      if (!target || target.closest("script,style")) return;
      event.preventDefault(); event.stopPropagation();
      selected?.removeAttribute("data-visual-selected"); selected = target; selected.dataset.visualSelected = "true";
      const computed = getComputedStyle(target);
      const payload: SelectedVisualElement = { path: pathname, selector: cssPath(target), tag: target.tagName.toLocaleLowerCase(), label: target.getAttribute("aria-label") || target.textContent?.trim().slice(0, 80) || target.tagName.toLocaleLowerCase(), text: target.innerText || "", src: target instanceof HTMLImageElement ? target.getAttribute("src") || "" : "", href: target instanceof HTMLAnchorElement ? target.getAttribute("href") || "" : "", alt: target instanceof HTMLImageElement ? target.alt : "", canEditText: !(target instanceof HTMLImageElement), styles: { color: computed.color, "background-color": computed.backgroundColor, "font-family": computed.fontFamily, "font-size": computed.fontSize, "font-weight": computed.fontWeight, "text-align": computed.textAlign, "line-height": computed.lineHeight, "letter-spacing": computed.letterSpacing, padding: computed.padding, margin: computed.margin, width: computed.width, height: computed.height, "border-radius": computed.borderRadius, opacity: computed.opacity } };
      window.parent.postMessage({ source: "b28-visual-editor", type: "selected", element: payload }, window.location.origin);
    };
    const message = (event: MessageEvent<VisualCommand>) => {
      if (event.origin !== window.location.origin || event.data?.source !== "b28-builder") return;
      if (event.data.type === "apply") applyOverride(event.data.override);
      if (event.data.type === "select-clear") { selected?.removeAttribute("data-visual-selected"); selected = null; }
      if (event.data.type === "custom") renderCustomElements(event.data.path, event.data.items);
    };
    document.addEventListener("mousemove", hover, true); document.addEventListener("click", choose, true); window.addEventListener("message", message);
    window.parent.postMessage({ source: "b28-visual-editor", type: "ready", path: pathname }, window.location.origin);
    return () => { window.clearTimeout(timer); document.documentElement.classList.remove("visual-editing"); document.removeEventListener("mousemove", hover, true); document.removeEventListener("click", choose, true); window.removeEventListener("message", message); };
  }, [pathname, overrides, customElements]);
  return null;
}
