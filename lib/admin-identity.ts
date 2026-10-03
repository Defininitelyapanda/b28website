export const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "b28entertainment@gmail.com").trim().toLocaleLowerCase();

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && email.trim().toLocaleLowerCase() === ADMIN_EMAIL);
}

export function safeAdminReturnPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value.startsWith("/admin/login") || value.startsWith("/api/auth") ? "/admin" : value;
}
