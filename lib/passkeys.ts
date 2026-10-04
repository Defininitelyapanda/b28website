import { createHmac, timingSafeEqual } from "node:crypto";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { ADMIN_EMAIL } from "./admin-identity";
import { readStore, updateStore, type PasskeyChallenge, type StoredPasskey } from "./local-store";

export const PASSKEY_CHALLENGE_COOKIE = "b28.passkey.challenge";
const challengeLifetimeMs = 5 * 60 * 1000;

type ChallengePurpose = PasskeyChallenge["purpose"];
type ChallengeToken = { id: string; challenge: string; purpose: ChallengePurpose; expiresAt: number };

function encode(value: string | Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for passkey authentication.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function createChallengeToken(payload: ChallengeToken) {
  const body = encode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

function readChallengeToken(token: string | undefined, purpose: ChallengePurpose): ChallengeToken | null {
  if (!token) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) return null;
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as ChallengeToken;
    return payload.purpose === purpose && payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export function passkeyConfig() {
  const configured = process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "");
  if (!configured) throw new Error("AUTH_URL or NEXT_PUBLIC_SITE_URL is required for passkeys.");
  const url = new URL(configured);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
    throw new Error("Passkeys require HTTPS, except on localhost.");
  }
  return { origin: url.origin, rpID: url.hostname, rpName: "B28 Entertainment" };
}

async function rememberChallenge(challenge: string, purpose: ChallengePurpose) {
  const payload: ChallengeToken = { id: crypto.randomUUID(), challenge, purpose, expiresAt: Date.now() + challengeLifetimeMs };
  await updateStore((store) => {
    store.passkey_challenges = store.passkey_challenges
      .filter((item) => new Date(item.expires_at).getTime() > Date.now())
      .slice(-49);
    store.passkey_challenges.push({ id: payload.id, challenge, purpose, expires_at: new Date(payload.expiresAt).toISOString() });
  });
  return createChallengeToken(payload);
}

export const passkeyCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: challengeLifetimeMs / 1000,
};

export async function registrationOptions() {
  const config = passkeyConfig();
  const existing = (await readStore()).passkeys;
  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userID: `google:${ADMIN_EMAIL}`,
    userName: ADMIN_EMAIL,
    userDisplayName: "B28 administrator",
    attestationType: "none",
    excludeCredentials: existing.map((passkey) => ({ id: Buffer.from(passkey.credential_id, "base64url"), type: "public-key", transports: passkey.transports as AuthenticatorTransport[] })),
    authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "required" },
    timeout: 60_000,
  });
  return { options, token: await rememberChallenge(options.challenge, "registration") };
}

export async function authenticationOptions() {
  const { rpID } = passkeyConfig();
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required", timeout: 60_000 });
  return { options, token: await rememberChallenge(options.challenge, "authentication") };
}

async function consumeChallenge<T>(token: string | undefined, purpose: ChallengePurpose, action: (challenge: string, store: Awaited<ReturnType<typeof readStore>>) => Promise<T>) {
  const payload = readChallengeToken(token, purpose);
  if (!payload) throw new Error("INVALID_CHALLENGE");
  return updateStore(async (store) => {
    const match = store.passkey_challenges.find((item) => item.id === payload.id && item.challenge === payload.challenge && item.purpose === purpose && new Date(item.expires_at).getTime() > Date.now());
    if (!match) throw new Error("INVALID_CHALLENGE");
    store.passkey_challenges = store.passkey_challenges.filter((item) => item.id !== payload.id);
    return action(payload.challenge, store);
  });
}

type RegistrationResponse = Parameters<typeof verifyRegistrationResponse>[0]["response"];
type AuthenticationResponse = Parameters<typeof verifyAuthenticationResponse>[0]["response"];

export async function registerPasskey(response: RegistrationResponse, label: string, token: string | undefined) {
  const config = passkeyConfig();
  return consumeChallenge(token, "registration", async (challenge, store) => {
    const result = await verifyRegistrationResponse({ response, expectedChallenge: challenge, expectedOrigin: config.origin, expectedRPID: config.rpID, requireUserVerification: true });
    if (!result.verified || !result.registrationInfo) throw new Error("REGISTRATION_FAILED");
    const info = result.registrationInfo;
    const credentialId = encode(info.credentialID);
    if (store.passkeys.some((item) => item.credential_id === credentialId)) throw new Error("PASSKEY_EXISTS");
    const passkey: StoredPasskey = {
      id: crypto.randomUUID(),
      credential_id: credentialId,
      public_key: encode(info.credentialPublicKey),
      counter: info.counter,
      transports: response.response.transports || [],
      device_type: info.credentialDeviceType,
      backed_up: info.credentialBackedUp,
      label: label.trim().slice(0, 80) || "Passkey",
      created_at: new Date().toISOString(),
      last_used_at: null,
    };
    store.passkeys.push(passkey);
    return passkey;
  });
}

export async function authenticatePasskey(response: AuthenticationResponse, token: string | undefined) {
  const config = passkeyConfig();
  return consumeChallenge(token, "authentication", async (challenge, store) => {
    const passkey = store.passkeys.find((item) => item.credential_id === response.id);
    if (!passkey) throw new Error("AUTHENTICATION_FAILED");
    const result = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      authenticator: {
        credentialID: Buffer.from(passkey.credential_id, "base64url"),
        credentialPublicKey: Buffer.from(passkey.public_key, "base64url"),
        counter: passkey.counter,
        transports: passkey.transports as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    });
    if (!result.verified || !result.authenticationInfo.userVerified) throw new Error("AUTHENTICATION_FAILED");
    passkey.counter = result.authenticationInfo.newCounter;
    passkey.device_type = result.authenticationInfo.credentialDeviceType;
    passkey.backed_up = result.authenticationInfo.credentialBackedUp;
    passkey.last_used_at = new Date().toISOString();
    return passkey;
  });
}

export async function listPasskeys() {
  return (await readStore()).passkeys.map((passkey) => ({
    id: passkey.id,
    label: passkey.label,
    created_at: passkey.created_at,
    last_used_at: passkey.last_used_at,
    backed_up: passkey.backed_up,
    device_type: passkey.device_type,
    transports: passkey.transports,
  }));
}

export async function removePasskey(id: string) {
  return updateStore((store) => {
    const before = store.passkeys.length;
    store.passkeys = store.passkeys.filter((item) => item.id !== id);
    return store.passkeys.length !== before;
  });
}

export function cookieValue(cookieHeader: string | null, name: string) {
  const item = cookieHeader?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : undefined;
}
