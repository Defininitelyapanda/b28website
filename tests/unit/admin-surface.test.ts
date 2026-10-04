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

test("hidden studio does not include an authentication prompt", async () => {
  const studio = await readFile(new URL("../../app/admin2714/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(studio, /signIn|Google|passkey|password|ADMIN_EMAIL/);
  assert.match(studio, /AdminStudio/);
});
