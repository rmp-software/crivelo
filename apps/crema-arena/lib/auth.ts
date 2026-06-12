/**
 * Re-export shim so existing `@/lib/auth` consumers keep resolving.
 * The Auth.js v5 instance lives at the app root in `@/auth`.
 */
export { handlers, auth, signIn, signOut } from '@/auth';
