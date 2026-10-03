import { NextResponse } from "next/server";
import { createSessionValue, safeReturnPath, SESSION_COOKIE, sessionLifetime, verifyLocalPassword } from "@/lib/local-auth";

export async function POST(request: Request) {
  const form = await request.formData();
  const returnTo = safeReturnPath(String(form.get("return_to") || "/admin"));
  if (!verifyLocalPassword(String(form.get("password") || ""))) {
    return NextResponse.redirect(new URL(`/admin/login?error=1&return_to=${encodeURIComponent(returnTo)}`, request.url), 303);
  }
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionValue(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", path: "/", maxAge: sessionLifetime });
  return response;
}
