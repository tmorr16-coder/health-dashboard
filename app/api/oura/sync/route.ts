import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_USER_ID } from "@/lib/auth";

const BASE = "https://api.ouraring.com/v2/usercollection";

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

type MetricRow = {
  user_id:     string;
  timestamp:   string;
  metric_name: string;
  value:       number;
  unit:        string;
  source:      string;
};

async function ouraGet(path: string, params: Record<string, string>, token: string) {
  const url = new URL(`${BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Oura ${path} returned ${res.status}`);
  return res.json() as Promise<{ data: Record<string, unknown>[] }>;
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token) {
    return Response.json({ error: "OURA_ACCESS_TOKEN not configured" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db     = createAdminClient() as any;
  const userId = DEV_USER_ID;

  // First sync = last 7 days; subsequent = last 2 days (overlap handles timezone edges)
  const { count } = await db
    .from("apple_health_metrics")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("source", "oura");

  const isFirstSync = !count || count === 0;
  const today     = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (isFirstSync ? 7 : 2));

  const dateParams = { start_date: dateStr(startDate), end_date: dateStr(today) };
  const dtParams   = { start_datetime: startDate.toISOString(), end_datetime: today.toISOString() };

  const [dailySleepResult, detailSleepResult, readinessResult, activityResult, hrResult] =
    await Promise.allSettled([
      ouraGet("daily_sleep",      dateParams, token),
      ouraGet("sleep",            dateParams, token),
      ouraGet("daily_readiness",  dateParams, token),
      ouraGet("daily_activity",   dateParams, token),
      ouraGet("heartrate",        dtParams,   token),
    ]);

  const rows: MetricRow[] = [];
  const byEndpoint: Record<string, number> = {};

  // ── daily_sleep → sleep_score ────────────────────────────────────────────────
  if (dailySleepResult.status === "fulfilled") {
    let n = 0;
    for (const item of dailySleepResult.value.data) {
      if (item.score == null) continue;
      rows.push({ user_id: userId, timestamp: `${item.day}T00:00:00Z`, metric_name: "sleep_score", value: item.score as number, unit: "score", source: "oura" });
      n++;
    }
    byEndpoint.daily_sleep = n;
  } else {
    console.error("[oura/sync] daily_sleep:", dailySleepResult.reason);
    byEndpoint.daily_sleep = 0;
  }

  // ── sleep (detailed) → duration, stages, HRV, resting HR ────────────────────
  if (detailSleepResult.status === "fulfilled") {
    let n = 0;
    for (const item of detailSleepResult.value.data) {
      const ts = `${item.day}T00:00:00Z`;
      const push = (metric_name: string, raw: unknown, unit: string, scale = 1) => {
        if (raw == null) return;
        const value = parseFloat(((raw as number) * scale).toFixed(2));
        rows.push({ user_id: userId, timestamp: ts, metric_name, value, unit, source: "oura" });
        n++;
      };
      push("sleep_duration_min", item.total_sleep_duration, "min", 1 / 60);
      push("rem_sleep_min",      item.rem_sleep_duration,   "min", 1 / 60);
      push("deep_sleep_min",     item.deep_sleep_duration,  "min", 1 / 60);
      push("hrv",                item.average_hrv,           "ms");
      push("resting_heart_rate", item.lowest_heart_rate,     "bpm");
    }
    byEndpoint.sleep = n;
  } else {
    console.error("[oura/sync] sleep:", detailSleepResult.reason);
    byEndpoint.sleep = 0;
  }

  // ── daily_readiness → readiness_score ───────────────────────────────────────
  if (readinessResult.status === "fulfilled") {
    let n = 0;
    for (const item of readinessResult.value.data) {
      if (item.score == null) continue;
      rows.push({ user_id: userId, timestamp: `${item.day}T00:00:00Z`, metric_name: "readiness_score", value: item.score as number, unit: "score", source: "oura" });
      n++;
    }
    byEndpoint.daily_readiness = n;
  } else {
    console.error("[oura/sync] daily_readiness:", readinessResult.reason);
    byEndpoint.daily_readiness = 0;
  }

  // ── daily_activity → activity_score ─────────────────────────────────────────
  if (activityResult.status === "fulfilled") {
    let n = 0;
    for (const item of activityResult.value.data) {
      if (item.score == null) continue;
      rows.push({ user_id: userId, timestamp: `${item.day}T00:00:00Z`, metric_name: "activity_score", value: item.score as number, unit: "score", source: "oura" });
      n++;
    }
    byEndpoint.daily_activity = n;
  } else {
    console.error("[oura/sync] daily_activity:", activityResult.reason);
    byEndpoint.daily_activity = 0;
  }

  // ── heartrate → heart_rate_bpm (sleep/rest only) ────────────────────────────
  if (hrResult.status === "fulfilled") {
    let n = 0;
    for (const item of hrResult.value.data) {
      if (!["sleep", "rest"].includes(item.source as string)) continue;
      if (item.bpm == null) continue;
      rows.push({ user_id: userId, timestamp: item.timestamp as string, metric_name: "heart_rate_bpm", value: item.bpm as number, unit: "bpm", source: "oura" });
      n++;
    }
    byEndpoint.heartrate = n;
  } else {
    console.error("[oura/sync] heartrate:", hrResult.reason);
    byEndpoint.heartrate = 0;
  }

  if (rows.length === 0) {
    return Response.json({ metrics_inserted: 0, by_endpoint: byEndpoint });
  }

  let inserted = 0;
  for (const batch of chunk(rows, 500)) {
    const { data, error } = await db
      .from("apple_health_metrics")
      .upsert(batch, { onConflict: "user_id,timestamp,metric_name,source", ignoreDuplicates: true })
      .select("id");
    if (error) console.error("[oura/sync] Upsert error:", error.message);
    else inserted += (data as unknown[]).length;
  }

  const result = { metrics_inserted: inserted, by_endpoint: byEndpoint };
  console.log("[oura/sync] Complete:", result);
  return Response.json(result);
}
