export interface WorkoutRow {
  id: string;
  timestamp: string;
  workout_type: string;
  duration_sec: number | null;
  distance_m: number | null;
  calories: number | null;
}

interface Props {
  workouts: WorkoutRow[];
}

function fmtDayLabel(isoTs: string): string {
  const d = new Date(isoTs);
  const dateStr = d.toLocaleDateString("sv"); // YYYY-MM-DD local
  const today = new Date().toLocaleDateString("sv");
  const yesterday = new Date(Date.now() - 86_400_000).toLocaleDateString("sv");
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtDuration(sec: number | null): string {
  if (sec === null) return "—";
  const m = Math.round(sec / 60);
  return `${m} min`;
}

function fmtDistance(meters: number | null): string {
  if (meters === null) return "";
  const mi = meters / 1609.344;
  return `${mi.toFixed(2)} mi`;
}

function fmtCalories(cal: number | null): string {
  if (cal === null) return "";
  return `${Math.round(cal)} kcal`;
}

function fmtWorkoutType(raw: string): string {
  // Convert camelCase / PascalCase HealthKit names to readable form
  // e.g. "TraditionalStrengthTraining" → "Traditional Strength Training"
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export default function RecentWorkoutsCard({ workouts }: Props) {
  if (workouts.length === 0) {
    return (
      <div
        style={{
          gridColumn: "1 / -1",
          background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
          border: "1px solid #2a3350",
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
            Recent Workouts
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#3a4460", textAlign: "center", padding: "16px 0" }}>
          No workouts in the last 7 days
        </div>
      </div>
    );
  }

  // Group by day label (preserving order, already sorted desc by timestamp)
  const groups: { day: string; rows: WorkoutRow[] }[] = [];
  for (const w of workouts) {
    const day = fmtDayLabel(w.timestamp);
    const last = groups[groups.length - 1];
    if (last && last.day === day) {
      last.rows.push(w);
    } else {
      groups.push({ day, rows: [w] });
    }
  }

  return (
    <div
      style={{
        gridColumn: "1 / -1",
        background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
        border: "1px solid #2a3350",
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
          Recent Workouts
        </span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#4a5568" }}>Last 7 days</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map(({ day, rows }) => (
          <div key={day}>
            <div
              style={{
                fontSize: 10,
                color: "#4a5568",
                textTransform: "uppercase",
                letterSpacing: 1.5,
                fontWeight: 700,
                marginBottom: 6,
              }}
            >
              {day}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rows.map((w) => {
                const dist = fmtDistance(w.distance_m);
                const cal = fmtCalories(w.calories);
                const meta = [fmtDuration(w.duration_sec), dist, cal]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={w.id}
                    style={{
                      background: "#0d1117",
                      borderRadius: 10,
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-syne)",
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#c0c8e0",
                        minWidth: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {fmtWorkoutType(w.workout_type)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#7a8299",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                      }}
                    >
                      {meta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
