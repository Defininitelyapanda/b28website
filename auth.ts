import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { ADMIN_EMAIL, isAdminEmail } from "@/lib/admin-identity";
import { authenticatePasskey, cookieValue, PASSKEY_CHALLENGE_COOKIE } from "@/lib/passkeys";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [Google, Credentials({
    id: "passkey",
    name: "Passkey",
    credentials: { response: { label: "Passkey response", type: "text" } },
    async authorize(credentials, request) {
      if (typeof credentials.response !== "string") return null;
      try {
        const response = JSON.parse(credentials.response) as Parameters<typeof authenticatePasskey>[0];
        await authenticatePasskey(response, cookieValue(request.headers.get("cookie"), PASSKEY_CHALLENGE_COOKIE));
        return { id: `google:${ADMIN_EMAIL}`, email: ADMIN_EMAIL, name: "B28 administrator" };
      } catch {
        return null;
      }
    },
  })],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      const emailVerified = Boolean(profile && "email_verified" in profile && profile.email_verified === true);
      if (account?.provider === "passkey") return isAdminEmail(user.email);
      return account?.provider === "google" && emailVerified && isAdminEmail(user.email);
    },
    async jwt({ token, account }) {
      if (account) token.authMethod = account.provider === "passkey" ? "passkey" : "google";
      return token;
    },
    async session({ session, token }) {
      (session as typeof session & { authMethod?: string }).authMethod = token.authMethod === "passkey" ? "passkey" : "google";
      return session;
    },
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith("/admin/login")) return true;
      if (pathname.startsWith("/admin")) return isAdminEmail(session?.user?.email);
      return true;
    },
  },
});
