import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to || "/admin";
  return <main className="admin-main"><div className="admin-panel" style={{ maxWidth: 480, margin: "10vh auto" }}>
    <p className="section-kicker">Local administration</p><h1>Sign in</h1>
    <p>This private area is authenticated entirely on this computer.</p>
    <LoginForm hasError={Boolean(params.error)} returnTo={returnTo}/>
  </div></main>;
}
