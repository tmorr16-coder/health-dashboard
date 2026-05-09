"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { quickLogWorkout } from "./actions";

const WORKOUT_TYPES = [
  "Strength",
  "Upper Body",
  "Lower Body",
  "Full Body",
  "Push",
  "Pull",
  "Legs",
  "Cardio",
  "Running",
  "Cycling",
  "Yoga",
  "Mobility",
  "HIIT",
  "Swimming",
  "Other",
];

const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-ink-3)",
  marginBottom: 6,
};

export default function QuickLogPage() {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [type, setType] = useState("");
  const [customType, setCustomType] = useState("");
  const [duration, setDuration] = useState("45");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const workoutLabel = type === "Other" ? customType.trim() : type;
  const valid = workoutLabel.length > 0 && parseInt(duration) > 0;

  function handleSave() {
    if (!valid) return;
    setSaving(true);
    startTransition(async () => {
      await quickLogWorkout({
        type: workoutLabel,
        durationMin: parseInt(duration),
        notes: notes.trim() || null,
      });
      router.push("/dashboard/train");
    });
  }

  return (
    <div style={{ padding: "20px 20px 0", maxWidth: 480, margin: "0 auto" }}>

      {/* Back link */}
      <Link
        href="/dashboard/train"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 13,
          color: "var(--color-ink-3)",
          textDecoration: "none",
          marginBottom: 20,
        }}
      >
        ← Train
      </Link>

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
        Quick log
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 32,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "var(--color-ink)",
          marginBottom: 24,
        }}
      >
        Log today&apos;s
        <br />
        <span style={{ color: "var(--color-accent)" }}>workout.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Workout type chips */}
        <div>
          <div style={fieldLabel}>Workout type</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {WORKOUT_TYPES.map((t) => {
              const selected = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(selected ? "" : t)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-line)"}`,
                    background: selected ? "var(--color-accent-soft)" : "var(--color-bg-raised)",
                    color: selected ? "var(--color-accent)" : "var(--color-ink-3)",
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 120ms",
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
          {type === "Other" && (
            <input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="e.g. Rock climbing"
              style={{
                marginTop: 10,
                width: "100%",
                padding: "11px 12px",
                borderRadius: 10,
                border: "1px solid var(--color-line)",
                background: "var(--color-bg-sunk)",
                color: "var(--color-ink)",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          )}
        </div>

        {/* Duration */}
        <div>
          <div style={fieldLabel}>Duration (minutes)</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setDuration((d) => String(Math.max(5, parseInt(d) - 5)))}
              style={{
                width: 44, height: 44, borderRadius: 10,
                border: "1px solid var(--color-line)",
                background: "var(--color-bg-raised)",
                color: "var(--color-ink)", fontSize: 18, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              −
            </button>
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              type="number"
              min="1"
              style={{
                flex: 1,
                height: 44,
                borderRadius: 10,
                border: "1px solid var(--color-line)",
                background: "var(--color-bg-sunk)",
                color: "var(--color-ink)",
                fontSize: 18,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                textAlign: "center",
                outline: "none",
              }}
            />
            <button
              onClick={() => setDuration((d) => String(parseInt(d) + 5))}
              style={{
                width: 44, height: 44, borderRadius: 10,
                border: "1px solid var(--color-line)",
                background: "var(--color-bg-raised)",
                color: "var(--color-ink)", fontSize: 18, cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              +
            </button>
          </div>
          {/* Quick duration presets */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {[30, 45, 60, 75, 90].map((m) => (
              <button
                key={m}
                onClick={() => setDuration(String(m))}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  borderRadius: 8,
                  border: `1px solid ${duration === String(m) ? "var(--color-accent)" : "var(--color-line)"}`,
                  background: duration === String(m) ? "var(--color-accent-soft)" : "var(--color-bg-raised)",
                  color: duration === String(m) ? "var(--color-accent)" : "var(--color-ink-3)",
                  fontSize: 12,
                  fontWeight: duration === String(m) ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 120ms",
                }}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={fieldLabel}>Notes (optional)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did it feel? Any PRs?"
            rows={3}
            style={{
              width: "100%",
              padding: "11px 12px",
              borderRadius: 10,
              border: "1px solid var(--color-line)",
              background: "var(--color-bg-sunk)",
              color: "var(--color-ink)",
              fontSize: 14,
              fontFamily: "inherit",
              outline: "none",
              resize: "none",
              lineHeight: 1.5,
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          disabled={!valid || saving}
          onClick={handleSave}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: valid && !saving ? "var(--color-ink)" : "var(--color-bg-sunk)",
            color: valid && !saving ? "var(--color-bg)" : "var(--color-ink-3)",
            fontSize: 15,
            fontWeight: 600,
            cursor: valid && !saving ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "background 120ms",
          }}
        >
          {saving ? "Saving…" : "Log workout"}
        </button>

      </div>
    </div>
  );
}
