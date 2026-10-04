import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { PasskeyLogin } from "@/components/admin/passkey-login";
import { getAdminUser } from "@/lib/admin-auth";
import { safeAdminReturnPath } from "@/lib/admin-identity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Passkey recovery", robots: { index: false, follow: false } };

export default async function PasskeyRecovery({ searchParams }: { searchParams: Promise<{ return_to?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const params = await searchParams;
  return <main className="admin-login-page">
    <section className="admin-panel admin-login-panel">
      <div className="admin-login-icon"><KeyRound size={28}/></div>
      <p className="section-kicker">B28 secure recovery</p>
      <h1>Use a passkey</h1>
      <p>Use a passkey previously registered by a B28 administrator.</p>
      <PasskeyLogin returnTo={safeAdminReturnPath(params.return_to)}/>
      <Link href="/" className="text-link"><span>Return to public site</span></Link>
    </section>
  </main>;
}
