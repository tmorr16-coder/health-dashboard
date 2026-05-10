export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUserId } from "@/lib/auth";
import MedicationsClient, { type Med } from "./_components/MedicationsClient";

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function daysUntilNext(lastDateStr: string): number {
  const next = parseLocalDate(lastDateStr);
  next.setDate(next.getDate() + 7);
  return Math.ceil((next.getTime() - Date.now()) / 86_400_000);
}

export default async function MedicationsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const userId = await getCurrentUserId();

  const [{ data: medsData, error: medsError }, { data: latestDose }, { count: doseCount }] =
    await Promise.all([
      db.from("medications").select("id, name, dose, schedule").eq("user_id", userId).eq("active", true).order("created_at", { ascending: true }),
      db.from("doses").select("date, dose_mg").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
      db.from("doses").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

  const meds: Med[] = medsError ? [] : (medsData ?? []);

  const weekNum  = (doseCount ?? 0) + 1;
  const lastDate = (latestDose as { date: string; dose_mg: number } | null)?.date ?? null;
  const doseMg   = (latestDose as { date: string; dose_mg: number } | null)?.dose_mg ?? 5;
  const daysLeft = lastDate ? daysUntilNext(lastDate) : null;
  const daysLabel =
    daysLeft === null ? "No doses logged"
    : daysLeft > 0   ? `${daysLeft} day${daysLeft === 1 ? "" : "s"}`
    : daysLeft === 0 ? "Today"
    : "Overdue";
  const isUrgent = daysLeft !== null && daysLeft <= 1;

  return (
    <div style={{ padding: "20px 20px 0" }}>

      {/* Eyebrow */}
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
        Health
      </div>

      {/* Display title */}
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
        Your daily
        <br />
        baseline.
      </div>

      {/* ── Zepbound tracker card ─────────────────────────────────────────── */}
      <Link href="/dashboard/zepbound" style={{ textDecoration: "none", display: "block", marginBottom: 12 }}>
        <div
          style={{
            background: "var(--color-bg-raised)",
            border: "1px solid var(--color-line)",
            borderRadius: 14,
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 11,
              background: "var(--color-accent-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              flexShrink: 0,
            }}
          >
            💉
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--color-accent)",
                marginBottom: 2,
              }}
            >
              Zepbound · Tirzepatide
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                color: "var(--color-ink)",
                lineHeight: 1.2,
              }}
            >
              Week {weekNum - 1} · {doseMg} mg
            </div>
            <div style={{ fontSize: 12, color: "var(--color-ink-3)", marginTop: 2 }}>
              Next dose:{" "}
              <span style={{ color: isUrgent ? "var(--color-accent)" : "var(--color-ink-2)", fontWeight: isUrgent ? 600 : 400 }}>
                {daysLabel}
              </span>
            </div>
          </div>
          <div style={{ fontSize: 18, color: "var(--color-ink-3)", flexShrink: 0 }}>→</div>
        </div>
      </Link>

      {/* Medications list */}
      <MedicationsClient initialMeds={meds} />

    </div>
  );
}
