const truthy = new Set(["1", "true", "yes", "on"]);

export function adminAuthEnabled() {
  return truthy.has(String(process.env.ADMIN_AUTH_ENABLED || "false").trim().toLocaleLowerCase());
}

function sameSecret(left: string, right: string) {
  if (!left || left.length !== right.length) return false;
  let difference = 0; for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export function adminAccess(request: Request) {
  if (!adminAuthEnabled()) return { allowed: true as const, mode: "development-open" as const };
  const expected = String(process.env.ADMIN_SESSION_TOKEN || "");
  if (!expected) return { allowed: false as const, configured: false as const };
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const cookie = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("b28_admin_session="))?.slice("b28_admin_session=".length) || "";
  return sameSecret(bearer || cookie, expected) ? { allowed: true as const, mode: "session" as const } : { allowed: false as const, configured: true as const };
}
