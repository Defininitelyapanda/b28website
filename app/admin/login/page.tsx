import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { signIn } from "@/auth";
import { getAdminUser } from "@/lib/admin-auth";
import { ADMIN_EMAIL, safeAdminReturnPath } from "@/lib/admin-identity";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  if (await getAdminUser()) redirect("/admin");
  const params = await searchParams;
  const returnTo = safeAdminReturnPath(params.return_to);

  async function continueWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: returnTo });
  }

  return <main className="admin-login-page">
    <section className="admin-panel admin-login-panel">
      <div className="admin-login-icon"><ShieldCheck size={28}/></div>
      <p className="section-kicker">B28 secure administration</p>
      <h1>Admin sign in</h1>
      <p>The studio is separate from the public website. Access is restricted to B28’s verified Google account.</p>
      {params.error && <div className="login-error" role="alert"><div><strong>Access denied</strong><p>This Google account is not authorized. Sign out of Google, then retry with {ADMIN_EMAIL}.</p></div></div>}
      <form action={continueWithGoogle}>
        <button className="admin-button google-signin" type="submit">{params.error ? "Retry with Google" : "Continue with Google"}</button>
      </form>
      <p className="admin-login-note">Authorized account: <strong>{ADMIN_EMAIL}</strong></p>
      <Link href="/" className="text-link"><span>Return to public site</span></Link>
    </section>
  </main>;
}
