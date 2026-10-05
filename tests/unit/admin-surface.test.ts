import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public surfaces do not advertise admin access", async () => {
  const [chrome, maintenance] = await Promise.all([
    readFile(new URL("../../components/public/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/maintenance/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(chrome, /AdminAccessLink|admin2714|href=["']\/admin/);
  assert.doesNotMatch(maintenance, /admin2714|href=["']\/admin|Admin access/);
});

test("hidden route opens the visual builder without an authentication prompt", async () => {
  const [page, builder] = await Promise.all([
    readFile(new URL("../../app/admin2714/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../components/builder/site-builder.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(page, /signIn|Google|passkey|password|ADMIN_EMAIL|AdminStudio|AdminNav/);
  assert.match(page, /SiteBuilder/);
  assert.match(builder, /Live site/);
  assert.match(builder, /Publish/);
  assert.match(builder, /Content blocks/);
});

test("Wasmer deployment uses one persistent regional CMS volume", async () => {
  const [config, packageFile, buildScript, store] = await Promise.all([
    readFile(new URL("../../app.yaml", import.meta.url), "utf8"),
    readFile(new URL("../../package.json", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/next-build.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../lib/local-store.ts", import.meta.url), "utf8"),
  ]);
  assert.match(config, /^kind:\s*wasmer\.io\/App\.v1/m);
  assert.match(config, /CMS_DATA_DIR:\s*["']?\/data\/cms/);
  assert.match(config, /CMS_UPLOAD_DIR:\s*["']?\/data\/uploads/);
  assert.match(config, /mount:\s*\/data/);
  assert.match(config, /fr-roub1/);
  assert.match(packageFile, /node scripts\/next-build\.mjs/);
  assert.match(buildScript, /B28_BUILD_PHASE:\s*["']1["']/);
  assert.match(store, /isBuildPhase \? undefined : process\.env\.CMS_DATA_DIR/);
});

test("Cloudflare deployment binds persistent D1 and R2 storage", async () => {
  const [config, packageFile, deployScript, store, storage] = await Promise.all([
    readFile(new URL("../../cloudflare.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../../package.json", import.meta.url), "utf8"),
    readFile(new URL("../../scripts/vinext.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../lib/local-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/storage.ts", import.meta.url), "utf8"),
  ]);
  assert.match(config, /CMS_DB:\s*bindings\.d1\(\{ name: ["']b28-cms["']/);
  assert.match(config, /CMS_MEDIA:\s*bindings\.r2\(\{ name: ["']b28-media["']/);
  assert.match(config, /NEXT_PUBLIC_SITE_URL/);
  assert.match(packageFile, /deploy:vinext/);
  assert.match(deployScript, /b28website\.tonniekye\.workers\.dev/);
  assert.match(store, /cloudflareCmsDatabase/);
  assert.match(storage, /cloudflareMediaBucket/);
});

test("dynamic pages cannot be held open by no-op CMS writes or the YouTube feed", async () => {
  const [cms, store, youtube] = await Promise.all([
    readFile(new URL("../../lib/cms.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/local-store.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/youtube-projects.ts", import.meta.url), "utf8"),
  ]);
  assert.match(cms, /const current = await readStore\(\)/);
  assert.match(cms, /current\.content\.some/);
  assert.match(store, /JSON\.stringify\(store\) !== previous/);
  assert.match(youtube, /AbortSignal\.timeout\(FEED_TIMEOUT_MS\)/);
});

test("visual editor supports inline controls, history shortcuts, anchored elements, and secure embeds", async () => {
  const [builder, runtime, inspector, config] = await Promise.all([
    readFile(new URL("../../components/builder/site-builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../components/public/visual-editor-runtime.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../components/builder/element-inspector.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../next.config.ts", import.meta.url), "utf8"),
  ]);
  assert.match(builder, /designHistoryIndex/);
  assert.match(builder, /designHistoryIndexRef/);
  assert.match(builder, /Back to last saved/);
  assert.match(builder, /action: "discard-draft"/);
  const restoreDesign = builder.match(/function restoreDesign[\s\S]*?\n  }/)?.[0] || "";
  assert.match(restoreDesign, /sendDesignState\(next\)/);
  assert.doesNotMatch(restoreDesign, /setPreviewKey/);
  assert.match(runtime, /contenteditable/);
  assert.match(runtime, /visual-inline-toolbar/);
  assert.match(runtime, /visual-move-handle/);
  assert.match(runtime, /visual-resize-handle/);
  assert.match(runtime, /restoreElements\(snapshots\)/);
  assert.match(runtime, /action: event\.shiftKey \? "redo" : "undo"/);
  assert.match(runtime, /previous\.after\(node\)/);
  assert.match(inspector, /Video \/ embed/);
  assert.match(inspector, /Background image/);
  assert.match(config, /frame-src 'self' https:/);
});

test("site design uses isolated autosaved drafts, publish snapshots, and safe mode", async () => {
  const [builder, cms, route, adminPage, proxy, store] = await Promise.all([
    readFile(new URL("../../components/builder/site-builder.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../lib/cms.ts", import.meta.url), "utf8"),
    readFile(new URL("../../app/api/admin2714/site/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../../app/admin2714/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../proxy.ts", import.meta.url), "utf8"),
    readFile(new URL("../../lib/local-store.ts", import.meta.url), "utf8"),
  ]);
  assert.match(builder, /action: "save-draft"/);
  assert.match(builder, /Publish changes/);
  assert.match(builder, /Back to last saved/);
  assert.match(cms, /site-design-draft/);
  assert.match(cms, /Automatic pre-publish snapshot/);
  assert.match(route, /discard-draft/);
  assert.match(adminPage, /safeMode/);
  assert.match(proxy, /ADMIN_AUTH_REQUIRED/);
  assert.match(store, /drafts: Array/);
  assert.match(cms, /input\.status === "published"/);
  assert.match(cms, /store\.drafts = store\.drafts\.filter/);
});
