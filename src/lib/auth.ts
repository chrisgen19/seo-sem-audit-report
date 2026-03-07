import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      organizationId?: string | null;
      role?: string | null;
      memberStatus?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) token.id = user.id;

      // Refresh org context on sign-in or when session is updated
      if (user || trigger === "update") {
        const membership = await db.organizationMember.findFirst({
          where: { userId: token.id as string, status: "ACTIVE" },
          select: { organizationId: true, role: true, status: true },
        });
        token.organizationId = membership?.organizationId ?? null;
        token.role = membership?.role ?? null;
        token.memberStatus = membership?.status ?? null;
      }

      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      session.user.organizationId = token.organizationId as string | null;
      session.user.role = token.role as string | null;
      session.user.memberStatus = token.memberStatus as string | null;
      return session;
    },
  },
});
