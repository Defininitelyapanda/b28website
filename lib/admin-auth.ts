import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isAdminEmail, safeAdminReturnPath } from "./admin-identity";

export type AdminUser = { userId: string; displayName: string; email: string; fullName: string };

export async function getAdminUser(): Promise<AdminUser | null> {
  const session = await auth();
  const email = session?.user?.email;
  if (!isAdminEmail(email)) return null;
  const displayName = session?.user?.name?.trim() || "B28 administrator";
  return { userId: `google:${email!.toLocaleLowerCase()}`, displayName, email: email!, fullName: displayName };
}

export async function requireAdmin(returnTo: string) {
  const user = await getAdminUser();
  if (user) return user;
  redirect(`/admin/login?return_to=${encodeURIComponent(safeAdminReturnPath(returnTo))}`);
}
