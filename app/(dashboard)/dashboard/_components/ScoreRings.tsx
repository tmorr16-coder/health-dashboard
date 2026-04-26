"use client";

import { useState, useEffect } from "react";

interface Score {
  label: string;
  value: number;
  color: string;
}

function Ring({
  value,
  max,
  size,
  stroke,
  color,
  children,
}: {
  value: number;
  max: number;
  size: number;
  stroke: number;
  color: string;
  children: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 300);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2433" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={circ * (1 - animated)}
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)" }}
      />
      <foreignObject x={0} y={0} width={size} height={size} style={{ transform: "rotate(90deg)" }}>
        <div
          style={{
            width: size,
            height: size,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

export default function ScoreRings({ scores }: { scores: Score[] }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
      {scores.map((s) => (
        <div
          key={s.label}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
        >
          <Ring value={s.value} max={100} size={70} stroke={6} color={s.color}>
            <span
              style={{
                fontFamily: "var(--font-syne)",
                fontSize: 16,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              {s.value}
            </span>
          </Ring>
          <span
            style={{
              fontSize: 10,
              color: "#7a8299",
              fontWeight: 600,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}
