import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureAdmin } from "./cms";

export async function requireAdminApi() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const account = await ensureAdmin(user);
  if (!account.active) return null;
  return { ...user, role: String(account.role) };
}

export const canWrite = (role: string, type: string) => {
  if (["super_admin", "admin", "editor"].includes(role)) return true;
  if (role === "author" && type === "article") return true;
  return role === "media_manager" && type === "media";
};
