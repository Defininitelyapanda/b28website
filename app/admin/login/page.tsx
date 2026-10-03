export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  return <main className="admin-main"><div className="admin-panel" style={{ maxWidth: 480, margin: "10vh auto" }}>
    <p className="section-kicker">Local administration</p><h1>Sign in</h1>
    <p>This private area is authenticated entirely on this computer.</p>
    {params.error && <p className="form-status">That password is incorrect.</p>}
    <form className="admin-form" method="post" action="/api/auth/login">
      <input type="hidden" name="return_to" value={params.return_to || "/admin"}/>
      <label className="wide">Admin password<input name="password" type="password" autoComplete="current-password" required autoFocus/></label>
      <button className="admin-button wide" type="submit">Sign in</button>
    </form>
  </div></main>;
}
