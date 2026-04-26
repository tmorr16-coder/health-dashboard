import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId } from "@/lib/auth";
import type { Database } from "@/lib/types/database";
import LogDoseButton from "./_components/LogDoseButton";

type DoseRow = Database["public"]["Tables"]["doses"]["Row"];

// ── constants ─────────────────────────────────────────────────────────────────

const INJECTION_SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left arm",
  "Right arm",
];

const MOCK_DOSES: DoseRow[] = [
  { id: "m1", user_id: "dev", date: "2026-04-01", dose_mg: 5, injection_site: "Left abdomen",  notes: null, created_at: "2026-04-01T07:30:00Z" },
  { id: "m2", user_id: "dev", date: "2026-04-08", dose_mg: 5, injection_site: "Right abdomen", notes: null, created_at: "2026-04-08T07:45:00Z" },
  { id: "m3", user_id: "dev", date: "2026-04-15", dose_mg: 5, injection_site: "Left thigh",    notes: null, created_at: "2026-04-15T08:00:00Z" },
  { id: "m4", user_id: "dev", date: "2026-04-22", dose_mg: 5, injection_site: "Right thigh",   notes: null, created_at: "2026-04-22T07:15:00Z" },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const target = parseLocalDate(dateStr);
  target.setDate(target.getDate() + 7);
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000);
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function ZepboundPage() {
  const supabase = await createClient();
  const userId = getCurrentUserId();

  const { data: rawDoses } = (await supabase
    .from("doses")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })) as { data: DoseRow[] | null; error: unknown };

  const doses = rawDoses && rawDoses.length > 0 ? rawDoses : MOCK_DOSES;
  const latest = doses[doses.length - 1];

  const lastSite = latest.injection_site ?? "Unknown";
  const recommendedSite = INJECTION_SITES.find((s) => s !== lastSite) ?? "Left abdomen";
  const currentDoseMg = latest.dose_mg;
  const weekNumber = doses.length + 1;

  const days = daysUntil(latest.date);
  const daysLabel = days > 0 ? `${days} days` : days === 0 ? "Today" : "Overdue";
  const daysColor = days <= 1 ? "#ff6b6b" : days <= 3 ? "#fd9644" : "#4ecdc4";

  // Placeholder body-comp stats (no weight data in DB yet)
  const totalLost = "−7.6 lbs";
  const avgPerWeek = "−1.9 lbs";

  return (
    <div style={{ fontFamily: "var(--font-dm-sans)", color: "#e8ecf8" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid #1a2035" }}>
        <Link
          href="/dashboard"
          style={{
            fontSize: 12,
            color: "#5b6ee1",
            textDecoration: "none",
            letterSpacing: 0.5,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 10,
          }}
        >
          ← Dashboard
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--font-syne)", fontSize: 26, fontWeight: 800 }}>
              💉 Zepbound Tracker
            </div>
            <div style={{ fontSize: 13, color: "#7a8299", marginTop: 3 }}>
              Week {doses.length} · {currentDoseMg} mg · tirzepatide
            </div>
          </div>
          <LogDoseButton
            recommendedSite={recommendedSite}
            defaultDoseMg={currentDoseMg}
            weekNumber={weekNumber}
          />
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "20px 24px 0",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          maxWidth: 1200,
        }}
      >
        {[
          { label: "Total Lost",    value: totalLost,              color: "#4ecdc4" },
          { label: "Avg / Week",    value: avgPerWeek,             color: "#a29bfe" },
          { label: "Current Week",  value: `Wk ${doses.length}`,  color: "#ffe66d" },
          { label: "Next Dose",     value: daysLabel,              color: daysColor },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
              border: "1px solid #2a3350",
              borderRadius: 14,
              padding: "16px 18px",
              borderTop: `3px solid ${color}`,
            }}
          >
            <div style={{ fontSize: 10, color: "#7a8299", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 700, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Dose history table ─────────────────────────────────────────────── */}
      <div style={{ padding: "20px 24px", maxWidth: 1200 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
            border: "1px solid #2a3350",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a3350", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 3, height: 16, background: "#5b6ee1", borderRadius: 2 }} />
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
              Dose History
            </span>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Week", "Date", "Dose", "Injection Site", "Notes"].map((col) => (
                  <th
                    key={col}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 10,
                      color: "#4a5568",
                      fontWeight: 600,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      borderBottom: "1px solid #1e2433",
                      fontFamily: "var(--font-dm-sans)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...doses].reverse().map((dose, i) => {
                const week = doses.length - i;
                const isLatest = i === 0;
                return (
                  <tr
                    key={dose.id}
                    style={{
                      borderBottom: "1px solid #1e2433",
                      background: isLatest ? "rgba(91,110,225,0.06)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: 8,
                          background: isLatest ? "rgba(91,110,225,0.2)" : "#0d1117",
                          color: isLatest ? "#a29bfe" : "#7a8299",
                          fontFamily: "var(--font-syne)",
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {week}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 14, color: "#c0c8e0" }}>
                      {formatDisplayDate(dose.date)}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#4ecdc4",
                          fontFamily: "var(--font-syne)",
                        }}
                      >
                        {dose.dose_mg} mg
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#9aa5c4" }}>
                      {dose.injection_site ?? "—"}
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: 13, color: "#7a8299", maxWidth: 200 }}>
                      {dose.notes ?? <span style={{ color: "#2a3350" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Next dose row */}
          <div
            style={{
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderTop: "1px solid #2a3350",
              background: "rgba(91,110,225,0.04)",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px dashed #2a3350",
                color: "#4a5568",
                fontSize: 12,
                fontFamily: "var(--font-syne)",
                fontWeight: 700,
              }}
            >
              {weekNumber}
            </span>
            <span style={{ fontSize: 13, color: "#4a5568" }}>
              Next dose · {daysLabel} ·{" "}
              <span style={{ color: "#5b6ee1" }}>Suggested: {recommendedSite}</span>
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
