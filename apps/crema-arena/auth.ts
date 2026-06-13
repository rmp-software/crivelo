import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authConfig } from './auth.config';

/**
 * Full Auth.js v5 instance — Node runtime only (pulls in bcryptjs + Prisma via
 * the Credentials provider). Spreads the edge-safe `authConfig` and adds the
 * provider. Reads `AUTH_SECRET` from the environment automatically.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const organizer = await prisma.organizer.findUnique({
          where: { email: credentials.email as string },
        });

        if (!organizer) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          organizer.password_hash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: organizer.id,
          email: organizer.email,
          name: organizer.name,
          role: organizer.role,
        };
      },
    }),
  ],
});
