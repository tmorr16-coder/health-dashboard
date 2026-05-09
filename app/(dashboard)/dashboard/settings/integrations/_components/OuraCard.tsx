"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { triggerOuraSync } from "../actions";

interface Props {
  tokenConfigured: boolean;
  lastSyncAt: string | null;
}

function relativeTime(isoTs: string): string {
  const mins = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OuraCard({ tokenConfigured, lastSyncAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg]   = useState<string | null>(null);
  const [syncErr, setSyncErr]   = useState<string | null>(null);

  function handleSync() {
    setSyncMsg(null);
    setSyncErr(null);
    startTransition(async () => {
      const result = await triggerOuraSync();
      if (result.error) {
        setSyncErr(result.error);
      } else {
        setSyncMsg(`Sync complete — ${result.inserted} metric${result.inserted === 1 ? "" : "s"} inserted`);
        router.refresh();
      }
    });
  }

  const statusColor = tokenConfigured ? "#4ecdc4" : "#4a5568";
  const statusLabel = tokenConfigured ? "Connected" : "Not connected";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
        border: `1px solid ${tokenConfigured ? "#4ecdc430" : "#2a3350"}`,
        borderRadius: 16,
        padding: "20px 22px",
        maxWidth: 600,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 28 }}>💍</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-syne)",
              fontSize: 16,
              fontWeight: 700,
              color: "#c0c8e0",
            }}
          >
            Oura Ring
          </div>
          <div style={{ fontSize: 12, color: "#7a8299" }}>
            Sleep, readiness, activity, HRV
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

      {/* Last sync meta */}
      {tokenConfigured && lastSyncAt && (
        <div
          style={{
            background: "#0d1117",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 14,
            fontSize: 12,
            color: "#7a8299",
          }}
        >
          <span style={{ color: "#4ecdc4" }}>Last data: {relativeTime(lastSyncAt)}</span>
        </div>
      )}

      {/* Toast messages */}
      {syncMsg && (
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
          ✓ {syncMsg}
        </div>
      )}
      {syncErr && (
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
          ✕ {syncErr}
        </div>
      )}

      {/* Actions */}
      {tokenConfigured ? (
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
      ) : (
        <div
          style={{
            background: "#0d1117",
            borderRadius: 10,
            padding: "12px 14px",
            fontSize: 12,
            color: "#7a8299",
            lineHeight: 1.6,
          }}
        >
          To enable Oura Ring sync, add{" "}
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              color: "#a29bfe",
              fontSize: 11,
            }}
          >
            OURA_ACCESS_TOKEN
          </span>{" "}
          to your{" "}
          <span style={{ fontFamily: "var(--font-jetbrains-mono)", color: "#c0c8e0", fontSize: 11 }}>
            .env.local
          </span>{" "}
          and your Vercel environment variables. Generate a token at{" "}
          <span style={{ color: "#4ecdc4" }}>cloud.ouraring.com → Account → Personal Access Tokens</span>.
        </div>
      )}
    </div>
  );
}
