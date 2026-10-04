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
