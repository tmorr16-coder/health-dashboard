"use client";

import { useTransition } from "react";
import type { Exercise, SetLog } from "../exercise-library";

interface Props {
  exercises: Exercise[];
  setLogs: (SetLog | null)[][];
  sessionElapsed: number;
  onDone: () => void;
}

const syne = "var(--font-syne)";
const mono = "var(--font-jetbrains-mono)";
const dm = "var(--font-dm-sans)";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PostWorkoutSummary({ exercises, setLogs, sessionElapsed, onDone }: Props) {
  const [isPending, startTransition] = useTransition();

  const allSets = setLogs.flat().filter((s): s is SetLog => s !== null);
  const totalVolume = allSets.reduce((sum, s) => sum + s.reps * s.weight, 0);
  const totalReps = allSets.reduce((sum, s) => sum + s.reps, 0);
  const avgRpe = allSets.length > 0
    ? (allSets.reduce((sum, s) => sum + s.rpe, 0) / allSets.length).toFixed(1)
    : "0";
  const estCalories = Math.round((sessionElapsed / 60) * 6.5);

  const breakdown = exercises.map((ex, i) => {
    const thisSets = (setLogs[i] ?? []).filter((s): s is SetLog => s !== null);
    const thisVol = thisSets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    const lastVol = ex.lastSession.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
    const isPR = thisVol > lastVol && thisSets.length > 0;
    const topSet = thisSets.reduce<SetLog | null>(
      (best, s) => (!best || s.weight * s.reps > best.weight * best.reps ? s : best),
      null
    );
    return { name: ex.name, thisVol, lastVol, delta: thisVol - lastVol, isPR, topSet, muscles: ex.muscles };
  });

  const prCount = breakdown.filter((e) => e.isPR).length;
  const lastTotalVol = exercises.reduce(
    (sum, ex) => sum + ex.lastSession.sets.reduce((s2, s) => s2 + s.reps * s.weight, 0),
    0
  );
  const volDeltaPct = lastTotalVol > 0
    ? ((totalVolume - lastTotalVol) / lastTotalVol * 100).toFixed(1)
    : null;

  const muscleGroups = [...new Set(exercises.flatMap((ex) => ex.muscles))];

  return (
    <div style={{ fontFamily: dm, color: "#e8ecf8", minHeight: "100vh", padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1d2e3d 0%, #1a1b3a 100%)",
        border: "1px solid #4ecdc450",
        borderRadius: 20,
        padding: "32px 28px",
        textAlign: "center",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.05 }}>💪</div>
        <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
        <div style={{ fontFamily: syne, fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
          Workout Complete!
        </div>
        <div style={{ fontSize: 13, color: "#9aa5c4", marginBottom: 24 }}>
          Lower Body Power · {formatTime(sessionElapsed)}
          {prCount > 0 && (
            <span style={{ marginLeft: 12, color: "#4ecdc4", fontWeight: 700 }}>
              🏆 {prCount} PR{prCount > 1 ? "s" : ""}!
            </span>
          )}
        </div>

        {/* Key stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 700, margin: "0 auto" }}>
          {[
            { label: "Total Volume",  value: totalVolume.toLocaleString(), unit: "lbs",   color: "#4ecdc4" },
            { label: "Total Reps",    value: totalReps,                    unit: "reps",  color: "#a29bfe" },
            { label: "Avg RPE",       value: avgRpe,                       unit: "/ 10",  color: "#ffe66d" },
            { label: "Est. Calories", value: estCalories,                  unit: "kcal",  color: "#fd9644" },
          ].map(({ label, value, unit, color }) => (
            <div key={label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: "14px 10px" }}>
              <div style={{ fontSize: 10, color: "#7a8299", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, color }}>
                {value} <span style={{ fontSize: 11, color: "#4a5568", fontWeight: 400 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {volDeltaPct !== null && (
          <div style={{ marginTop: 16, fontSize: 13, color: parseFloat(volDeltaPct) >= 0 ? "#4ecdc4" : "#ff6b6b" }}>
            {parseFloat(volDeltaPct) >= 0 ? "↑" : "↓"} {Math.abs(parseFloat(volDeltaPct))}% volume vs last session
          </div>
        )}
      </div>

      {/* ── Per-exercise breakdown ────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)", border: "1px solid #2a3350", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 3, height: 16, background: "#a29bfe", borderRadius: 2 }} />
          <span style={{ fontFamily: syne, fontSize: 13, fontWeight: 700, color: "#c0c8e0", letterSpacing: 1.2, textTransform: "uppercase" }}>
            Exercise Breakdown
          </span>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {breakdown.map((ex) => (
            <div key={ex.name} style={{
              background: "#0d1117",
              borderRadius: 12,
              padding: "14px 16px",
              border: `1px solid ${ex.isPR ? "#4ecdc430" : "#1e2433"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: syne, fontSize: 14, fontWeight: 700 }}>
                    {ex.name}
                    {ex.isPR && <span style={{ marginLeft: 8, fontSize: 11, color: "#4ecdc4", fontWeight: 700 }}>🏆 PR</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a8299", marginTop: 2 }}>
                    {ex.muscles.join(", ")}
                    {ex.topSet && (
                      <span style={{ marginLeft: 8, color: "#9aa5c4", fontFamily: mono }}>
                        Top set: {ex.topSet.weight}lb × {ex.topSet.reps}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: mono, fontSize: 16, fontWeight: 700, color: ex.isPR ? "#4ecdc4" : "#c0c8e0" }}>
                    {ex.thisVol.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 10, color: "#4a5568" }}>lbs volume</div>
                </div>
              </div>
              {/* Volume comparison bars */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10, marginBottom: 4 }}>
                <span style={{ color: "#7a8299", width: 48 }}>Last:</span>
                <div style={{ flex: 1, height: 6, background: "#1e2433", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(ex.lastVol / Math.max(ex.thisVol, ex.lastVol, 1)) * 100}%`, height: "100%", background: "#4a5568" }} />
                </div>
                <span style={{ color: "#7a8299", fontFamily: mono, width: 48, textAlign: "right" }}>{ex.lastVol}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10 }}>
                <span style={{ color: ex.isPR ? "#4ecdc4" : "#9aa5c4", width: 48 }}>Today:</span>
                <div style={{ flex: 1, height: 6, background: "#1e2433", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(ex.thisVol / Math.max(ex.thisVol, ex.lastVol, 1)) * 100}%`, height: "100%", background: ex.isPR ? "#4ecdc4" : "#a29bfe" }} />
                </div>
                <span style={{ color: ex.isPR ? "#4ecdc4" : "#c0c8e0", fontFamily: mono, width: 48, textAlign: "right", fontWeight: 700 }}>
                  {ex.thisVol > 0 ? ex.thisVol : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recovery prescription ──────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1a1b3a 0%, #1a2035 100%)",
        border: "1px solid #5b6ee150",
        borderRadius: 16,
        padding: "20px 22px",
        marginBottom: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: "#5b6ee1", borderRadius: 2 }} />
          <span style={{ fontFamily: syne, fontSize: 13, fontWeight: 700, color: "#c0c8e0", letterSpacing: 1.2, textTransform: "uppercase" }}>
            🔋 Recovery Prescription
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#9aa5c4", marginBottom: 14, lineHeight: 1.5 }}>
          You just stressed {muscleGroups.slice(0, 4).join(", ")}. Muscle protein synthesis stays elevated for ~48hrs.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {[
            { icon: "🥩", label: "Protein", val: "165g today",  note: "~40g in next 90 min",    color: "#a29bfe", priority: true },
            { icon: "💧", label: "Hydrate", val: "+24oz",        note: "Within 1hr post",         color: "#4ecdc4" },
            { icon: "🔥", label: "Sauna",   val: "25 min",       note: "Tonight or tomorrow",     color: "#fd9644" },
            { icon: "😴", label: "Sleep",   val: "8+ hours",     note: "Critical for recovery",   color: "#ffe66d" },
          ].map((r) => (
            <div key={r.label} style={{
              background: "#0d1117",
              borderRadius: 10,
              padding: 12,
              border: r.priority ? `1px solid ${r.color}50` : "1px solid #1e2640",
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{r.icon}</div>
              <div style={{ fontSize: 10, color: "#7a8299", letterSpacing: 1, textTransform: "uppercase" }}>{r.label}</div>
              <div style={{ fontFamily: syne, fontSize: 14, fontWeight: 700, color: r.color, marginTop: 2 }}>{r.val}</div>
              <div style={{ fontSize: 10, color: "#7a8299", marginTop: 2 }}>{r.note}</div>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 14, padding: 12,
          background: "rgba(91,110,225,0.1)", border: "1px solid #5b6ee140",
          borderRadius: 10, fontSize: 12, color: "#c0c8e0", lineHeight: 1.5,
        }}>
          <span style={{ color: "#a29bfe", fontWeight: 600 }}>💉 Zepbound note:</span> GLP-1s suppress appetite, but protein is non-negotiable today. Aim for ~40g in the next 90 min.
        </div>
      </div>

      {/* ── Actions ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center", paddingBottom: 32 }}>
        <button style={{
          padding: "12px 20px", borderRadius: 10, border: "1px solid #2a3350",
          background: "transparent", color: "#9aa5c4", fontFamily: syne,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          📤 Share Workout
        </button>
        <button style={{
          padding: "12px 20px", borderRadius: 10, border: "1px solid #2a3350",
          background: "transparent", color: "#9aa5c4", fontFamily: syne,
          fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>
          📝 Add Note
        </button>
        <button
          onClick={() => startTransition(() => { onDone(); })}
          disabled={isPending}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "none",
            background: isPending ? "#2a3350" : "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)",
            color: isPending ? "#7a8299" : "#0d1117",
            fontFamily: syne, fontSize: 14, fontWeight: 800, letterSpacing: 0.5, cursor: isPending ? "not-allowed" : "pointer",
            boxShadow: isPending ? "none" : "0 4px 16px rgba(78,205,196,0.3)",
          }}
        >
          {isPending ? "Saving…" : "✓ Save & Return Home"}
        </button>
      </div>
    </div>
  );
}
