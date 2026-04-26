"use client";

import { useState } from "react";
import DoseLogModal from "./DoseLogModal";

interface Props {
  recommendedSite: string;
  doseCount: number;
  nextDoseDate: string;
  defaultDoseMg: number;
}

export default function DoseReminderBanner({
  recommendedSite,
  doseCount,
  nextDoseDate,
  defaultDoseMg,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        style={{
          gridColumn: "1 / -1",
          background: "linear-gradient(135deg, #2a1f3d 0%, #1a2035 100%)",
          border: "1px solid #5b6ee180",
          borderRadius: 16,
          padding: "20px 22px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "linear-gradient(135deg, #5b6ee1 0%, #a29bfe 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                flexShrink: 0,
              }}
            >
              💉
            </div>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "#5b6ee1",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Next Zepbound Dose
              </div>
              <div
                style={{
                  fontFamily: "var(--font-syne)",
                  fontSize: 22,
                  fontWeight: 800,
                  marginTop: 2,
                }}
              >
                {nextDoseDate}{" "}
                <span style={{ color: "#7a8299", fontSize: 14, fontWeight: 400 }}>
                  · 7:30 AM
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#9aa5c4", marginTop: 2 }}>
                {defaultDoseMg} mg · Suggested site:{" "}
                <span style={{ color: "#4ecdc4" }}>{recommendedSite}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #5b6ee1 0%, #a29bfe 100%)",
              color: "#fff",
              fontFamily: "var(--font-syne)",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            ✓ Log Dose Now
          </button>
        </div>
      </div>

      <DoseLogModal
        open={showModal}
        onClose={() => setShowModal(false)}
        recommendedSite={recommendedSite}
        defaultDoseMg={defaultDoseMg}
        weekNumber={doseCount + 1}
      />
    </>
  );
}
