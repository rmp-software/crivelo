import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe Auth.js v5 configuration.
 *
 * This must NOT import Node-only modules (bcryptjs, Prisma): it runs on the
 * Edge runtime via `middleware.ts`. The Credentials provider — which pulls in
 * bcrypt + Prisma — lives in the Node-only `auth.ts`, which spreads this config
 * and adds the provider. Middleware imports ONLY this file.
 */
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  // Credentials provider is added in `auth.ts` (Node runtime only).
  providers: [],
} satisfies NextAuthConfig;
