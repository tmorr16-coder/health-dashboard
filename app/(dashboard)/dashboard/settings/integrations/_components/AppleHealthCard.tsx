"use client";

import { useState } from "react";

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

export default function AppleHealthCard({ configured, lastSyncAt, metricsCount, workoutsCount, webhookUrl }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const secret = process.env.NEXT_PUBLIC_APPLE_HEALTH_SECRET_HINT ?? "";

  return (
    <div style={{ background: "var(--color-bg-raised)", border: "1px solid var(--color-line)", borderRadius: 14, overflow: "hidden" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid var(--color-line)" }}>
        <div style={{ fontSize: 24, lineHeight: 1 }}>⌚</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>Apple Watch</div>
          <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>Steps · workouts · heart rate · activity</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
          padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
          background: configured ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
          color: configured ? "var(--color-moss)" : "var(--color-ink-4)",
          border: `1px solid ${configured ? "var(--color-moss)" : "var(--color-line)"}`,
        }}>
          {configured ? "Connected" : "Not connected"}
        </div>
      </div>

      {/* Stats — only when data exists */}
      {configured && (metricsCount > 0 || workoutsCount > 0) && (
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--color-line)" }}>
          {[
            { label: "Metrics",  value: metricsCount.toLocaleString() },
            { label: "Workouts", value: workoutsCount.toLocaleString() },
            { label: "Last sync", value: lastSyncAt ? relativeTime(lastSyncAt) : "Never" },
          ].map(({ label, value }, i, arr) => (
            <div key={label} style={{ flex: 1, padding: "12px 14px", borderRight: i < arr.length - 1 ? "1px solid var(--color-line)" : undefined }}>
              <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)", fontFamily: (label === "Metrics" || label === "Workouts") ? "var(--font-mono)" : "inherit" }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup instructions */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.6 }}>
          {configured
            ? "Data syncs automatically via the Health Auto Export app on your iPhone."
            : "Install Health Auto Export on your iPhone and point it at your personal URL below."}
        </div>

        {/* Steps */}
        {!configured && (
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--color-ink-3)", lineHeight: 1.8, display: "flex", flexDirection: "column", gap: 2 }}>
            <li>Install <span style={{ color: "var(--color-ink-2)", fontWeight: 500 }}>Health Auto Export</span> from the App Store.</li>
            <li>Open the app → Automations → REST API → add a new endpoint.</li>
            <li>Paste your personal URL below as the endpoint URL.</li>
            <li>Set the <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>api-key</span> header to the shared secret (provided by your admin).</li>
          </ol>
        )}

        {/* Personal webhook URL */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 5 }}>
            Your personal webhook URL
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
            <div style={{
              flex: 1, fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--color-ink-2)", background: "var(--color-bg-sunk)",
              borderRadius: 8, padding: "10px 12px", wordBreak: "break-all", lineHeight: 1.5,
              border: "1px solid var(--color-line)",
            }}>
              {webhookUrl}
            </div>
            <button onClick={handleCopy} style={{
              padding: "0 14px", borderRadius: 8, border: "1px solid var(--color-line)",
              background: copied ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
              color: copied ? "var(--color-moss)" : "var(--color-ink-3)",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap", flexShrink: 0, transition: "all 150ms",
            }}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
