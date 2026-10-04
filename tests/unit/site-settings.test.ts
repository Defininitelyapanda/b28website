import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "../../lib/site-settings.ts";

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
