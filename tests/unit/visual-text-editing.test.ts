import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { canEditVisualText, isTypingTarget } from "../../lib/visual-text-editing.ts";

test("all leaf website text, including nontraditional text tags, is directly editable", () => {
  for (const tag of ["h1", "p", "a", "button", "span", "div", "li", "td", "figcaption", "summary", "section", "footer"]) {
    assert.equal(canEditVisualText(tag, [], true), true, tag);
  }
  assert.equal(canEditVisualText("p", ["BR"], true), true);
  assert.equal(canEditVisualText("div", [], false), true, "empty text stays editable after deleting its last letter");
});

test("text editing never flattens nested website components or media", () => {
  assert.equal(canEditVisualText("section", ["h2", "p"], true), false);
  assert.equal(canEditVisualText("a", ["svg", "span"], true), false);
  for (const tag of ["svg", "script", "style", "input", "textarea", "iframe", "img"]) assert.equal(canEditVisualText(tag, [], true), false);
});

test("typing targets retain native character deletion, including inline toolbar fields", () => {
  assert.equal(isTypingTarget({ tagName: "SPAN", isContentEditable: true }), true);
  assert.equal(isTypingTarget({ tagName: "DIV", isContentEditable: true }), true);
  for (const tagName of ["INPUT", "TEXTAREA", "SELECT"]) assert.equal(isTypingTarget({ tagName }), true);
  assert.equal(isTypingTarget({ tagName: "SECTION", isContentEditable: false }), false);
  assert.equal(isTypingTarget(null), false);
});

test("runtime protects typing before component deletion and exposes adjacent text properties", async () => {
  const runtime = await readFile(new URL("../../components/public/visual-editor-runtime.tsx", import.meta.url), "utf8");
  const typingGuard = runtime.indexOf("if (isTypingTarget(event.target as HTMLElement) || event.isComposing) return;");
  const componentDelete = runtime.indexOf('&& multiple.length)');
  assert.ok(typingGuard >= 0 && typingGuard < componentDelete);
  assert.match(runtime, /selected\?\.isContentEditable && selected\.contains\(target\)/);
  assert.match(runtime, /const data = visualData\(selected, pathname\); const text = selected\.innerText/);
  for (const label of ["Font family", "Size", "Color", "Line height", "Spacing", "Text alignment"]) assert.ok(runtime.includes(`"${label}"`));
});
