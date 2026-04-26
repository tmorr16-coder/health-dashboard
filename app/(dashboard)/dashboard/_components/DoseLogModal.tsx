"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { logDose } from "../actions";

const INJECTION_SITES = [
  "Left abdomen",
  "Right abdomen",
  "Left thigh",
  "Right thigh",
  "Left arm",
  "Right arm",
];

interface Props {
  open: boolean;
  onClose: () => void;
  recommendedSite: string;
  defaultDoseMg?: number;
  weekNumber: number;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #2a3350",
  background: "#0d1117",
  color: "#e8ecf8",
  fontSize: 13,
  outline: "none",
  colorScheme: "dark",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#7a8299",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: 1,
};

export default function DoseLogModal({
  open,
  onClose,
  recommendedSite,
  defaultDoseMg = 5,
  weekNumber,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const todayStr = new Date().toLocaleDateString("sv"); // "YYYY-MM-DD" in local TZ

  const [date, setDate] = useState(todayStr);
  const [doseMg, setDoseMg] = useState(String(defaultDoseMg));
  const [site, setSite] = useState(recommendedSite);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const result = await logDose({
        date,
        dose_mg: parseFloat(doseMg) || defaultDoseMg,
        injection_site: site,
        notes,
      });
      if (result?.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 20,
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "linear-gradient(135deg, #161c2d 0%, #1a2035 100%)",
          border: "1px solid #5b6ee150",
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 440,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💉</div>
          <div style={{ fontFamily: "var(--font-syne)", fontSize: 22, fontWeight: 800 }}>
            Log Zepbound Dose
          </div>
          <div style={{ fontSize: 13, color: "#7a8299", marginTop: 4 }}>
            Week {weekNumber} · {defaultDoseMg} mg
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Date</div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Dose amount */}
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Dose (mg)</div>
          <input
            type="number"
            value={doseMg}
            onChange={(e) => setDoseMg(e.target.value)}
            min="0.5"
            max="15"
            step="0.5"
            style={inputStyle}
          />
        </div>

        {/* Injection site */}
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Injection Site</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {INJECTION_SITES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSite(s)}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: `1px solid ${site === s ? "#5b6ee1" : "#2a3350"}`,
                  background: site === s ? "rgba(91,110,225,0.15)" : "#0d1117",
                  color: site === s ? "#a29bfe" : "#9aa5c4",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "var(--font-dm-sans)",
                }}
              >
                {s}
                {s === recommendedSite && site !== s ? " ★" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Notes (optional)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any observations, reactions, or reminders…"
            rows={2}
            style={{
              ...inputStyle,
              resize: "vertical",
              fontFamily: "var(--font-dm-sans)",
              lineHeight: 1.5,
            }}
          />
        </div>

        {error && (
          <div
            style={{ color: "#ff6b6b", fontSize: 12, marginBottom: 12, textAlign: "center" }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #2a3350",
              background: "transparent",
              color: "#9aa5c4",
              fontFamily: "var(--font-syne)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            style={{
              flex: 2,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: isPending
                ? "#2a3350"
                : "linear-gradient(135deg, #5b6ee1 0%, #a29bfe 100%)",
              color: isPending ? "#7a8299" : "#fff",
              fontFamily: "var(--font-syne)",
              fontSize: 13,
              fontWeight: 700,
              cursor: isPending ? "not-allowed" : "pointer",
            }}
          >
            {isPending ? "Saving…" : "✓ Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
