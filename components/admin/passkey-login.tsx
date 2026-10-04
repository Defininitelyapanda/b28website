"use client";

import { useState } from "react";
import { startAuthentication } from "@simplewebauthn/browser";

export function PasskeyLogin({ returnTo }: { returnTo: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function authenticate() {
    setBusy(true);
    setError("");
    try {
      const optionsResponse = await fetch("/api/admin/passkeys/authentication/options", { method: "POST", credentials: "same-origin" });
      const optionsPayload = await optionsResponse.json() as { success: boolean; data?: Parameters<typeof startAuthentication>[0] };
      if (!optionsResponse.ok || !optionsPayload.data) throw new Error("OPTIONS_FAILED");
      const credential = await startAuthentication(optionsPayload.data);
      const verificationResponse = await fetch("/api/admin/passkeys/authentication/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: credential }),
      });
      if (!verificationResponse.ok) throw new Error("VERIFY_FAILED");
      window.location.assign(returnTo);
    } catch {
      setError("Passkey sign-in failed. Try again or use Google from the standard admin login page.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    {error && <div className="login-error" role="alert"><div><strong>Unable to sign in</strong><p>{error}</p></div></div>}
    <button className="admin-button google-signin" type="button" disabled={busy} onClick={() => void authenticate()}>{busy ? "Checking passkey…" : "Continue with passkey"}</button>
  </>;
}
