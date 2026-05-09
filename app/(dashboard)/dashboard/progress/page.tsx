export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import ProgressClient from "./_components/ProgressClient";

export default async function ProgressPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = getCurrentUserId();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    { data: latestWeightRows },
    { data: oldestWeightRows },
    { data: runRows },
  ] = await Promise.all([
    // Most recent Withings weight
    db
      .from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .eq("source", "withings")
      .eq("metric_name", "weight")
      .order("timestamp", { ascending: false })
      .limit(1),
    // Oldest Withings weight in last 30 days (for delta)
    db
      .from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .eq("source", "withings")
      .eq("metric_name", "weight")
      .gte("timestamp", thirtyDaysAgo.toISOString())
      .order("timestamp", { ascending: true })
      .limit(1),
    // Running workouts in last 7 days (distance_m is always meters)
    db
      .from("apple_health_workouts")
      .select("duration_sec, distance_m")
      .eq("user_id", userId)
      .in("workout_type", ["Running", "OutdoorRun", "IndoorRun", "TrackRun"])
      .gte("timestamp", sevenDaysAgo.toISOString()),
  ]);

  type WtRow = { value: number };
  const withingsCurrent: number | null =
    (latestWeightRows as WtRow[] | null)?.[0]?.value ?? null;
  const withingsOldest: number | null =
    (oldestWeightRows as WtRow[] | null)?.[0]?.value ?? null;
  const withingsDelta30d: number | null =
    withingsCurrent !== null && withingsOldest !== null
      ? parseFloat((withingsCurrent - withingsOldest).toFixed(1))
      : null;

  type RunRow = { duration_sec: number | null; distance_m: number | null };
  const runs: RunRow[] = (runRows as RunRow[] | null) ?? [];

  const weeklyMiles: number | null = runs.length
    ? parseFloat(
        runs.reduce((s, r) => s + (r.distance_m ?? 0) / 1609.344, 0).toFixed(2)
      )
    : null;

  const totalDurSec = runs.reduce((s, r) => s + (r.duration_sec ?? 0), 0);
  const avgPaceSec: number | null =
    weeklyMiles && weeklyMiles > 0 ? totalDurSec / weeklyMiles : null;

  return (
    <ProgressClient
      withingsCurrent={withingsCurrent}
      withingsDelta30d={withingsDelta30d}
      weeklyMiles={weeklyMiles}
      weeklyRuns={runs.length}
      avgPaceSec={avgPaceSec}
    />
  );
}
