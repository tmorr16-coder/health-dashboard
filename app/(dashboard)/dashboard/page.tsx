import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import type { Database } from "@/lib/types/database";
import ScoreRings from "./_components/ScoreRings";
import BodyCompChart from "./_components/BodyCompChart";
import DoseReminderBanner from "./_components/DoseReminderBanner";
import ActivityCard from "./_components/ActivityCard";
import RecentWorkoutsCard, { type WorkoutRow } from "./_components/RecentWorkoutsCard";

type DoseRow = Database["public"]["Tables"]["doses"]["Row"];

// ── constants ─────────────────────────────────────────────────────────────────

const INJECTION_SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left arm",
  "Right arm",
];

const MOCK_LAST_SITE = "Right thigh"; // week-4 mock
const MOCK_DOSE_COUNT = 4;

const MOCK_BODY_COMP = {
  startWeight: 191.8,  currentWeight: 184.2,
  startMuscle: 140.4,  currentMuscle: 142.1,
  startBodyFat: 19.2,  currentBodyFat: 16.8,
  weeklyWeight: [191.8, 189.4, 187.1, 185.5, 184.2],
  weeklyMuscle: [140.4, 140.9, 141.3, 141.7, 142.1],
  weeklyFat:    [19.2,  18.6,  17.9,  17.3,  16.8],
};

