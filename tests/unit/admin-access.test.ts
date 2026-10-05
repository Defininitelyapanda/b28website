import assert from "node:assert/strict";
import test from "node:test";
import { adminAccess, adminAuthEnabled } from "../../lib/admin-access.ts";

function environment(enabled: string | undefined, token: string | undefined) {
  if (enabled === undefined) delete process.env.ADMIN_AUTH_ENABLED; else process.env.ADMIN_AUTH_ENABLED = enabled;
  if (token === undefined) delete process.env.ADMIN_SESSION_TOKEN; else process.env.ADMIN_SESSION_TOKEN = token;
}

test("admin access remains open only while the development switch is disabled", () => {
  const previousEnabled = process.env.ADMIN_AUTH_ENABLED; const previousToken = process.env.ADMIN_SESSION_TOKEN;
  try { environment("false", undefined); assert.equal(adminAuthEnabled(), false); assert.equal(adminAccess(new Request("https://example.test/admin2714")).allowed, true); }
  finally { environment(previousEnabled, previousToken); }
});

test("enabled admin access rejects missing configuration and invalid sessions", () => {
  const previousEnabled = process.env.ADMIN_AUTH_ENABLED; const previousToken = process.env.ADMIN_SESSION_TOKEN;
  try {
    environment("true", undefined); assert.deepEqual(adminAccess(new Request("https://example.test/admin2714")), { allowed: false, configured: false });
    environment("true", "correct-secret"); assert.deepEqual(adminAccess(new Request("https://example.test/admin2714", { headers: { authorization: "Bearer wrong-secret" } })), { allowed: false, configured: true });
  } finally { environment(previousEnabled, previousToken); }
});

test("enabled admin access accepts the configured server session", () => {
  const previousEnabled = process.env.ADMIN_AUTH_ENABLED; const previousToken = process.env.ADMIN_SESSION_TOKEN;
  try {
    environment("true", "correct-secret");
    assert.equal(adminAccess(new Request("https://example.test/admin2714", { headers: { cookie: "b28_admin_session=correct-secret" } })).allowed, true);
    assert.equal(adminAccess(new Request("https://example.test/api/admin2714/site", { headers: { authorization: "Bearer correct-secret" } })).allowed, true);
  } finally { environment(previousEnabled, previousToken); }
});
