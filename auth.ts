import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./lib/db";
import { accounts, sessions, users, verificationTokens, otpTokens, subscriptions } from "./lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    // @ts-ignore
    usersTable: users,
    // @ts-ignore
    accountsTable: accounts,
    // @ts-ignore
    sessionsTable: sessions,
    // @ts-ignore
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const otp = credentials?.otp as string;
        if (!email || !otp) return null;

        const now = new Date();

        // Find valid OTP
        const record = await db.query.otpTokens.findFirst({
          where: and(
            eq(otpTokens.email, email),
            eq(otpTokens.otp, otp),
            eq(otpTokens.used, false),
            gt(otpTokens.expiresAt, now)
          )
        });

        if (!record) return null;

        // Mark OTP as used
        await db.update(otpTokens).set({ used: true }).where(eq(otpTokens.id, record.id));

        // Get or create user
        let user = await db.query.users.findFirst({ where: eq(users.email, email) });
        if (!user) {
          const [newUser] = await db.insert(users).values({
            email,
            name: email.split("@")[0],
          }).returning();
          user = newUser;

          // Initialize default subscription for new user
          await db.insert(subscriptions).values({
              userId: user.id,
              plan: "free",
              responsesUsedThisMonth: 0,
              responsesLimit: 10,
          });
        }

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, user.id as string)
        });
        if (dbUser) {
          token.stripeCustomerId = dbUser.stripeCustomerId;
          token.subscriptionTier = dbUser.subscriptionTier;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // @ts-ignore
        session.user.stripeCustomerId = token.stripeCustomerId;
        // @ts-ignore
        session.user.subscriptionTier = token.subscriptionTier;
        // @ts-ignore
        session.user.onboardingCompleted = token.onboardingCompleted;
        // @ts-ignore
        session.user.role = token.role;
      }
      return session;
    },
  },
});
