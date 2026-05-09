"use client";

interface Props {
  configured: boolean;
  lastSyncAt: string | null;
  metricsCount: number;
  workoutsCount: number;
  webhookUrl: string;
}

function relativeTime(isoTs: string): string {
  const mins = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AppleHealthCard({
  configured,
  lastSyncAt,
  metricsCount,
  workoutsCount,
  webhookUrl,
}: Props) {
  return (
    <div
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-line)",
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderBottom: configured ? "1px solid var(--color-line)" : undefined,
        }}
      >
        <div style={{ fontSize: 24, lineHeight: 1 }}>⌚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>
            Apple Watch
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>
            Steps · workouts · heart rate · activity
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "4px 10px",
            borderRadius: 999,
            background: configured ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
            color: configured ? "var(--color-moss)" : "var(--color-ink-4)",
            border: `1px solid ${configured ? "var(--color-moss)" : "var(--color-line)"}`,
            whiteSpace: "nowrap",
          }}
        >
          {configured ? "Connected" : "Not connected"}
        </div>
      </div>

      {/* Stats row — only when data exists */}
      {configured && (metricsCount > 0 || workoutsCount > 0) && (
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--color-line)",
          }}
        >
          {[
            { label: "Metrics", value: metricsCount.toLocaleString() },
            { label: "Workouts", value: workoutsCount.toLocaleString() },
            {
              label: "Last sync",
              value: lastSyncAt ? relativeTime(lastSyncAt) : "Never",
            },
          ].map(({ label, value }, i, arr) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRight: i < arr.length - 1 ? "1px solid var(--color-line)" : undefined,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-4)",
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--color-ink)",
                  fontFamily: label === "Metrics" || label === "Workouts" ? "var(--font-mono)" : "inherit",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      <div style={{ padding: "12px 16px" }}>
        {configured ? (
          <div
            style={{
              background: "var(--color-bg-sunk)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 12,
              color: "var(--color-ink-3)",
              lineHeight: 1.6,
            }}
          >
            Data syncs automatically via the{" "}
            <span style={{ color: "var(--color-ink-2)", fontWeight: 500 }}>
              Health Auto Export
            </span>{" "}
            app on your iPhone. Open the app and trigger a manual sync, or configure auto-export
            to push new data on a schedule.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                background: "var(--color-bg-sunk)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 12,
                color: "var(--color-ink-3)",
                lineHeight: 1.7,
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--color-ink-2)", marginBottom: 6 }}>
                Setup: 3 steps
              </div>
              <ol style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 4 }}>
                <li>
                  Install{" "}
                  <span style={{ color: "var(--color-ink-2)", fontWeight: 500 }}>
                    Health Auto Export
                  </span>{" "}
                  from the App Store on your iPhone.
                </li>
                <li>
                  Add{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-2)",
                      background: "var(--color-bg-raised)",
                      padding: "1px 5px",
                      borderRadius: 4,
                    }}
                  >
                    HEALTH_AUTO_EXPORT_SECRET
                  </span>{" "}
                  to your Vercel environment variables.
                </li>
                <li>
                  In Health Auto Export, set the REST API URL to your webhook endpoint and add the
                  secret in the{" "}
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--color-ink-2)",
                      background: "var(--color-bg-raised)",
                      padding: "1px 5px",
                      borderRadius: 4,
                    }}
                  >
                    api-key
                  </span>{" "}
                  header.
                </li>
              </ol>
            </div>

            {/* Webhook URL display */}
            <div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--color-ink-4)",
                  marginBottom: 5,
                }}
              >
                Webhook URL
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-ink-2)",
                  background: "var(--color-bg-sunk)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  wordBreak: "break-all",
                  lineHeight: 1.5,
                }}
              >
                {webhookUrl}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
