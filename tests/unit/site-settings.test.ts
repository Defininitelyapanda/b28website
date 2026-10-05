import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "../../lib/site-settings.ts";

test("publishing retains locks, rotation, and editable gallery layouts", () => {
  const settings = normalizeSiteSettings({ elementOverrides: [{ id: "lock", path: "/", selector: "h1", tag: "h1", locked: true, styles: { rotate: "30deg" } }], customElements: [{ id: "layout", path: "/", type: "gallery", content: "", src: "", href: "", order: 0, columns: 3, cards: [{ image: "/image.jpg", heading: "Heading", body: "Body" }], styles: {} }] });
  assert.equal(settings.elementOverrides[0].locked, true);
  assert.equal(settings.elementOverrides[0].styles.rotate, "30deg");
  assert.equal(settings.customElements[0].type, "gallery");
  assert.equal(settings.customElements[0].columns, 3);
  assert.equal(settings.customElements[0].cards?.[0].heading, "Heading");
});
test("navigation tabs retain labels and reject executable link schemes", () => {
  const settings = normalizeSiteSettings({ navigationLinks: [{ label: "New page", href: "/new-page" }, { label: "Unsafe", href: "javascript:alert(1)" }] });
  assert.deepEqual(settings.navigationLinks, [{ label: "New page", href: "/new-page" }]);
});

test("merges visual settings without losing page defaults", () => {
  const settings = normalizeSiteSettings({ colors: { ...DEFAULT_SITE_SETTINGS.colors, accent: "#123456" }, pages: { ...DEFAULT_SITE_SETTINGS.pages, home: { ...DEFAULT_SITE_SETTINGS.pages.home, title: "A new title" } } });
  assert.equal(settings.colors.accent, "#123456");
  assert.equal(settings.pages.home.title, "A new title");
  assert.equal(settings.pages.home.heroImage, DEFAULT_SITE_SETTINGS.pages.home.heroImage);
  assert.equal(settings.pages.about.title, DEFAULT_SITE_SETTINGS.pages.about.title);
});

test("clamps layout controls and strips markup from advanced CSS", () => {
  const settings = normalizeSiteSettings({ layout: { maxWidth: 99, radius: 999, sectionSpacing: 1 }, customCss: "</style><script>alert(1)</script>.hero{color:red}" } as never);
  assert.equal(settings.layout.maxWidth, 900);
  assert.equal(settings.layout.radius, 60);
  assert.equal(settings.layout.sectionSpacing, 32);
  assert.equal(settings.customCss.includes("<"), false);
});

test("preserves individual element edits and custom canvas elements", () => {
  const settings = normalizeSiteSettings({
    elementOverrides: [{ id: "hero-title", path: "/", selector: ".site-shell h1", tag: "h1", text: "Changed", styles: { color: "#ffffff", "font-size": "72px" } }],
    customElements: [
      { id: "new-copy", path: "/about", type: "text", content: "Added in the canvas", src: "", href: "", order: 0, anchorSelector: ".site-shell main > section:first-child", placement: "after", styles: { padding: "20px" } },
      { id: "showreel", path: "/about", type: "embed", content: "Showreel", src: "https://youtu.be/example", href: "", order: 1, anchorSelector: ".site-shell main", placement: "inside", styles: { width: "100%" } },
    ],
  } as never);
  assert.equal(settings.elementOverrides[0].text, "Changed");
  assert.equal(settings.elementOverrides[0].styles["font-size"], "72px");
  assert.equal(settings.customElements[0].content, "Added in the canvas");
  assert.equal(settings.customElements[0].path, "/about");
  assert.equal(settings.customElements[0].anchorSelector, ".site-shell main > section:first-child");
  assert.equal(settings.customElements[0].placement, "after");
  assert.equal(settings.customElements[1].type, "embed");
  assert.equal(settings.customElements[1].src, "https://youtu.be/example");
});
