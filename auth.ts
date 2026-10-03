import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin-identity";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [Google],
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login", error: "/admin/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      const emailVerified = Boolean(profile && "email_verified" in profile && profile.email_verified === true);
      return account?.provider === "google" && emailVerified && isAdminEmail(user.email);
    },
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname === "/admin/login") return true;
      if (pathname.startsWith("/admin")) return isAdminEmail(session?.user?.email);
      return true;
    },
  },
});
