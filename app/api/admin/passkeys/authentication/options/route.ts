import { NextResponse } from "next/server";
import { authenticationOptions, PASSKEY_CHALLENGE_COOKIE, passkeyCookieOptions } from "@/lib/passkeys";

export async function POST() {
  try {
    const { options, token } = await authenticationOptions();
    const response = NextResponse.json({ success: true, data: options });
    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, token, passkeyCookieOptions);
    return response;
  } catch (error) {
    console.error("passkey_authentication_options_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: { code: "PASSKEY_UNAVAILABLE", message: "Passkey sign-in is unavailable." } }, { status: 503 });
  }
}
