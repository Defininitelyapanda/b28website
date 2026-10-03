import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_EMAIL, isAdminEmail, safeAdminReturnPath } from "../../lib/admin-identity.ts";

test("only the configured administrator email is accepted", () => {
  assert.equal(isAdminEmail(ADMIN_EMAIL), true);
  assert.equal(isAdminEmail(ADMIN_EMAIL.toLocaleUpperCase()), true);
  assert.equal(isAdminEmail("random@example.com"), false);
  assert.equal(isAdminEmail(null), false);
});

test("admin redirects remain internal", () => {
  assert.equal(safeAdminReturnPath("/admin/recovery"), "/admin/recovery");
  assert.equal(safeAdminReturnPath("https://example.com"), "/admin");
  assert.equal(safeAdminReturnPath("//example.com"), "/admin");
  assert.equal(safeAdminReturnPath("/api/auth/signout"), "/admin");
});
