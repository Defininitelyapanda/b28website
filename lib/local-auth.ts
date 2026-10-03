import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type LocalAdminUser = { userId: string; displayName: string; email: string; fullName: string };
export const SESSION_COOKIE = "b28_admin_session";
const sessionLifetimeSeconds = 60 * 60 * 12;
function password() { return process.env.LOCAL_ADMIN_PASSWORD || "b28-local-admin"; }
function secret() { return process.env.LOCAL_AUTH_SECRET || password(); }
function signature(value: string) { return createHmac("sha256", secret()).update(value).digest("base64url"); }

export function verifyLocalPassword(candidate: string) {
  const expected = Buffer.from(password());
  const received = Buffer.from(candidate);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function createSessionValue() {
  const payload = Buffer.from(JSON.stringify({ expires: Date.now() + sessionLifetimeSeconds * 1000 })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export async function getLocalAdmin(): Promise<LocalAdminUser | null> {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const [payload, supplied] = value.split(".");
  if (!payload || !supplied) return null;
  const expected = signature(payload);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expires: number };
    if (parsed.expires <= Date.now()) return null;
  } catch { return null; }
  const email = process.env.LOCAL_ADMIN_EMAIL || "admin@b28.local";
  return { userId: "local-admin", displayName: "Local administrator", email, fullName: "Local administrator" };
}

export async function requireLocalAdmin(returnTo: string) {
  const user = await getLocalAdmin();
  if (user) return user;
  redirect(`/admin/login?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`);
}

export function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value.startsWith("/admin/login") || value.startsWith("/api/auth") ? "/admin" : value;
}

export const sessionLifetime = sessionLifetimeSeconds;
