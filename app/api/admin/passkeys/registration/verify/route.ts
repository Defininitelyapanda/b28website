import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import { PASSKEY_CHALLENGE_COOKIE, registerPasskey } from "@/lib/passkeys";

export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin || admin.authMethod !== "google") {
    return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "A Google-authenticated admin session is required." } }, { status: 403 });
  }
  try {
    const body = await request.json() as { label?: string; response?: Parameters<typeof registerPasskey>[0] };
    if (!body.response) throw new Error("MISSING_RESPONSE");
    const passkey = await registerPasskey(body.response, body.label || "Passkey", request.cookies.get(PASSKEY_CHALLENGE_COOKIE)?.value);
    const response = NextResponse.json({ success: true, data: { id: passkey.id, label: passkey.label } });
    response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    return response;
  } catch {
    const response = NextResponse.json({ success: false, error: { code: "REGISTRATION_FAILED", message: "The passkey could not be registered. Please try again." } }, { status: 400 });
    response.cookies.delete(PASSKEY_CHALLENGE_COOKIE);
    return response;
  }
}
