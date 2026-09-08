import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";

const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN;
const GRACE_PERIOD_MINUTES = parseInt(
  process.env.GRACE_PERIOD_MINUTES ?? "5",
  10
);

const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      const domain = process.env.ALLOWED_EMAIL_DOMAIN;
      // Reject if domain is not configured or does not match — no fallback
      if (!domain) return false;
      return email.endsWith(domain);
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in, user object is populated
      if (user?.email) {
        const email = user.email.toLowerCase();
        const isAdmin = adminEmails.includes(email);
        const role = isAdmin ? "ADMIN" : "USER";

        // Upsert user with role
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existing.length === 0) {
          // First login — create user row
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              name: user.name ?? null,
              role,
            })
            .returning();
          token.id = newUser.id;
          token.role = newUser.role;
        } else {
          const dbUser = existing[0];
          // Promote to admin if in ADMIN_EMAILS
          if (isAdmin && dbUser.role !== "ADMIN") {
            await db
              .update(users)
              .set({ role: "ADMIN" })
              .where(eq(users.id, dbUser.id));
            token.role = "ADMIN";
          } else {
            token.role = dbUser.role;
          }
          token.id = dbUser.id;
        }
      }

      // On session update trigger, re-fetch role
      if (trigger === "update" && token.id) {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});

export { GRACE_PERIOD_MINUTES };
