"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { disconnectWithings, triggerSync } from "../actions";

interface Props {
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  successMessage: string | null;
  errorMessage: string | null;
}

function relativeTime(isoTs: string): string {
  const mins = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WithingsCard({
  connected,
  connectedAt,
  lastSyncAt,
  successMessage,
  errorMessage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectWithings();
      if (result.error) {
        setSyncErr(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleSync() {
    setSyncMsg(null);
    setSyncErr(null);
    startTransition(async () => {
      const result = await triggerSync();
      if (result.error) {
        setSyncErr(result.error);
      } else {
        setSyncMsg(`Sync complete — ${result.inserted} measurement${result.inserted === 1 ? "" : "s"} inserted`);
        router.refresh();
      }
    });
  }

  const statusColor = connected ? "#4ecdc4" : "#4a5568";
  const statusLabel = connected ? "Connected" : "Not connected";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
        border: `1px solid ${connected ? "#4ecdc430" : "#2a3350"}`,
        borderRadius: 16,
        padding: "20px 22px",
        maxWidth: 600,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 28 }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: 16,
              fontWeight: 700,
              color: "#c0c8e0",
            }}
          >
            Withings
          </div>
          <div style={{ fontSize: 12, color: "#7a8299" }}>
            Weight, body composition, blood pressure, SpO₂
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: statusColor,
            background: `${statusColor}18`,
            padding: "3px 10px",
            borderRadius: 20,
            border: `1px solid ${statusColor}40`,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {statusLabel}
        </div>
      </div>

      {/* Meta */}
      {connected && (connectedAt || lastSyncAt) && (
        <div
          style={{
            background: "#0d1117",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#7a8299",
            display: "flex",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          {connectedAt && (
            <span>Connected {relativeTime(connectedAt)}</span>
          )}
          {lastSyncAt && (
            <span style={{ color: "#4ecdc4" }}>Last data: {relativeTime(lastSyncAt)}</span>
          )}
        </div>
      )}

      {/* Toast messages */}
      {(successMessage || syncMsg) && (
        <div
          style={{
            background: "#4ecdc420",
            border: "1px solid #4ecdc440",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            fontSize: 12,
            color: "#4ecdc4",
          }}
        >
          ✓ {successMessage ?? syncMsg}
        </div>
      )}
      {(errorMessage || syncErr) && (
        <div
          style={{
            background: "#ff767520",
            border: "1px solid #ff767540",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 12,
            fontSize: 12,
            color: "#ff7675",
          }}
        >
          ✕ {errorMessage ?? syncErr}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {!connected ? (
          <a
            href="/api/withings/connect"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)",
              color: "#0d1117",
              fontFamily: "var(--font-syne)",
              fontSize: 13,
              fontWeight: 800,
              textDecoration: "none",
              letterSpacing: 0.5,
              opacity: isPending ? 0.6 : 1,
            }}
          >
            Connect Withings
          </a>
        ) : (
          <>
            <button
              onClick={handleSync}
              disabled={isPending}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #4ecdc4 0%, #a29bfe 100%)",
                color: "#0d1117",
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                cursor: isPending ? "wait" : "pointer",
                letterSpacing: 0.5,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? "Syncing…" : "Sync Now"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                background: "transparent",
                border: "1px solid #ff767540",
                color: "#ff7675",
                fontFamily: "var(--font-syne)",
                fontSize: 13,
                fontWeight: 700,
                cursor: isPending ? "wait" : "pointer",
                letterSpacing: 0.5,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