const SCORE_FALLBACKS = [
  { label: "Readiness", value: 82, color: "#4ecdc4" },
  { label: "Activity",  value: 74, color: "#ffe66d" },
  { label: "Recovery",  value: 88, color: "#a29bfe" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoTs: string): string {
  const mins = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function toMiles(value: number, unit: string): number {
  const u = (unit ?? "km").toLowerCase();
  if (u === "mi" || u === "miles") return value;
  if (u === "km") return value / 1.60934;
  return value / 1609.344; // assume meters
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function nextDoseDateFrom(lastDateStr: string): string {
  // Parse as local date to avoid UTC midnight off-by-one
  const [y, m, d] = lastDateStr.split("-").map(Number);
  const next = new Date(y, m - 1, d + 7);
  return next.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const userId = getCurrentUserId();

  const { data: rawDoses } = (await supabase
    .from("doses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })) as { data: DoseRow[] | null; error: unknown };

  // ── Apple Health queries ────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const sevenDaysAgo = new Date(todayStart);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    { data: lastSyncRows },
    { data: stepsRows },
    { data: energyRows },
    { data: distanceRows },
    { data: hrRows },
    { data: recentWorkoutRows },
    { data: latestWeightRows },
    { data: oldestWeightRows },
  ] = await Promise.all([
    db.from("apple_health_metrics")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .in("metric_name", ["step_count", "Step Count", "Steps"])
      .gte("timestamp", todayStart.toISOString())
      .lt("timestamp", tomorrowStart.toISOString()),
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .in("metric_name", ["active_energy", "Active Energy", "Active Energy Burned"])
      .gte("timestamp", todayStart.toISOString())
      .lt("timestamp", tomorrowStart.toISOString()),
    db.from("apple_health_metrics")
      .select("value, unit")
      .eq("user_id", userId)
      .in("metric_name", ["walking_running_distance", "Walking + Running Distance", "Walking Running Distance"])
      .gte("timestamp", todayStart.toISOString())
      .lt("timestamp", tomorrowStart.toISOString()),
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .in("metric_name", ["heart_rate", "Heart Rate"])
      .order("timestamp", { ascending: false })
      .limit(1),
    db.from("apple_health_workouts")
      .select("id, timestamp, workout_type, duration_sec, distance_m, calories")
      .eq("user_id", userId)
      .gte("timestamp", sevenDaysAgo.toISOString())
      .order("timestamp", { ascending: false })
      .limit(50),
    // Withings weight: most recent reading
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .eq("source", "withings")
      .eq("metric_name", "weight")
      .order("timestamp", { ascending: false })
      .limit(1),
    // Withings weight: oldest reading in last 30 days (for delta)
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId)
      .eq("source", "withings")
      .eq("metric_name", "weight")
      .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: true })
      .limit(1),
  ]);

  // ── Oura score queries ───────────────────────────────────────────────────────
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();
  const [
    { data: readinessRow },
    { data: activityRow },
    { data: sleepScoreRow },
  ] = await Promise.all([
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId).eq("source", "oura").eq("metric_name", "readiness_score")
      .gte("timestamp", sevenDaysAgoIso)
      .order("timestamp", { ascending: false }).limit(1).maybeSingle(),
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId).eq("source", "oura").eq("metric_name", "activity_score")
      .gte("timestamp", sevenDaysAgoIso)
      .order("timestamp", { ascending: false }).limit(1).maybeSingle(),
    db.from("apple_health_metrics")
      .select("value")
      .eq("user_id", userId).eq("source", "oura").eq("metric_name", "sleep_score")
      .gte("timestamp", sevenDaysAgoIso)
      .order("timestamp", { ascending: false }).limit(1).maybeSingle(),
  ]);

  type ScoreRow = { value: number } | null;
  const SCORES = [
    { label: "Readiness", value: Math.round((readinessRow as ScoreRow)?.value  ?? SCORE_FALLBACKS[0].value), color: "#4ecdc4" },
    { label: "Activity",  value: Math.round((activityRow  as ScoreRow)?.value  ?? SCORE_FALLBACKS[1].value), color: "#ffe66d" },
    { label: "Recovery",  value: Math.round((sleepScoreRow as ScoreRow)?.value ?? SCORE_FALLBACKS[2].value), color: "#a29bfe" },
  ];

  const lastSync: string | null =
    (lastSyncRows as { created_at: string }[] | null)?.[0]?.created_at ?? null;

  type MetricRow = { value: number };
  const steps: number | null = (stepsRows as MetricRow[] | null)?.length
    ? Math.round((stepsRows as MetricRow[]).reduce((s, r) => s + r.value, 0))
    : null;
  const activeEnergyCal: number | null = (energyRows as MetricRow[] | null)?.length
    ? Math.round((energyRows as MetricRow[]).reduce((s, r) => s + r.value, 0))
    : null;

  type DistRow = { value: number; unit: string };
  const distanceMiles: number | null = (distanceRows as DistRow[] | null)?.length
    ? parseFloat(
        (distanceRows as DistRow[])
          .reduce((s, r) => s + toMiles(r.value, r.unit), 0)
          .toFixed(2)
      )
    : null;

  const heartRateBpm: number | null =
    (hrRows as MetricRow[] | null)?.[0]?.value ?? null;

  const recentWorkouts: WorkoutRow[] =
    (recentWorkoutRows as WorkoutRow[] | null) ?? [];

  type WtRow = { value: number };
  const withingsCurrentLbs: number | null =
    (latestWeightRows as WtRow[] | null)?.[0]?.value ?? null;
  const withingsOldestLbs: number | null =
    (oldestWeightRows as WtRow[] | null)?.[0]?.value ?? null;

  // ── Dose data ────────────────────────────────────────────────────────────────
  const hasRealDoses = rawDoses && rawDoses.length > 0;

  const lastSite = hasRealDoses
    ? (rawDoses[rawDoses.length - 1].injection_site ?? "Unknown")
    : MOCK_LAST_SITE;

  const doseCount = hasRealDoses ? rawDoses.length : MOCK_DOSE_COUNT;

  const nextDoseDate = hasRealDoses
    ? nextDoseDateFrom(rawDoses[rawDoses.length - 1].date)
    : "Tuesday, Apr 29"; // 7 days after mock week-4 date

  const currentDoseMg = hasRealDoses
    ? rawDoses[rawDoses.length - 1].dose_mg
    : 5;

  const recommendedSite = INJECTION_SITES.find((s) => s !== lastSite) ?? "Left abdomen";

  const bc = MOCK_BODY_COMP;
  const weightLost   = (bc.startWeight  - bc.currentWeight).toFixed(1);
  const muscleGained = (bc.currentMuscle - bc.startMuscle).toFixed(1);
  const fatLost      = (bc.startBodyFat  - bc.currentBodyFat).toFixed(1);

  const today = formatDate(new Date());
  const greeting = getGreeting();

  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", color: "#e8ecf8" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #1a2035" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              fontSize: 12,
              color: "#4a5568",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            {today}
          </div>
          <Link
            href="/dashboard/settings/integrations"
            style={{
              fontSize: 11,
              color: "#3a4460",
              textDecoration: "none",
              padding: "4px 10px",
              border: "1px solid #2a3350",
              borderRadius: 8,
              letterSpacing: 0.5,
            }}
          >
            ⚙ Integrations
          </Link>
        </div>
        <div style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 800 }}>
          {greeting}, <span style={{ color: "#4ecdc4" }}>Terry</span> 👋
        </div>
        <div style={{ fontSize: 13, color: "#7a8299", marginTop: 3, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <span>
            🔥 14-day streak · 💉 Zepbound Wk {doseCount} · Next dose in{" "}
            <span style={{ color: "#fd9644", fontWeight: 600 }}>
              {(() => {
                const [y, m, d] = (
                  hasRealDoses ? rawDoses[rawDoses.length - 1].date : "2026-04-22"
                )
                  .split("-")
                  .map(Number);
                const next = new Date(y, m - 1, d + 7);
                const days = Math.ceil(
                  (next.getTime() - Date.now()) / 86_400_000
                );
                return days > 0 ? `${days} days` : "today";
              })()}
            </span>
          </span>
          {lastSync && (
            <span style={{ fontSize: 11, color: "#3a4460" }}>
              📡 Last sync: {relativeTime(lastSync)}
            </span>
          )}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 24px",
          maxWidth: 1200,
          display: "grid",
          gap: 16,
          gridTemplateColumns: "1fr 1fr",
        }}
      >

        {/* Dose Reminder Banner — Client Component (owns modal state) */}
        <DoseReminderBanner
          recommendedSite={recommendedSite}
          doseCount={doseCount}
          nextDoseDate={nextDoseDate}
          defaultDoseMg={currentDoseMg}
        />

        {/* AI Coach Card */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: "linear-gradient(135deg, #1d2e3d 0%, #1a2035 100%)",
            border: "1px solid #a29bfe50",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, background: "#a29bfe", borderRadius: 2 }} />
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 700,
                color: "#c0c8e0",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              💡 Today&apos;s AI Coach Recommendation
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 32 }}>🏋️</div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#a29bfe",
                  }}
                >
                  Lower Body Power
                </div>
                <div style={{ fontSize: 12, color: "#9aa5c4" }}>
                  45–55 min · Heavy · Quads, Glutes, Hamstrings
                </div>
              </div>
            </div>
            <Link
              href="/dashboard/workout"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #a29bfe 0%, #4ecdc4 100%)",
                color: "#0d1117",
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.5,
                textDecoration: "none",
              }}
            >
              ▸ Start Tracked Session
            </Link>
          </div>
          <div
            style={{
              padding: 12,
              background: "#0d1117",
              borderRadius: 10,
              fontSize: 13,
              color: "#c0c8e0",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#a29bfe", fontWeight: 600 }}>Why this:</span> You&apos;re{" "}
            {doseCount} weeks into Zepbound — lower body resistance is critical for muscle
            preservation. Recovery is high (88) and you haven&apos;t trained legs since Thursday.
          </div>
        </div>

        {/* Activity Card — real Apple Health data */}
        <ActivityCard
          steps={steps}
          activeEnergyCal={activeEnergyCal}
          distanceMiles={distanceMiles}
          heartRateBpm={heartRateBpm}
        />

        {/* Daily Scores */}
        <div
          style={{
            background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
            border: "1px solid #2a3350",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 16, background: "#4ecdc4", borderRadius: 2 }} />
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 700,
                color: "#c0c8e0",
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              Today&apos;s Scores
            </span>
          </div>
          <ScoreRings scores={SCORES} />
        </div>

        {/* Zepbound Progress — links to detail page */}
        <Link
          href="/dashboard/zepbound"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
              border: "1px solid #2a3350",
              borderRadius: 16,
              padding: "20px 22px",
              height: "100%",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 3, height: 16, background: "#5b6ee1", borderRadius: 2 }} />
              <span
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#c0c8e0",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Zepbound · Week {doseCount}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: "#4a5568" }}>
                View all →
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div
                style={{
                  background: "#0d1117",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: "3px solid #4ecdc4",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#7a8299", textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Weight
                </div>
                {withingsCurrentLbs !== null ? (
                  <>
                    <div
                      style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#4ecdc4" }}
                    >
                      {withingsCurrentLbs.toFixed(1)} lbs
                    </div>
                    {withingsOldestLbs !== null && withingsOldestLbs !== withingsCurrentLbs && (
                      <div style={{ fontSize: 10, color: "#7a8299", marginTop: 2 }}>
                        {(() => {
                          const delta = withingsCurrentLbs - withingsOldestLbs;
                          return `${delta > 0 ? "+" : ""}${delta.toFixed(1)} lbs · 30d`;
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#4ecdc4" }}
                  >
                    −{weightLost} lbs
                  </div>
                )}
              </div>
              <div
                style={{
                  background: "#0d1117",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: "3px solid #a29bfe",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#7a8299", textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Muscle
                </div>
                <div
                  style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#a29bfe" }}
                >
                  +{muscleGained} lbs
                </div>
              </div>
              <div
                style={{
                  background: "#0d1117",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: "3px solid #ffe66d",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#7a8299", textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Body Fat
                </div>
                <div
                  style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#ffe66d" }}
                >
                  −{fatLost}%
                </div>
              </div>
              <div
                style={{
                  background: "#0d1117",
                  borderRadius: 10,
                  padding: 12,
                  borderLeft: "3px solid #fd9644",
                }}
              >
                <div
                  style={{ fontSize: 10, color: "#7a8299", textTransform: "uppercase", letterSpacing: 1 }}
                >
                  Doses
                </div>
                <div
                  style={{ fontFamily: "var(--font-syne)", fontSize: 18, fontWeight: 700, color: "#fd9644" }}
                >
                  {doseCount} ✓
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Body Comp Chart */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
            border: "1px solid #2a3350",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 3, height: 16, background: "#5b6ee1", borderRadius: 2 }} />
              <span
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#c0c8e0",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Body Composition · Weeks 1–4
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#7a8299" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 12, height: 2, background: "#4ecdc4" }} />
                Weight
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 12, height: 2, background: "#a29bfe" }} />
                Muscle
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ display: "inline-block", width: 12, height: 2, background: "#ffe66d" }} />
                Body Fat
              </span>
            </div>
          </div>
          <BodyCompChart
            weight={bc.weeklyWeight}
            muscle={bc.weeklyMuscle}
            fat={bc.weeklyFat}
            labels={["Start", "Wk 1", "Wk 2", "Wk 3", "Wk 4"]}
          />
        </div>

        {/* Recent Workouts — last 7 days from apple_health_workouts */}
        <RecentWorkoutsCard workouts={recentWorkouts} />

      </div>
    </div>
  );
}
