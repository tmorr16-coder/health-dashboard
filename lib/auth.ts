// =============================================================
// TEMPORARY: Auth disabled for development.
// Replace before deploying to production.
//
// How to restore real auth:
//  1. Re-add proxy.ts (session refresh + route guard)
//  2. Re-add app/(auth)/login and app/auth/callback routes
//  3. Replace getCurrentUserId() with a call to
//     supabase.auth.getUser() from the server client
//  4. Re-enable RLS in Supabase (undo the seed.sql ALTER TABLE lines)
// =============================================================

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Returns the current user's UUID.
 * In production this will read from the authenticated session;
 * for now it returns the hardcoded dev user inserted by seed.sql.
 */
export function getCurrentUserId(): string {
  return DEV_USER_ID;
}
