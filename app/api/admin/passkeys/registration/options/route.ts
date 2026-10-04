import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { PASSKEY_CHALLENGE_COOKIE, passkeyCookieOptions, registrationOptions } from "@/lib/passkeys";

export async function POST() {
  const admin = await getAdminUser();
  if (!admin || admin.authMethod !== "google") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "A Google-authenticated admin session is required." } }, { status: 403 });
  }
  try {
    const { options, token } = await registrationOptions();
    const response = NextResponse.json({ success: true, data: options });
    response.cookies.set(PASSKEY_CHALLENGE_COOKIE, token, passkeyCookieOptions);
    return response;
  } catch (error) {
    console.error("passkey_registration_options_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ success: false, error: { code: "PASSKEY_CONFIG_ERROR", message: "Passkey setup is unavailable." } }, { status: 500 });
  }
}
