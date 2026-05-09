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
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OuraCard({ tokenConfigured, lastSyncAt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);

  function handleSync() {
    setSyncMsg(null);
    setSyncErr(null);
    startTransition(async () => {
      const result = await triggerOuraSync();
      if (result.error) {
        setSyncErr(result.error);
      } else {
        setSyncMsg(`Synced — ${result.inserted} metric${result.inserted === 1 ? "" : "s"} added`);
        router.refresh();
      }
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
          borderBottom: tokenConfigured ? "1px solid var(--color-line)" : undefined,
        }}
      >
        <div style={{ fontSize: 24, lineHeight: 1 }}>💍</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>
            Oura Ring
          </div>
          <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>
            Sleep · readiness · activity · HRV
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
            background: tokenConfigured ? "var(--color-moss-soft)" : "var(--color-bg-sunk)",
            color: tokenConfigured ? "var(--color-moss)" : "var(--color-ink-4)",
            border: `1px solid ${tokenConfigured ? "var(--color-moss)" : "var(--color-line)"}`,
            whiteSpace: "nowrap",
          }}
        >
          {tokenConfigured ? "Connected" : "Not connected"}
        </div>
      </div>

      {/* Meta + toasts */}
      {tokenConfigured && (lastSyncAt || syncMsg || syncErr) && (
        <div style={{ padding: "10px 16px 0" }}>
          {lastSyncAt && !syncMsg && (
            <div style={{ fontSize: 12, color: "var(--color-moss)", marginBottom: 10 }}>
              Last data {relativeTime(lastSyncAt)}
            </div>
          )}
          {syncMsg && (
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
              ✓ {syncMsg}
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
      <div style={{ padding: "12px 16px" }}>
        {tokenConfigured ? (
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
        ) : (
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
            Add{" "}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-2)" }}>
              OURA_ACCESS_TOKEN
            </span>{" "}
            to your environment variables to enable sync. Generate a token at{" "}
            <span style={{ color: "var(--color-accent)" }}>
              cloud.ouraring.com → Personal Access Tokens
            </span>
            .
          </div>
        )}
      </div>
    </div>
  );
}
