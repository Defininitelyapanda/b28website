"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ hasError, returnTo }: { hasError: boolean; returnTo: string }) {
  const [visible, setVisible] = useState(false);
  const [showError, setShowError] = useState(hasError);
  const passwordInput = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function retry() {
    setShowError(false);
    router.replace(`/admin/login?return_to=${encodeURIComponent(returnTo)}`);
    requestAnimationFrame(() => passwordInput.current?.focus());
  }

  return <>
    {showError && <div className="login-error" role="alert">
      <div><strong>Incorrect password</strong><p>The password you entered is not valid. Check it and try again.</p></div>
      <button type="button" className="admin-button secondary" onClick={retry}>Retry</button>
    </div>}
    <form className="admin-form" method="post" action="/api/auth/login">
      <input type="hidden" name="return_to" value={returnTo}/>
      <label className="wide">Admin password
        <span className="password-field">
          <input ref={passwordInput} name="password" type={visible ? "text" : "password"} autoComplete="current-password" required autoFocus/>
          <button type="button" className="password-toggle" onClick={() => setVisible((current) => !current)} aria-pressed={visible} aria-label={visible ? "Hide password" : "Show password"}>
            {visible ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
        </span>
      </label>
      <button className="admin-button wide" type="submit">Sign in</button>
    </form>
  </>;
}
