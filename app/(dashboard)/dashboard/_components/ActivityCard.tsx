interface Props {
  steps: number | null;
  activeEnergyCal: number | null;
  distanceMiles: number | null;
  heartRateBpm: number | null;
}

const STATS = [
  {
    key: "steps" as const,
    label: "Steps",
    color: "#4ecdc4",
    icon: "👟",
    format: (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    suffix: "",
  },
  {
    key: "activeEnergyCal" as const,
    label: "Active Energy",
    color: "#ffe66d",
    icon: "🔥",
    format: (v: number) => v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
    suffix: " kcal",
  },
  {
    key: "distanceMiles" as const,
    label: "Distance",
    color: "#fd9644",
    icon: "🚶",
    format: (v: number) => v.toFixed(2),
    suffix: " mi",
  },
  {
    key: "heartRateBpm" as const,
    label: "Heart Rate",
    color: "#ff7675",
    icon: "❤️",
    format: (v: number) => Math.round(v).toString(),
    suffix: " bpm",
  },
];

export default function ActivityCard({
  steps,
  activeEnergyCal,
  distanceMiles,
  heartRateBpm,
}: Props) {
  const values: Record<string, number | null> = {
    steps,
    activeEnergyCal,
    distanceMiles,
    heartRateBpm,
  };

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
          Today&apos;s Activity
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {STATS.map(({ key, label, color, icon, format, suffix }) => {
          const raw = values[key];
          const display = raw !== null ? `${format(raw)}${suffix}` : "—";
          return (
            <div
              key={key}
              style={{
                background: "#0d1117",
                borderRadius: 10,
                padding: 12,
                borderLeft: `3px solid ${color}`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#7a8299",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {icon} {label}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: raw !== null ? 18 : 22,
                  fontWeight: 700,
                  color: raw !== null ? color : "#3a4460",
                }}
              >
                {display}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
