import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Auth-aware routing for the admin surfaces:
 *
 * - `/`            → /dashboard if signed in, the public landing otherwise.
 * - `/login`       → /dashboard if already signed in; otherwise let the page render.
 * - `/dashboard/*` → /login (with callbackUrl) if not signed in.
 *
 * Public routes (`/live/[eventId]`, `/e/[eventId]`, all `/api/*`, static assets)
 * are excluded by the matcher and unaffected.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthed = !!token;

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
}

export const config = {
  matcher: ['/', '/login', '/dashboard/:path*'],
};
