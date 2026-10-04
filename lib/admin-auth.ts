import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail, safeAdminReturnPath } from "./admin-identity";

export type AdminUser = { userId: string; displayName: string; email: string; fullName: string; authMethod: "google" | "passkey" };

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdminEmail(email)) return null;
  const displayName = session?.user?.name?.trim() || "B28 administrator";
  const authMethod = (session as typeof session & { authMethod?: string }).authMethod === "passkey" ? "passkey" : "google";
  return { userId: `google:${email!.toLocaleLowerCase()}`, displayName, email: email!, fullName: displayName, authMethod };
}

export async function requireAdmin(returnTo: string) {
  const user = await getAdminUser();
  if (user) return user;
  redirect(`/admin/login?return_to=${encodeURIComponent(safeAdminReturnPath(returnTo))}`);
}
