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
  // Callbacks must live here (not auth.ts) so the edge middleware instance shares them.
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role; // user.role is typed via types/next-auth.d.ts augmentation
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === 'string') session.user.id = token.id;
        if (typeof token.role === 'string') session.user.role = token.role;
      }
      return session;
    },
  },
  // Credentials provider is added in `auth.ts` (Node runtime only).
  providers: [],
} satisfies NextAuthConfig;
