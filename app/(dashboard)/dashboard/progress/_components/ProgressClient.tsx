"use client";

import { useState, useMemo } from "react";
import TrendChart from "./TrendChart";

// ── Design tokens ────────────────────────────────────────────────
const C_SLATE  = "#2f3a47";
const C_MOSS   = "#4a6a4d";
const C_ACCENT = "#b84a2e";

// ── Mock data (replaced when body-scan / lift-tracking integration exists) ───
const MOCK_WEEKS_AGO  = [-12, -9, -6, -3, 0];
const MOCK_WEIGHTS    = [191.8, 189.4, 187.1, 185.5, 184.2];
const MOCK_MUSCLES    = [140.4, 140.9, 141.3, 141.7, 142.1];
const MOCK_FATS       = [19.2,  18.6,  17.9,  17.3,  16.8];

const MOCK_LIFT_PRS = [
  { name: "Back Squat",      val: 245, delta: "+15" },
  { name: "Romanian DL",     val: 215, delta: "+10" },
  { name: "Bench Press",     val: 195, delta: "+5"  },
  { name: "Overhead Press",  val: 125, delta: "+5"  },
];

// ── Props from server ─────────────────────────────────────────────
export interface ProgressProps {
  withingsCurrent: number | null;
  withingsDelta30d: number | null;
  weeklyMiles: number | null;
  weeklyRuns: number;
  avgPaceSec: number | null;
}

