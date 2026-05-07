"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function disconnectWithings(): Promise<{ error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = getCurrentUserId();

  const { error } = await db
    .from("withings_tokens")
    .delete()
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings/integrations");
  return {};
}

export async function triggerSync(): Promise<{ inserted?: number; error?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const cronSecret = process.env.CRON_SECRET;

  const headers: Record<string, string> = {};
  if (cronSecret) headers["Authorization"] = `Bearer ${cronSecret}`;

  try {
    const res = await fetch(`${siteUrl}/api/withings/sync`, { headers });
    const json = (await res.json()) as { measurements_inserted?: number; error?: string };
    if (!res.ok) return { error: json.error ?? "Sync failed" };
    return { inserted: json.measurements_inserted ?? 0 };
  } catch (err) {
    return { error: String(err) };
  }
}
