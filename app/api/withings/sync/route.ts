import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEV_USER_ID } from "@/lib/auth";

// ── Withings measurement type → app metric mapping ────────────────────────────
// Withings values come as integer mantissa + integer exponent: actual = value * 10^unit
// Weight/mass stored as lbs; percentages and mmHg stored as-is.

const MEASTYPES: Record<number, { metric_name: string; unit: string; toStored: (v: number) => number }> = {
  1:  { metric_name: "weight",                    unit: "lbs", toStored: (v) => v * 2.20462 },
  6:  { metric_name: "body_fat_percent",           unit: "%",   toStored: (v) => v },
  8:  { metric_name: "fat_mass",                   unit: "lbs", toStored: (v) => v * 2.20462 },
  9:  { metric_name: "blood_pressure_diastolic",   unit: "mmHg", toStored: (v) => v },
  10: { metric_name: "blood_pressure_systolic",    unit: "mmHg", toStored: (v) => v },
  11: { metric_name: "heart_rate",                 unit: "bpm", toStored: (v) => v },
  54: { metric_name: "spo2",                       unit: "%",   toStored: (v) => v },
  76: { metric_name: "muscle_mass",                unit: "lbs", toStored: (v) => v * 2.20462 },
  88: { metric_name: "bone_mass",                  unit: "lbs", toStored: (v) => v * 2.20462 },
};

const MEASTYPES_PARAM = Object.keys(MEASTYPES).join(",");

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── Token helpers ─────────────────────────────────────────────────────────────

interface TokenRow {
  access_token:  string;
  refresh_token: string;
  expires_at:    string;
  scope:         string | null;
}

interface WithingsTokenResponse {
  status: number;
  body?: {
    access_token:  string;
    refresh_token: string;
    expires_in:    number;
    scope:         string;
  };
  error?: string;
}

async function getValidToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string
): Promise<{ accessToken: string } | { error: string }> {
  const { data: row, error } = await db
    .from("withings_tokens")
    .select("access_token, refresh_token, expires_at, scope")
    .eq("user_id", userId)
    .single();

  if (error || !row) return { error: "No Withings token found — connect Withings first" };

  const token = row as TokenRow;

  // If token expires in more than 5 minutes, use it
  if (new Date(token.expires_at).getTime() - Date.now() > 5 * 60_000) {
    return { accessToken: token.access_token };
  }

  // Refresh the token
  console.log("[withings/sync] Access token expired, refreshing...");
  let refreshData: WithingsTokenResponse;
  try {
    const res = await fetch("https://wbsapi.withings.net/v2/oauth2", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action:        "requesttoken",
        grant_type:    "refresh_token",
        client_id:     process.env.WITHINGS_CLIENT_ID!,
        client_secret: process.env.WITHINGS_CLIENT_SECRET!,
        refresh_token: token.refresh_token,
      }),
    });
    refreshData = (await res.json()) as WithingsTokenResponse;
  } catch (err) {
    return { error: `Refresh fetch failed: ${err}` };
  }

  if (refreshData.status !== 0 || !refreshData.body) {
    return { error: `Token refresh failed: status ${refreshData.status}` };
  }

  const { access_token, refresh_token, expires_in, scope } = refreshData.body;
  const expires_at = new Date(Date.now() + expires_in * 1000).toISOString();

  await db.from("withings_tokens").update({
    access_token,
    refresh_token,
    expires_at,
    scope,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return { accessToken: access_token };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Allow Vercel cron (sends Authorization: Bearer <CRON_SECRET>)
  // or manual calls (no auth required if CRON_SECRET not set)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db     = createAdminClient() as any;
  const userId = DEV_USER_ID;

  // Get (and refresh if needed) the access token
  const tokenResult = await getValidToken(db, userId);
  if ("error" in tokenResult) {
    console.error("[withings/sync] Token error:", tokenResult.error);
    return NextResponse.json({ error: tokenResult.error }, { status: 400 });
  }

  const { accessToken } = tokenResult;

  // Fetch all measurements from Withings
  let measData: {
    status: number;
    body?: {
      measuregrps: Array<{
        date: number;
        measures: Array<{ value: number; type: number; unit: number }>;
      }>;
    };
  };

  try {
    const url = new URL("https://wbsapi.withings.net/measure");
    url.searchParams.set("action", "getmeas");
    url.searchParams.set("meastypes", MEASTYPES_PARAM);
    url.searchParams.set("category", "1"); // real measurements only

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    measData = await res.json();
  } catch (err) {
    console.error("[withings/sync] Measure fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch Withings measurements" }, { status: 500 });
  }

  if (measData.status !== 0 || !measData.body) {
    console.error("[withings/sync] Withings measure API error:", measData.status);
    return NextResponse.json(
      { error: `Withings API error: status ${measData.status}` },
      { status: 500 }
    );
  }

  // Build rows to insert
  const rows: {
    user_id:     string;
    timestamp:   string;
    metric_name: string;
    value:       number;
    unit:        string;
    source:      string;
  }[] = [];

  for (const grp of measData.body.measuregrps) {
    const timestamp = new Date(grp.date * 1000).toISOString();
    for (const m of grp.measures) {
      const mapping = MEASTYPES[m.type];
      if (!mapping) continue;
      const rawValue   = m.value * Math.pow(10, m.unit);
      const storedValue = mapping.toStored(rawValue);
      rows.push({
        user_id:     userId,
        timestamp,
        metric_name: mapping.metric_name,
        value:       parseFloat(storedValue.toFixed(4)),
        unit:        mapping.unit,
        source:      "withings",
      });
    }
  }

  if (rows.length === 0) {
    console.log("[withings/sync] No measurements returned from Withings");
    return NextResponse.json({ measurements_inserted: 0 });
  }

  console.log(`[withings/sync] Inserting ${rows.length} rows...`);

  let inserted = 0;
  for (const batch of chunk(rows, 500)) {
    const { data, error } = await db
      .from("apple_health_metrics")
      .upsert(batch, {
        onConflict:       "user_id,timestamp,metric_name,source",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) {
      console.error("[withings/sync] Upsert error:", error.message);
    } else {
      inserted += (data as unknown[]).length;
    }
  }

  const result = { measurements_inserted: inserted };
  console.log("[withings/sync] Complete:", result);
  return NextResponse.json(result);
}
