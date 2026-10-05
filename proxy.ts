import { NextResponse, type NextRequest } from "next/server";
import { adminAccess } from "@/lib/admin-access";

export function proxy(request: NextRequest) {
  const access = adminAccess(request);
  if (access.allowed) { const response = NextResponse.next(); response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive"); return response; }
  return NextResponse.json({ success: false, error: { code: access.configured ? "ADMIN_AUTH_REQUIRED" : "ADMIN_AUTH_MISCONFIGURED", message: access.configured ? "Administrator authentication is required." : "Administrator authentication is enabled but no session token is configured." } }, { status: access.configured ? 401 : 503, headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" } });
}

export const config = { matcher: ["/admin2714/:path*", "/api/admin2714/:path*"] };
