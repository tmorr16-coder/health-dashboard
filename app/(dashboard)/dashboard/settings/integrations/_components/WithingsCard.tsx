"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { disconnectWithings, triggerSync } from "../actions";

interface Props {
  connected: boolean;
  connectedAt: string | null;
  lastSyncAt: string | null;
  successMessage: string | null;
}

function relativeTime(isoTs: string): string {
  const mins = Math.floor((Date.now() - new Date(isoTs).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function WithingsCard({ connected, connectedAt, lastSyncAt, successMessage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  function handleSync() {
    setSyncMsg(null);
    setSyncErr(null);
    startTransition(async () => {
      const result = await triggerSync();
      if (result.error) {
        setSyncErr(result.error);
      } else {
        setSyncMsg(`Synced — ${result.inserted} measurement${result.inserted === 1 ? "" : "s"} added`);
        router.refresh();
      }
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectWithings();
      if (result.error) setSyncErr(result.error);
      else router.refresh();
    });
  }

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
          borderBottom: connected ? "1px solid var(--color-line)" : undefined,
        }}
      >
        <div style={{ fontSize: 24, lineHeight: 1 }}>⚖️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>
            Withings
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>
            Weight · body composition · blood pressure · SpO₂
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
            background: connected ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
            color: connected ? "var(--color-moss)" : "var(--color-ink-4)",
            border: `1px solid ${connected ? "var(--color-moss)" : "var(--color-line)"}`,
            whiteSpace: "nowrap",
          }}
        >
          {connected ? "Connected" : "Not connected"}
        </div>
      </div>

      {/* Meta + toasts */}
      {connected && (connectedAt || lastSyncAt || successMessage || syncMsg || syncErr) && (
        <div style={{ padding: "10px 16px 0" }}>
          {(connectedAt || lastSyncAt) && (
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "var(--color-ink-3)",
                marginBottom: 10,
                flexWrap: "wrap",
              }}
            >
              {connectedAt && <span>Connected {relativeTime(connectedAt)}</span>}
              {lastSyncAt && (
                <span style={{ color: "var(--color-moss)" }}>
                  Last data {relativeTime(lastSyncAt)}
                </span>
              )}
            </div>
          )}
          {(successMessage || syncMsg) && (
            <div
              style={{
                background: "var(--color-moss-soft)",
                border: "1px solid var(--color-moss)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "var(--color-moss)",
                marginBottom: 10,
              }}
            >
              ✓ {successMessage ?? syncMsg}
            </div>
          )}
          {syncErr && (
            <div
              style={{
                background: "var(--color-accent-soft)",
                border: "1px solid var(--color-accent)",
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                color: "var(--color-accent)",
                marginBottom: 10,
              }}
            >
              {syncErr}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {!connected ? (
          <a
            href="/api/withings/connect"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: 10,
              background: "var(--color-ink)",
              color: "var(--color-bg)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              opacity: isPending ? 0.5 : 1,
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
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: isPending ? "var(--color-bg-sunk)" : "var(--color-ink)",
                color: isPending ? "var(--color-ink-4)" : "var(--color-bg)",
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? "wait" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {isPending ? "Syncing…" : "Sync Now"}
            </button>
            <button
              onClick={handleDisconnect}
              disabled={isPending}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid var(--color-line-2)",
                background: "transparent",
                color: "var(--color-accent)",
                fontSize: 13,
                fontWeight: 500,
                cursor: isPending ? "wait" : "pointer",
                fontFamily: "inherit",
                opacity: isPending ? 0.5 : 1,
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