// ── Helpers ───────────────────────────────────────────────────────
function fmtPace(sec: number | null): string {
  if (sec === null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Segmented control ─────────────────────────────────────────────
type Tab = "body" | "lifts" | "cardio";

function Seg({ value, options, onChange }: {
  value: string;
  options: { k: Tab; l: string }[];
  onChange: (v: Tab) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        background: "var(--color-bg-sunk)",
        borderRadius: 10,
        padding: 3,
        gap: 2,
        marginBottom: 16,
      }}
    >
      {options.map((o) => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          style={{
            flex: 1,
            padding: "7px 0",
            borderRadius: 8,
            border: "none",
            background: value === o.k ? "var(--color-bg-raised)" : "transparent",
            color: value === o.k ? "var(--color-ink)" : "var(--color-ink-3)",
            fontSize: 12,
            fontWeight: value === o.k ? 600 : 400,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: value === o.k ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
            transition: "background 120ms",
          }}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

// ── Stat block ────────────────────────────────────────────────────
function StatBlock({
  label, value, unit, delta, deltaGood,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaGood?: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-sunk)",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>{unit}</span>
        )}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            marginTop: 4,
            color: deltaGood ? "var(--color-moss)" : "var(--color-ink-3)",
          }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function ProgressClient({
  withingsCurrent,
  withingsDelta30d,
  weeklyMiles,
  weeklyRuns,
  avgPaceSec,
}: ProgressProps) {
  const [tab, setTab] = useState<Tab>("body");

  const bodyData = useMemo(() => {
    return MOCK_WEEKS_AGO.map((weeksAgo, i) => {
      const d = new Date();
      d.setDate(d.getDate() + weeksAgo * 7);
      // Use real current weight if available, scale back proportionally
      const realCurrent = withingsCurrent ?? MOCK_WEIGHTS[MOCK_WEIGHTS.length - 1];
      const mockCurrent = MOCK_WEIGHTS[MOCK_WEIGHTS.length - 1];
      const offset = realCurrent - mockCurrent;
      return {
        date: d,
        weight: MOCK_WEIGHTS[i] + offset,
        muscle: MOCK_MUSCLES[i],
        fat:    MOCK_FATS[i],
      };
    });
  }, [withingsCurrent]);

  // Body comp stats (bottom section, always visible)
  const currentWeight = withingsCurrent ?? MOCK_WEIGHTS[MOCK_WEIGHTS.length - 1];
  const weightDelta = withingsDelta30d != null
    ? `${withingsDelta30d > 0 ? "+" : ""}${withingsDelta30d.toFixed(1)} lb · 30d`
    : `−${(MOCK_WEIGHTS[0] - MOCK_WEIGHTS[4]).toFixed(1)} lb · 12 wks`;
  const weightDeltaGood = withingsDelta30d != null ? withingsDelta30d < 0 : true;

  return (
    <div style={{ padding: "20px 20px 0" }}>

      {/* Header */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          marginBottom: 6,
        }}
      >
        Progress
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "var(--color-ink)",
          marginBottom: 20,
        }}
      >
        How you&apos;re
        <br />trending.
      </div>

      {/* Tab control */}
      <Seg
        value={tab}
        options={[
          { k: "body",   l: "Body"   },
          { k: "lifts",  l: "Lifts"  },
          { k: "cardio", l: "Cardio" },
        ]}
        onChange={setTab}
      />

      {/* ── Body tab ─────────────────────────────────────────── */}
      {tab === "body" && (
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <TrendChart
            data={bodyData}
            height={220}
            metrics={[
              { key: "weight", label: "Weight",    color: C_SLATE,  unit: "lb" },
              { key: "muscle", label: "Lean mass", color: C_MOSS,   unit: "lb" },
              { key: "fat",    label: "Body fat",  color: C_ACCENT, unit: "%" },
            ]}
          />
        </div>
      )}

      {/* ── Lifts tab ─────────────────────────────────────────── */}
      {tab === "lifts" && (
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-ink-3)",
              marginBottom: 14,
            }}
          >
            Estimated 1RM
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {MOCK_LIFT_PRS.map((l) => (
              <div key={l.name}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 7,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: "var(--color-ink)",
                    }}
                  >
                    {l.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {l.val}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>lb ·</span>
                    <span style={{ fontSize: 11, fontWeight: 500, color: "var(--color-moss)" }}>
                      {l.delta}
                    </span>
                  </span>
                </div>
                <div
                  style={{
                    height: 4,
                    background: "var(--color-bg-sunk)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(l.val / 300) * 100}%`,
                      background: "var(--color-ink)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Cardio tab ─────────────────────────────────────────── */}
      {tab === "cardio" && (
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-ink-3)",
              marginBottom: 14,
            }}
          >
            Running · Last 7 days
          </div>
          {weeklyRuns === 0 ? (
            <div
              style={{
                fontSize: 13,
                color: "var(--color-ink-4)",
                textAlign: "center",
                padding: "16px 0",
              }}
            >
              No runs recorded this week
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatBlock
                label="Avg pace"
                value={fmtPace(avgPaceSec)}
                unit="/mi"
              />
              <StatBlock
                label="Weekly miles"
                value={weeklyMiles != null ? weeklyMiles.toFixed(1) : "—"}
                unit="mi"
                delta={`${weeklyRuns} run${weeklyRuns !== 1 ? "s" : ""}`}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Body composition stats (always shown) ────────────── */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          margin: "20px 0 10px",
        }}
      >
        Body composition
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 5 }}>
            Weight
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em" }}>
              {currentWeight.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>lb</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 4, color: weightDeltaGood ? "var(--color-moss)" : "var(--color-ink-3)" }}>
            {weightDelta}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 5 }}>
            Lean mass
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em" }}>
              {MOCK_MUSCLES[4].toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>lb</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 4, color: "var(--color-moss)" }}>
            +{(MOCK_MUSCLES[4] - MOCK_MUSCLES[0]).toFixed(1)} lb · 12 wks
          </div>
        </div>

        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 5 }}>
            Body fat %
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em" }}>
              {MOCK_FATS[4].toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>%</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 4, color: "var(--color-moss)" }}>
            −{(MOCK_FATS[0] - MOCK_FATS[4]).toFixed(1)} pts · 12 wks
          </div>
        </div>

        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 5 }}>
            Waist
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400, letterSpacing: "-0.02em" }}>
              33.5
            </span>
            <span style={{ fontSize: 11, color: "var(--color-ink-3)" }}>in</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", marginTop: 4, color: "var(--color-moss)" }}>
            −1.0 in · 12 wks
          </div>
        </div>
      </div>
    </div>
  );
}
