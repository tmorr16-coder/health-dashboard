"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EXERCISE_LIBRARY, suggestNext, type SetLog } from "../exercise-library";
import { createWorkoutSession, saveSet, finishSession } from "../actions";
import PostWorkoutSummary from "./PostWorkoutSummary";

// ── shared style tokens ────────────────────────────────────────────────────────
const syne = "var(--font-syne)";
const mono = "var(--font-jetbrains-mono)";
const dm   = "var(--font-dm-sans)";

const cardBase: React.CSSProperties = {
  background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
  border: "1px solid #2a3350",
  borderRadius: 16,
  padding: "20px 22px",
};

const stepBtn: React.CSSProperties = {
  width: 36, height: 44, borderRadius: 8,
  border: "1px solid #2a3350", background: "transparent",
  color: "#a29bfe", fontSize: 18, fontWeight: 700, cursor: "pointer",
};

const numInput: React.CSSProperties = {
  flex: 1, height: 44, background: "#161c2d",
  border: "1px solid #2a3350", borderRadius: 8,
  color: "#fff", fontFamily: mono, fontSize: 18,
  fontWeight: 700, textAlign: "center", outline: "none",
  colorScheme: "dark",
};

function formatTime(sec: number) {
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
}

function CardTitle({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{ width: 3, height: 16, background: accent, borderRadius: 2 }} />
      <span style={{ fontFamily: syne, fontSize: 12, fontWeight: 700, color: "#c0c8e0", letterSpacing: 1.2, textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

interface Session { id: string; exerciseIds: string[] }

export default function WorkoutTracker() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const createdRef = useRef(false);

  // Session metadata
  const [session, setSession]       = useState<Session | null>(null);
  const [creating, setCreating]     = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  // Workout state
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [setLogs, setSetLogs] = useState<(SetLog | null)[][]>(
    EXERCISE_LIBRARY.map((ex) => Array<SetLog | null>(ex.target.sets).fill(null))
  );
  const [activeSetIdx, setActiveSetIdx] = useState(0);
  const [inputReps,   setInputReps]   = useState("");
  const [inputWeight, setInputWeight] = useState("");
  const [inputRpe,    setInputRpe]    = useState(7);

  // Rest timer
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal,     setRestTotal]     = useState(0);
  const restRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Session clock
  const [sessionStart]    = useState(() => Date.now());
  const [sessionElapsed,  setSessionElapsed]  = useState(0);
  const [showSummary,     setShowSummary]     = useState(false);
  const [finalElapsed,    setFinalElapsed]    = useState(0);

  // ── effects ──────────────────────────────────────────────────────────────

  // Create session once on mount (ref guards React 19 Strict-Mode double-fire)
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    createWorkoutSession().then((result) => {
      if (result.error) setCreateError(result.error);
      else setSession({ id: result.sessionId, exerciseIds: result.exerciseIds });
      setCreating(false);
    });
  }, []);

  // Session elapsed clock
  useEffect(() => {
    const id = setInterval(() => setSessionElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(id);
  }, [sessionStart]);

  // Rest timer countdown
  useEffect(() => {
    if (restRemaining <= 0) return;
    restRef.current = setTimeout(() => setRestRemaining((r) => r - 1), 1000);
    return () => { if (restRef.current) clearTimeout(restRef.current); };
  }, [restRemaining]);

  // Pre-fill inputs when exercise or set changes
  const currentEx = EXERCISE_LIBRARY[currentExIdx];
  const suggested = suggestNext(currentEx.lastSession, currentEx.target);

  useEffect(() => {
    setInputWeight(suggested.weight.toString());
    setInputReps(suggested.reps.toString());
    setInputRpe(7);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExIdx, activeSetIdx]);

  // ── derived values ────────────────────────────────────────────────────────

  const totalSets     = EXERCISE_LIBRARY.reduce((s, ex) => s + ex.target.sets, 0);
  const completedSets = setLogs.flat().filter(Boolean).length;
  const progressPct   = (completedSets / totalSets) * 100;
  const totalVolume   = setLogs.flat().filter(Boolean).reduce((s, log) => s + log!.reps * log!.weight, 0);
  const allSetsDone   = completedSets === totalSets;

  // ── handlers ─────────────────────────────────────────────────────────────

  const handleLogSet = () => {
    const reps   = parseInt(inputReps)   || 0;
    const weight = parseFloat(inputWeight) || 0;
    if (reps === 0 || weight === 0) return;

    const setNumber = activeSetIdx + 1;

    // Optimistic UI update
    const newLogs = setLogs.map((row) => [...row]);
    newLogs[currentExIdx][activeSetIdx] = { reps, weight, rpe: inputRpe };
    setSetLogs(newLogs);

    // Start rest timer
    setRestRemaining(currentEx.restSec);
    setRestTotal(currentEx.restSec);

    // Auto-advance to next set / exercise
    if (activeSetIdx < currentEx.target.sets - 1) {
      setActiveSetIdx(activeSetIdx + 1);
    } else if (currentExIdx < EXERCISE_LIBRARY.length - 1) {
      setCurrentExIdx(currentExIdx + 1);
      setActiveSetIdx(0);
    }

    // Persist in background
    if (session?.exerciseIds[currentExIdx]) {
      startTransition(async () => {
        await saveSet({ exerciseId: session.exerciseIds[currentExIdx], setNumber, reps, weight, rpe: inputRpe });
      });
    }
  };

  const handleFinish = () => {
    setFinalElapsed(sessionElapsed);
    setShowSummary(true);
  };

  const handleSaveAndReturn = () => {
    startTransition(async () => {
      if (session) await finishSession(session.id, Math.round(sessionElapsed / 60));
      router.push("/dashboard");
    });
  };

  // ── early returns ─────────────────────────────────────────────────────────

  if (showSummary) {
    return (
      <PostWorkoutSummary
        exercises={EXERCISE_LIBRARY}
        setLogs={setLogs}
        sessionElapsed={finalElapsed}
        onDone={handleSaveAndReturn}
      />
    );
  }

  if (creating) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#7a8299", fontFamily: dm, gap: 12 }}>
        <span style={{ fontSize: 24 }}>⏳</span> Starting session…
      </div>
    );
  }

  if (createError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, fontFamily: dm }}>
        <div style={{ color: "#ff6b6b" }}>Failed to start session: {createError}</div>
        <button onClick={() => router.push("/dashboard")} style={{ padding: "10px 20px", borderRadius: 8, border: "1px solid #2a3350", background: "transparent", color: "#9aa5c4", cursor: "pointer" }}>
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: dm, color: "#e8ecf8" }}>

      {/* ── Session header ─────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1a2035" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, paddingBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "#4a5568", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>
              Active Session
            </div>
            <div style={{ fontFamily: syne, fontSize: 24, fontWeight: 800 }}>🏋️ Lower Body Power</div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: "#4ecdc4" }}>
                {formatTime(sessionElapsed)}
              </div>
              <div style={{ fontSize: 10, color: "#7a8299" }}>SESSION</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 700, color: "#a29bfe" }}>
                {completedSets}/{totalSets}
              </div>
              <div style={{ fontSize: 10, color: "#7a8299" }}>SETS</div>
            </div>
            {completedSets > 0 && (
              <button
                onClick={handleFinish}
                style={{
                  padding: "10px 16px", borderRadius: 10,
                  border: allSetsDone ? "none" : "1px solid #2a3350",
                  background: allSetsDone
                    ? "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)"
                    : "#161c2d",
                  color: allSetsDone ? "#0d1117" : "#9aa5c4",
                  fontFamily: syne, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
                  boxShadow: allSetsDone ? "0 4px 16px rgba(78,205,196,0.3)" : "none",
                }}
              >
                {allSetsDone ? "✓ Finish Workout" : "End Early"}
              </button>
            )}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 4, background: "#1e2433", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            width: `${progressPct}%`, height: "100%",
            background: "linear-gradient(90deg, #a29bfe 0%, #4ecdc4 100%)",
            transition: "width 0.5s ease",
          }} />
        </div>
      </div>

      {/* ── 3-column grid ──────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px", maxWidth: 1300, display: "grid", gridTemplateColumns: "280px 1fr 260px", gap: 16 }}>

        {/* ── LEFT: Exercise list ──────────────────────────────────────────── */}
        <div style={{ ...cardBase, alignSelf: "start" }}>
          <CardTitle accent="#a29bfe">Exercises</CardTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {EXERCISE_LIBRARY.map((ex, i) => {
              const doneSets = setLogs[i].filter(Boolean).length;
              const isActive = i === currentExIdx;
              const isDone   = doneSets === ex.target.sets;
              return (
                <div
                  key={i}
                  onClick={() => {
                    setCurrentExIdx(i);
                    const next = setLogs[i].findIndex((s) => s === null);
                    setActiveSetIdx(next === -1 ? ex.target.sets - 1 : next);
                  }}
                  style={{
                    background: isActive ? "rgba(162,155,254,0.1)" : "#0d1117",
                    border: `1px solid ${isActive ? "#a29bfe" : "#1e2640"}`,
                    borderRadius: 10, padding: 12, cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontFamily: syne, fontSize: 13, fontWeight: 700, color: isActive ? "#a29bfe" : "#c0c8e0" }}>
                      {ex.name}
                    </div>
                    {isDone && <span style={{ color: "#4ecdc4" }}>✓</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "#7a8299", display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span>{ex.target.sets}×{ex.target.reps} @ {ex.target.weight}lb</span>
                    <span style={{ color: isDone ? "#4ecdc4" : "#7a8299" }}>{doneSets}/{ex.target.sets}</span>
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 3 }}>
                    {Array.from({ length: ex.target.sets }).map((_, si) => (
                      <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: setLogs[i][si] ? "#4ecdc4" : "#1e2433" }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Live volume */}
          <div style={{ marginTop: 16, padding: 12, background: "#0d1117", borderRadius: 10, border: "1px solid #1e2640" }}>
            <div style={{ fontSize: 10, color: "#7a8299", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
              Live Volume
            </div>
            <div style={{ fontFamily: syne, fontSize: 22, fontWeight: 800, color: "#4ecdc4" }}>
              {totalVolume.toLocaleString()} <span style={{ fontSize: 12, color: "#7a8299" }}>lbs</span>
            </div>
          </div>
        </div>

        {/* ── MIDDLE: Active set logger ────────────────────────────────────── */}
        <div style={cardBase}>
          {/* Exercise title */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#a29bfe", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
              Exercise {currentExIdx + 1} of {EXERCISE_LIBRARY.length}
            </div>
            <div style={{ fontFamily: syne, fontSize: 28, fontWeight: 800, marginTop: 2 }}>
              {currentEx.name}
            </div>
            <div style={{ fontSize: 12, color: "#7a8299", marginTop: 4 }}>
              Target: <span style={{ color: "#c0c8e0" }}>
                {currentEx.target.sets} × {currentEx.target.reps} @ {currentEx.target.weight} lbs
              </span>{" "}· Rest {currentEx.restSec}s
            </div>
          </div>

          {/* Smart Coach hint */}
          {suggested.hint && (
            <div style={{
              padding: 12,
              background: "linear-gradient(135deg, rgba(78,205,196,0.1), rgba(162,155,254,0.1))",
              border: "1px solid #4ecdc450", borderRadius: 10,
              marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <div>
                <div style={{ fontSize: 11, color: "#4ecdc4", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>
                  Smart Coach
                </div>
                <div style={{ fontSize: 13, color: "#c0c8e0" }}>{suggested.hint}</div>
              </div>
            </div>
          )}

          {/* Sets history table */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#7a8299", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
              Sets
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {Array.from({ length: currentEx.target.sets }).map((_, i) => {
                const log     = setLogs[currentExIdx][i];
                const lastSet = currentEx.lastSession.sets[i];
                const isActive = i === activeSetIdx && !log;
                const isDone   = !!log;
                return (
                  <div
                    key={i}
                    onClick={() => !isDone && setActiveSetIdx(i)}
                    style={{
                      display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr 56px",
                      gap: 8, alignItems: "center", padding: "10px 12px",
                      background: isActive ? "rgba(162,155,254,0.1)" : isDone ? "rgba(78,205,196,0.05)" : "#0d1117",
                      border: `1px solid ${isActive ? "#a29bfe" : isDone ? "#4ecdc430" : "#1e2640"}`,
                      borderRadius: 10, cursor: !isDone ? "pointer" : "default",
                    }}
                  >
                    <div style={{ fontFamily: syne, fontWeight: 700, color: isActive ? "#a29bfe" : isDone ? "#4ecdc4" : "#7a8299" }}>
                      {isDone ? "✓" : `#${i + 1}`}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#7a8299" }}>Reps</div>
                      <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: isDone ? "#4ecdc4" : "#c0c8e0" }}>
                        {log ? log.reps : "—"}{" "}
                        <span style={{ fontSize: 9, color: "#4a5568" }}>was {lastSet?.reps}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#7a8299" }}>Weight</div>
                      <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: isDone ? "#4ecdc4" : "#c0c8e0" }}>
                        {log ? `${log.weight}lb` : "—"}{" "}
                        <span style={{ fontSize: 9, color: "#4a5568" }}>was {lastSet?.weight}</span>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#7a8299" }}>RPE</div>
                      <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: isDone ? (log!.rpe >= 9 ? "#fd9644" : "#4ecdc4") : "#c0c8e0" }}>
                        {log ? log.rpe : "—"}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {isDone && lastSet && log!.weight * log!.reps > lastSet.weight * lastSet.reps && (
                        <span style={{ fontSize: 10, color: "#4ecdc4", fontWeight: 700 }}>↑ PR</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active set input form — only shown when the current set isn't logged yet */}
          {setLogs[currentExIdx][activeSetIdx] === null && (
            <div style={{ padding: 18, background: "#0d1117", border: "2px solid #a29bfe50", borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: "#a29bfe", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 14 }}>
                ▸ Logging Set {activeSetIdx + 1}
              </div>

              {/* Reps + Weight */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#7a8299", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Reps</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setInputReps((r) => Math.max(0, parseInt(r || "0") - 1).toString())} style={stepBtn}>−</button>
                    <input value={inputReps} onChange={(e) => setInputReps(e.target.value)} type="number" style={numInput} />
                    <button onClick={() => setInputReps((r) => (parseInt(r || "0") + 1).toString())} style={stepBtn}>+</button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#7a8299", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" }}>Weight (lbs)</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setInputWeight((w) => Math.max(0, parseFloat(w || "0") - 5).toString())} style={stepBtn}>−</button>
                    <input value={inputWeight} onChange={(e) => setInputWeight(e.target.value)} type="number" style={numInput} />
                    <button onClick={() => setInputWeight((w) => (parseFloat(w || "0") + 5).toString())} style={stepBtn}>+</button>
                  </div>
                </div>
              </div>

              {/* RPE */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#7a8299", letterSpacing: 1, textTransform: "uppercase" }}>RPE (Effort)</span>
                  <span style={{ fontSize: 11, color: "#9aa5c4" }}>
                    {inputRpe <= 6 ? "Easy" : inputRpe === 7 ? "3 reps left" : inputRpe === 8 ? "2 reps left" : inputRpe === 9 ? "1 rep left" : "Max effort"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  {[6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      onClick={() => setInputRpe(n)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 8,
                        border: `1px solid ${inputRpe === n ? (n >= 9 ? "#fd9644" : "#a29bfe") : "#2a3350"}`,
                        background: inputRpe === n ? (n >= 9 ? "rgba(253,150,68,0.15)" : "rgba(162,155,254,0.15)") : "#161c2d",
                        color: inputRpe === n ? (n >= 9 ? "#fd9644" : "#a29bfe") : "#7a8299",
                        fontFamily: syne, fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleLogSet}
                style={{
                  width: "100%", padding: "16px", borderRadius: 12, border: "none",
                  background: "linear-gradient(135deg, #a29bfe 0%, #4ecdc4 100%)",
                  color: "#0d1117", fontFamily: syne, fontSize: 15, fontWeight: 800,
                  letterSpacing: 1, cursor: "pointer",
                }}
              >
                ✓ LOG SET {activeSetIdx + 1} & START REST
              </button>
            </div>
          )}

          {/* Exercise complete banner */}
          {setLogs[currentExIdx].every(Boolean) && (
            <div style={{
              padding: 18,
              background: "rgba(78,205,196,0.1)", border: "1px solid #4ecdc4",
              borderRadius: 14, textAlign: "center",
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>✓</div>
              <div style={{ fontFamily: syne, fontSize: 18, fontWeight: 700, color: "#4ecdc4" }}>
                Exercise Complete!
              </div>
              {currentExIdx < EXERCISE_LIBRARY.length - 1 && (
                <button
                  onClick={() => { setCurrentExIdx(currentExIdx + 1); setActiveSetIdx(0); }}
                  style={{
                    marginTop: 12, padding: "10px 20px", borderRadius: 10, border: "none",
                    background: "#4ecdc4", color: "#0d1117",
                    fontFamily: syne, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Next: {EXERCISE_LIBRARY[currentExIdx + 1].name} →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: History & cues ────────────────────────────────────────── */}
        <div style={{ ...cardBase, alignSelf: "start" }}>
          <CardTitle accent="#ffe66d">Last · {currentEx.lastSession.date}</CardTitle>
          <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
            {currentEx.lastSession.sets.map((s, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 10px", background: "#0d1117", borderRadius: 8, fontSize: 12,
              }}>
                <span style={{ color: "#7a8299", fontWeight: 600 }}>Set {i + 1}</span>
                <span style={{ color: "#c0c8e0", fontFamily: mono }}>
                  {s.reps} × {s.weight}lb
                  <span style={{ color: s.rpe >= 9 ? "#fd9644" : "#9aa5c4", marginLeft: 6 }}>@ {s.rpe}</span>
                </span>
              </div>
            ))}
          </div>
          <CardTitle accent="#fd9644">Form Cues</CardTitle>
          <div style={{ display: "grid", gap: 8 }}>
            {currentEx.cues.map((cue, i) => (
              <div key={i} style={{
                padding: "8px 10px", background: "#0d1117",
                borderLeft: "2px solid #fd9644", borderRadius: 6,
                fontSize: 12, color: "#c0c8e0",
              }}>
                {cue}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating rest timer ──────────────────────────────────────────────── */}
      {restRemaining > 0 && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #1a1b3a 0%, #1a2035 100%)",
          border: `2px solid ${restRemaining <= 10 ? "#fd9644" : "#a29bfe"}`,
          borderRadius: 20, padding: "16px 24px", zIndex: 50, minWidth: 320,
          boxShadow: `0 8px 32px ${restRemaining <= 10 ? "rgba(253,150,68,0.3)" : "rgba(162,155,254,0.3)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#7a8299", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
              ⏱ Rest Timer
            </div>
            <div style={{ fontSize: 11, color: "#7a8299" }}>
              Next: Set {activeSetIdx + 1}
            </div>
          </div>
          <div style={{
            fontFamily: mono, fontSize: 42, fontWeight: 700,
            color: restRemaining <= 10 ? "#fd9644" : "#a29bfe",
            textAlign: "center", lineHeight: 1, marginBottom: 8,
          }}>
            {formatTime(restRemaining)}
          </div>
          <div style={{ width: "100%", height: 4, background: "#0d1117", borderRadius: 2, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              width: `${(restRemaining / restTotal) * 100}%`, height: "100%",
              background: restRemaining <= 10 ? "#fd9644" : "#a29bfe",
              transition: "width 1s linear",
            }} />
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
            {[15, 30].map((s) => (
              <button
                key={s}
                onClick={() => setRestRemaining((r) => r + s)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2a3350", background: "transparent", color: "#9aa5c4", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
              >
                +{s}s
              </button>
            ))}
            <button
              onClick={() => setRestRemaining(0)}
              style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#4ecdc4", color: "#0d1117", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: syne }}
            >
              Skip →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
