"use client";

import { useEffect, useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";

type PasskeySummary = { id: string; label: string; created_at: string; last_used_at: string | null; backed_up: boolean };

export function PasskeySettings({ canEnroll }: { canEnroll: boolean }) {
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/passkeys", { cache: "no-store", credentials: "same-origin" });
    const payload = await response.json() as { data?: PasskeySummary[] };
    if (response.ok) setPasskeys(payload.data || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/passkeys", { cache: "no-store", credentials: "same-origin", signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ data?: PasskeySummary[] }> : null)
      .then((payload) => { if (payload) setPasskeys(payload.data || []); })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  async function addPasskey() {
    setBusy(true);
    setMessage("");
    try {
      const optionsResponse = await fetch("/api/admin/passkeys/registration/options", { method: "POST", credentials: "same-origin" });
      const optionsPayload = await optionsResponse.json() as { data?: Parameters<typeof startRegistration>[0] };
      if (!optionsResponse.ok || !optionsPayload.data) throw new Error("OPTIONS_FAILED");
      const credential = await startRegistration(optionsPayload.data);
      const verifyResponse = await fetch("/api/admin/passkeys/registration/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, response: credential }),
      });
      if (!verifyResponse.ok) throw new Error("VERIFY_FAILED");
      setLabel("");
      setMessage("Passkey registered.");
      await load();
    } catch {
      setMessage("The passkey could not be registered. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm("Revoke this passkey? It will no longer be able to sign in.")) return;
    const response = await fetch(`/api/admin/passkeys/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "same-origin" });
    setMessage(response.ok ? "Passkey revoked." : "The passkey could not be revoked.");
    if (response.ok) await load();
  }

  return <section className="admin-panel passkey-settings" id="settings">
    <h2>Passkey recovery</h2>
    <p>Passkeys provide a secure fallback when Google sign-in is unavailable. Keep the private recovery address in a safe place.</p>
    <code>/admin/login/passkey</code>
    {message && <div className="admin-flash" role="status">{message}</div>}
    <div className="passkey-list">
      {passkeys.map((passkey) => <div className="passkey-row" key={passkey.id}>
        <div><strong>{passkey.label}</strong><small>Created {new Date(passkey.created_at).toLocaleDateString()}{passkey.last_used_at ? ` · Last used ${new Date(passkey.last_used_at).toLocaleDateString()}` : ""}{passkey.backed_up ? " · Synced" : ""}</small></div>
        <button className="admin-button secondary" type="button" onClick={() => void revoke(passkey.id)}>Revoke</button>
      </div>)}
      {!passkeys.length && <p className="empty-state">No recovery passkeys are registered.</p>}
    </div>
    {canEnroll ? <div className="passkey-enroll">
      <label>Passkey name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Office laptop" maxLength={80}/></label>
      <button className="admin-button" type="button" disabled={busy} onClick={() => void addPasskey()}>{busy ? "Registering…" : "Add passkey"}</button>
    </div> : <p className="admin-login-note">Sign out and authenticate with Google to register a new passkey.</p>}
  </section>;
}
