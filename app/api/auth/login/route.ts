import { NextResponse } from "next/server";
import { createSessionValue, safeReturnPath, SESSION_COOKIE, sessionLifetime, verifyLocalPassword } from "@/lib/local-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeReturnPath(String(form.get("return_to") || "/admin"));
  if (!verifyLocalPassword(String(form.get("password") || ""))) {
    return new NextResponse(null, { status: 303, headers: { Location: `/admin/login?error=1&return_to=${encodeURIComponent(returnTo)}` } });
  }
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
  const secure = forwardedProtocol ? forwardedProtocol === "https" : new URL(request.url).protocol === "https:";
  const response = new NextResponse(null, { status: 303, headers: { Location: returnTo } });
  response.cookies.set(SESSION_COOKIE, createSessionValue(), { httpOnly: true, sameSite: "strict", secure, path: "/", maxAge: sessionLifetime });
  return response;
}
