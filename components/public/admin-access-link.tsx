"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminAccessLink() {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/access", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() as Promise<{ authorized?: boolean }> : null)
      .then((result) => setAuthorized(result?.authorized === true))
      .catch(() => setAuthorized(false));
    return () => controller.abort();
  }, []);

  return authorized ? <Link href="/admin">Admin</Link> : null;
}
