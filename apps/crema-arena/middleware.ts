import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

/**
 * Auth-aware routing for the admin surfaces:
 *
 * - `/`            → /dashboard if signed in, the public landing otherwise.
 * - `/login`       → /dashboard if already signed in; otherwise let the page render.
 * - `/dashboard/*` → /login (with callbackUrl) if not signed in.
 *
 * Public routes (`/live/[eventId]`, `/e/[eventId]`, all `/api/*`, static assets)
 * are excluded by the matcher and unaffected.
 *
 * Runs on the Edge runtime, so it instantiates NextAuth from the edge-safe
 * `authConfig` ONLY — no bcryptjs/Prisma (those live behind the Credentials
 * provider in `auth.ts`, the Node-only instance).
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthed = !!req.auth;

  if (pathname === '/') {
    if (isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname === '/login' && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith('/dashboard') && !isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
