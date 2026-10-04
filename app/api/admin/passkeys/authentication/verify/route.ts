import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { PASSKEY_CHALLENGE_COOKIE } from "@/lib/passkeys";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { response?: Parameters<typeof import("@/lib/passkeys").authenticatePasskey>[0] };
    if (!body.response) throw new Error("MISSING_RESPONSE");
    await signIn("passkey", { response: JSON.stringify(body.response), redirect: false });
    const response = NextResponse.json({ success: true, data: { redirectTo: "/admin" } });
    response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    return response;
  } catch (error) {
    if (!(error instanceof AuthError)) console.error("passkey_authentication_failed", error instanceof Error ? error.message : "unknown");
    const response = NextResponse.json({ success: false, error: { code: "AUTHENTICATION_FAILED", message: "Passkey sign-in failed." } }, { status: 401 });
    response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    return response;
  }
}
