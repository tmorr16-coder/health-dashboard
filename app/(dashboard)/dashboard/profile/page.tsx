"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  name: string;
  age: string;
  fitnessGoal: string;
  activityLevel: string;
  dietary: string[];
  currentWeightLbs: string;
  targetWeightLbs: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  age: "",
  fitnessGoal: "",
  activityLevel: "",
  dietary: [],
  currentWeightLbs: "",
  targetWeightLbs: "",
};

const STORAGE_KEY = "health-dashboard-profile";

const FITNESS_GOALS = [
  { value: "lose_weight",    label: "Lose weight" },
  { value: "maintain",       label: "Maintain weight" },
  { value: "build_muscle",   label: "Build muscle" },
  { value: "endurance",      label: "Improve endurance" },
  { value: "general_health", label: "General health" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary",  label: "Sedentary",  sub: "Desk job, little exercise" },
  { value: "light",      label: "Light",      sub: "1–3 workouts/week" },
  { value: "moderate",   label: "Moderate",   sub: "3–5 workouts/week" },
  { value: "active",     label: "Active",     sub: "6–7 workouts/week" },
];

const DIETARY_OPTIONS = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Gluten-free",
  "Dairy-free",
  "Intermittent fasting",
  "High protein",
  "Low carb",
];

const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-ink-3)",
  marginBottom: 6,
};

const fieldInput: React.CSSProperties = {
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
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
  }, []);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function toggleDietary(option: string) {
    setProfile((p) => {
      const next = p.dietary.includes(option)
        ? p.dietary.filter((d) => d !== option)
        : [...p.dietary, option];
      return { ...p, dietary: next };
    });
    setSaved(false);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // ignore
    }
  }

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
        Profile
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: "var(--color-ink)",
          marginBottom: 24,
        }}
      >
        Your
        <br />
        <span style={{ color: "var(--color-accent)" }}>preferences.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Basic info */}
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: "16px",
          }}
        >
          <div style={{ ...fieldLabel, marginBottom: 14 }}>About you</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={fieldLabel}>Name</div>
              <input
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Terry"
                style={fieldInput}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={fieldLabel}>Age</div>
                <input
                  value={profile.age}
                  onChange={(e) => update("age", e.target.value)}
                  placeholder="35"
                  type="number"
                  min="10"
                  max="120"
                  style={fieldInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Activity level</div>
                <select
                  value={profile.activityLevel}
                  onChange={(e) => update("activityLevel", e.target.value)}
                  style={fieldInput}
                >
                  <option value="">Select…</option>
                  {ACTIVITY_LEVELS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={fieldLabel}>Current weight (lbs)</div>
                <input
                  value={profile.currentWeightLbs}
                  onChange={(e) => update("currentWeightLbs", e.target.value)}
                  placeholder="185"
                  type="number"
                  style={fieldInput}
                />
              </div>
              <div>
                <div style={fieldLabel}>Target weight (lbs)</div>
                <input
                  value={profile.targetWeightLbs}
                  onChange={(e) => update("targetWeightLbs", e.target.value)}
                  placeholder="170"
                  type="number"
                  style={fieldInput}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fitness goal */}
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: "16px",
          }}
        >
          <div style={{ ...fieldLabel, marginBottom: 12 }}>Fitness goal</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FITNESS_GOALS.map((g) => {
              const selected = profile.fitnessGoal === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => update("fitnessGoal", selected ? "" : g.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    border: `1px solid ${selected ? "var(--color-accent)" : "var(--color-line)"}`,
                    background: selected ? "var(--color-accent-soft)" : "var(--color-bg-sunk)",
                    color: selected ? "var(--color-accent)" : "var(--color-ink-2)",
                    fontSize: 14,
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    transition: "all 120ms",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      border: `2px solid ${selected ? "var(--color-accent)" : "var(--color-line-2)"}`,
                      background: selected ? "var(--color-accent)" : "transparent",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selected && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                  </div>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dietary preferences */}
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: "16px",
          }}
        >
          <div style={{ ...fieldLabel, marginBottom: 12 }}>Dietary preferences</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DIETARY_OPTIONS.map((opt) => {
              const selected = profile.dietary.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleDietary(opt)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: `1px solid ${selected ? "var(--color-moss)" : "var(--color-line)"}`,
                    background: selected ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
                    color: selected ? "var(--color-moss)" : "var(--color-ink-3)",
                    fontSize: 13,
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 120ms",
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={save}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 12,
            border: "none",
            background: saved ? "var(--color-moss)" : "var(--color-ink)",
            color: "var(--color-bg)",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "background 200ms",
            marginBottom: 8,
          }}
        >
          {saved ? "Saved ✓" : "Save profile"}
        </button>

      </div>
    </div>
  );
}
