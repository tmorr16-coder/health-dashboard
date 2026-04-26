import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";
import type { Database } from "@/lib/types/database";
import ScoreRings from "./_components/ScoreRings";
import BodyCompChart from "./_components/BodyCompChart";

type DoseRow = Database["public"]["Tables"]["doses"]["Row"];

// ── mock fallback data ────────────────────────────────────────────────────────

const MOCK_DOSES = [
  { week: 1, date: "Apr 1",  dose: "5 mg", site: "Left abdomen",  time: "7:30 AM" },
  { week: 2, date: "Apr 8",  dose: "5 mg", site: "Right abdomen", time: "7:45 AM" },
  { week: 3, date: "Apr 15", dose: "5 mg", site: "Left thigh",    time: "8:00 AM" },
  { week: 4, date: "Apr 22", dose: "5 mg", site: "Right thigh",   time: "7:15 AM" },
];

const INJECTION_SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left arm",
  "Right arm",
];

const MOCK_BODY_COMP = {
  startWeight: 191.8, currentWeight: 184.2,
  startMuscle: 140.4, currentMuscle: 142.1,
  startBodyFat: 19.2, currentBodyFat: 16.8,
  weeklyWeight: [191.8, 189.4, 187.1, 185.5, 184.2],
  weeklyMuscle: [140.4, 140.9, 141.3, 141.7, 142.1],
  weeklyFat:    [19.2,  18.6,  17.9,  17.3,  16.8],
};

const SCORES = [
  { label: "Readiness", value: 82, color: "#4ecdc4" },
  { label: "Activity",  value: 74, color: "#ffe66d" },
  { label: "Recovery",  value: 88, color: "#a29bfe" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

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

// ── page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const userId = getCurrentUserId();

  const { data: rawDoses } = (await supabase
    .from("doses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })) as { data: DoseRow[] | null; error: unknown };

  const doses =
    rawDoses && rawDoses.length > 0
      ? rawDoses.map((d, i) => ({
          week: i + 1,
          date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          dose: `${d.dose_mg} mg`,
          site: d.injection_site ?? "Unknown",
          time: new Date(d.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        }))
      : MOCK_DOSES;

  const lastSite = doses[doses.length - 1]?.site;
  const recommendedSite = INJECTION_SITES.find((s) => s !== lastSite) ?? "Left abdomen";
  const doseCount = doses.length;

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
        <div
          style={{
            fontFamily: "var(--font-syne)",
            fontSize: 26,
            fontWeight: 800,
          }}
        >
          {greeting},{" "}
          <span style={{ color: "#4ecdc4" }}>Terry</span> 👋
        </div>
        <div style={{ fontSize: 13, color: "#7a8299", marginTop: 3 }}>
          🔥 14-day streak · 💉 Zepbound Wk {doseCount} · Next dose in{" "}
          <span style={{ color: "#fd9644", fontWeight: 600 }}>3 days</span>
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

        {/* Dose Reminder Banner */}
        <div
          style={{
            gridColumn: "1 / -1",
            background: "linear-gradient(135deg, #2a1f3d 0%, #1a2035 100%)",
            border: "1px solid #5b6ee180",
            borderRadius: 16,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #5b6ee1 0%, #a29bfe 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                }}
              >
                💉
              </div>
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#5b6ee1",
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Next Zepbound Dose
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-syne)",
                    fontSize: 22,
                    fontWeight: 800,
                    marginTop: 2,
                  }}
                >
                  Tuesday, Apr 28{" "}
                  <span style={{ color: "#7a8299", fontSize: 14, fontWeight: 400 }}>
                    · 7:30 AM
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#9aa5c4", marginTop: 2 }}>
                  5 mg · Suggested site:{" "}
                  <span style={{ color: "#4ecdc4" }}>{recommendedSite}</span>
                </div>
              </div>
            </div>
            <button
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #5b6ee1 0%, #a29bfe 100%)",
                color: "#fff",
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✓ Log Dose Now
            </button>
          </div>
        </div>

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
            <button
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #a29bfe 0%, #4ecdc4 100%)",
                color: "#0d1117",
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 0.5,
              }}
            >
              ▸ Start Tracked Session
            </button>
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

        {/* Zepbound Progress */}
        <div
          style={{
            background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
            border: "1px solid #2a3350",
            borderRadius: 16,
            padding: "20px 22px",
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
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div
              style={{
                background: "#0d1117",
                borderRadius: 10,
                padding: 12,
                borderLeft: "3px solid #4ecdc4",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#7a8299",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Weight
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#4ecdc4",
                }}
              >
                −{weightLost} lbs
              </div>
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
                style={{
                  fontSize: 10,
                  color: "#7a8299",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Muscle
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#a29bfe",
                }}
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
                style={{
                  fontSize: 10,
                  color: "#7a8299",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Body Fat
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#ffe66d",
                }}
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
                style={{
                  fontSize: 10,
                  color: "#7a8299",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Doses
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#fd9644",
                }}
              >
                {doseCount} ✓
              </div>
            </div>
          </div>
        </div>

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
                <span
                  style={{ display: "inline-block", width: 12, height: 2, background: "#4ecdc4" }}
                />
                Weight
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{ display: "inline-block", width: 12, height: 2, background: "#a29bfe" }}
                />
                Muscle
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{ display: "inline-block", width: 12, height: 2, background: "#ffe66d" }}
                />
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

      </div>
    </div>
  );
}
