export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = getCurrentUserId();

  const { data: weightRow } = await db
    .from("apple_health_metrics")
    .select("value")
    .eq("user_id", userId)
    .eq("source", "withings")
    .eq("metric_name", "weight")
    .order("timestamp", { ascending: false })
    .limit(1)
    .maybeSingle();

  const withingsWeightLbs: number | null = weightRow?.value ?? null;

  return <ProfileClient withingsWeightLbs={withingsWeightLbs} />;
}
