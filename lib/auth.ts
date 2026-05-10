import { createClient } from "@/lib/supabase/server";

export const DEV_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Returns the authenticated user's UUID from their session.
 * Falls back to DEV_USER_ID when auth bypass is enabled (local dev).
 */
export async function getCurrentUserId(): Promise<string> {
  if (process.env.NEXT_PUBLIC_AUTH_BYPASS === "true") {
    return DEV_USER_ID;
  }
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.id) return user.id;
  } catch { /* ignore */ }
  return DEV_USER_ID;
}
