import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("public surfaces do not advertise admin access", async () => {
  const [chrome, maintenance] = await Promise.all([
    readFile(new URL("../../components/public/site-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../../app/maintenance/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(chrome, /AdminAccessLink|href=["']\/admin/);
  assert.doesNotMatch(maintenance, /href=["']\/admin|Admin access/);
});

test("standard login does not reveal the approved email", async () => {
  const login = await readFile(new URL("../../app/admin/login/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(login, /ADMIN_EMAIL|b28entertainment@gmail\.com|Authorized account/);
  assert.match(login, /Continue with Google/);
  assert.doesNotMatch(login, /login\/passkey/);
});
