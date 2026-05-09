"use client";

import { useState, useTransition, useEffect } from "react";
import { addMedication, updateMedication, removeMedication } from "../actions";

export interface Med {
  id: string;
  name: string;
  dose: string;
  schedule: string;
}

const COMMON_MEDS = [
  { name: "Vitamin D3",   dose: "5000 IU", schedule: "Daily · AM" },
  { name: "Magnesium",    dose: "400 mg",  schedule: "Daily · PM" },
  { name: "Omega-3",      dose: "2 g",     schedule: "Daily · AM" },
  { name: "Creatine",     dose: "5 g",     schedule: "Daily · AM" },
  { name: "Multivitamin", dose: "1 tab",   schedule: "Daily · AM" },
  { name: "Zinc",         dose: "15 mg",   schedule: "Daily · PM" },
  { name: "Probiotic",    dose: "1 cap",   schedule: "Daily · AM" },
  { name: "GLP-1",        dose: "5 mg",    schedule: "Weekly · Tue" },
];

const SCHEDULES = [
  "Daily · AM",
  "Daily · PM",
  "Twice daily",
  "Weekly · Mon",
  "Weekly · Tue",
  "Weekly · Wed",
  "Weekly · Thu",
  "Weekly · Fri",
  "Weekly · Sat",
  "Weekly · Sun",
  "As needed",
];

const ZEPBOUND_DOSES = [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20];
const INJECTION_SITES = ["L Abdomen", "R Abdomen", "L Thigh", "R Thigh", "L Upper Arm", "R Upper Arm"];
const ZEPBOUND_KEY = "zepbound-tracker";
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ZepboundLog { date: string; dose: number; site: string }
interface ZepboundData {
  dose: number;
  injectionDay: string;
  siteIndex: number;
  logs: ZepboundLog[];
}

function ZepboundCard() {
  const [data, setData] = useState<ZepboundData | null>(null);
  const [editingDose, setEditingDose] = useState(false);
  const [editingDay, setEditingDay] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ZEPBOUND_KEY);
      if (raw) {
        setData(JSON.parse(raw));
      } else {
        const initial: ZepboundData = { dose: 2.5, injectionDay: "Tuesday", siteIndex: 0, logs: [] };
        localStorage.setItem(ZEPBOUND_KEY, JSON.stringify(initial));
        setData(initial);
      }
    } catch { /* ignore */ }
  }, []);

  function save(next: ZepboundData) {
    setData(next);
    try { localStorage.setItem(ZEPBOUND_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  function logDose() {
    if (!data) return;
    const today = new Date().toLocaleDateString("sv");
    const alreadyToday = data.logs[data.logs.length - 1]?.date === today;
    if (alreadyToday) return;
    const site = INJECTION_SITES[data.siteIndex];
    const nextSiteIndex = (data.siteIndex + 1) % INJECTION_SITES.length;
    save({ ...data, siteIndex: nextSiteIndex, logs: [...data.logs.slice(-11), { date: today, dose: data.dose, site }] });
  }

  function nextInjectionDays(): string {
    if (!data) return "—";
    const todayIdx = new Date().getDay();
    const targetIdx = DAYS.indexOf(data.injectionDay);
    const diff = ((targetIdx - todayIdx) + 7) % 7;
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    return `In ${diff} days`;
  }

  if (!data) return null;

  const today = new Date().toLocaleDateString("sv");
  const loggedToday = data.logs[data.logs.length - 1]?.date === today;
  const nextSite = INJECTION_SITES[data.siteIndex];
  const recentLogs = [...data.logs].reverse().slice(0, 4);

  return (
    <div
      style={{
        background: "var(--color-bg-raised)",
        border: "1px solid var(--color-line)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--color-line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontSize: 10, fontWeight: 500, letterSpacing: "0.14em",
                textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 4,
              }}
            >
              GLP-1 · Zepbound
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 28,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--color-ink)",
                  lineHeight: 1,
                }}
              >
                {data.dose} mg
              </div>
              <div style={{ fontSize: 12, color: "var(--color-ink-4)" }}>
                {data.injectionDay}s
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "var(--color-ink-4)", marginBottom: 2 }}>Next dose</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: loggedToday ? "var(--color-moss)" : "var(--color-ink)" }}>
              {loggedToday ? "✓ Logged" : nextInjectionDays()}
            </div>
          </div>
        </div>
      </div>

      {/* Dose escalation */}
      {editingDose && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-line)" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 8 }}>
            Current dose
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {ZEPBOUND_DOSES.map((d) => (
              <button
                key={d}
                onClick={() => { save({ ...data, dose: d }); setEditingDose(false); }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: `1px solid ${data.dose === d ? "var(--color-accent)" : "var(--color-line)"}`,
                  background: data.dose === d ? "var(--color-accent-soft)" : "var(--color-bg-sunk)",
                  color: data.dose === d ? "var(--color-accent)" : "var(--color-ink-2)",
                  fontSize: 13,
                  fontWeight: data.dose === d ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {d} mg
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Injection day picker */}
      {editingDay && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-line)" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 8 }}>
            Injection day
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DAYS.map((d) => (
              <button
                key={d}
                onClick={() => { save({ ...data, injectionDay: d }); setEditingDay(false); }}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: `1px solid ${data.injectionDay === d ? "var(--color-slate)" : "var(--color-line)"}`,
                  background: data.injectionDay === d ? "var(--color-slate-soft)" : "var(--color-bg-sunk)",
                  color: data.injectionDay === d ? "var(--color-slate)" : "var(--color-ink-2)",
                  fontSize: 13,
                  fontWeight: data.injectionDay === d ? 600 : 400,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Next injection site + log action */}
      <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "var(--color-ink-4)", marginBottom: 3 }}>Next injection site</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>{nextSite}</div>
          <div style={{ fontSize: 10, color: "var(--color-ink-4)", marginTop: 2 }}>
            Rotating: {INJECTION_SITES.join(" → ")}
          </div>
        </div>
        <button
          onClick={logDose}
          disabled={loggedToday}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: loggedToday ? "var(--color-bg-sunk)" : "var(--color-moss)",
            color: loggedToday ? "var(--color-ink-4)" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: loggedToday ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          {loggedToday ? "✓ Done" : "Log Dose"}
        </button>
      </div>

      {/* Config buttons */}
      <div style={{ padding: "0 16px 12px", display: "flex", gap: 8 }}>
        <button
          onClick={() => { setEditingDose((v) => !v); setEditingDay(false); }}
          style={{
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--color-line)",
            background: editingDose ? "var(--color-ink)" : "var(--color-bg-sunk)",
            color: editingDose ? "var(--color-bg)" : "var(--color-ink-3)",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Change dose
        </button>
        <button
          onClick={() => { setEditingDay((v) => !v); setEditingDose(false); }}
          style={{
            padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--color-line)",
            background: editingDay ? "var(--color-ink)" : "var(--color-bg-sunk)",
            color: editingDay ? "var(--color-bg)" : "var(--color-ink-3)",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Change day
        </button>
      </div>

      {/* Recent log */}
      {recentLogs.length > 0 && (
        <div style={{ borderTop: "1px solid var(--color-line)", padding: "12px 16px" }}>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-3)", marginBottom: 8 }}>
            Recent doses
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {recentLogs.map((log, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "var(--color-ink-3)" }}>
                  {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  <span style={{ marginLeft: 8, color: "var(--color-ink-4)" }}>{log.site}</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-ink)" }}>{log.dose} mg</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--color-ink-3)",
  marginBottom: 5,
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  border: "1px solid var(--color-line)",
  background: "var(--color-bg-sunk)",
  color: "var(--color-ink)",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

// ── Shared sheet shell ─────────────────────────────────────────
function Sheet({ onClose, title, subtitle, children }: {
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(22,20,15,0.45)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 60,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          background: "var(--color-bg)",
          borderRadius: "20px 20px 0 0",
          padding: "0 18px 32px",
          maxHeight: "85vh",
          overflowY: "auto",
          animation: "slideUp 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 36, height: 4, background: "var(--color-line-2)", borderRadius: 2 }} />
        </div>
        <div style={fieldLabel}>{title}</div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 26,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--color-ink)",
            marginBottom: 20,
          }}
        >
          {subtitle}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Add sheet ──────────────────────────────────────────────────
function AddSheet({ onAdd, onClose }: {
  onAdd: (m: Omit<Med, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [schedule, setSchedule] = useState("Daily · AM");

  const valid = name.trim().length > 0 && dose.trim().length > 0;

  const pick = (preset: (typeof COMMON_MEDS)[0]) => {
    setName(preset.name);
    setDose(preset.dose);
    setSchedule(preset.schedule);
  };

  return (
    <Sheet onClose={onClose} title="Add medication" subtitle="What are you taking?">
      <div style={{ ...fieldLabel, marginBottom: 8 }}>Common</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {COMMON_MEDS.map((m) => (
          <button
            key={m.name}
            onClick={() => pick(m)}
            style={{
              background: name === m.name ? "var(--color-ink)" : "var(--color-bg-sunk)",
              color: name === m.name ? "var(--color-bg)" : "var(--color-ink-2)",
              border: "none",
              borderRadius: 8,
              padding: "7px 11px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "background 120ms, color 120ms",
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={fieldLabel}>Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vitamin D3" style={fieldInput} />
        </div>
        <div>
          <div style={fieldLabel}>Dose</div>
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="5000 IU" style={fieldInput} />
        </div>
        <div>
          <div style={fieldLabel}>Schedule</div>
          <select value={schedule} onChange={(e) => setSchedule(e.target.value)} style={fieldInput}>
            {SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <button
        disabled={!valid}
        onClick={() => valid && onAdd({ name: name.trim(), dose: dose.trim(), schedule })}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: valid ? "var(--color-ink)" : "var(--color-bg-sunk)",
          color: valid ? "var(--color-bg)" : "var(--color-ink-3)",
          fontSize: 15,
          fontWeight: 600,
          cursor: valid ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          transition: "background 120ms",
        }}
      >
        Add to my medications
      </button>
    </Sheet>
  );
}

// ── Edit sheet ─────────────────────────────────────────────────
function EditSheet({ med, onSave, onClose }: {
  med: Med;
  onSave: (id: string, data: Omit<Med, "id">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(med.name);
  const [dose, setDose] = useState(med.dose);
  const [schedule, setSchedule] = useState(med.schedule);

  const valid = name.trim().length > 0 && dose.trim().length > 0;
  const changed = name.trim() !== med.name || dose.trim() !== med.dose || schedule !== med.schedule;

  return (
    <Sheet onClose={onClose} title="Edit medication" subtitle="Update details">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={fieldLabel}>Name</div>
          <input value={name} onChange={(e) => setName(e.target.value)} style={fieldInput} />
        </div>
        <div>
          <div style={fieldLabel}>Dose</div>
          <input value={dose} onChange={(e) => setDose(e.target.value)} style={fieldInput} />
        </div>
        <div>
          <div style={fieldLabel}>Schedule</div>
          <select value={schedule} onChange={(e) => setSchedule(e.target.value)} style={fieldInput}>
            {SCHEDULES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <button
        disabled={!valid || !changed}
        onClick={() => valid && changed && onSave(med.id, { name: name.trim(), dose: dose.trim(), schedule })}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 12,
          border: "none",
          background: valid && changed ? "var(--color-ink)" : "var(--color-bg-sunk)",
          color: valid && changed ? "var(--color-bg)" : "var(--color-ink-3)",
          fontSize: 15,
          fontWeight: 600,
          cursor: valid && changed ? "pointer" : "not-allowed",
          fontFamily: "inherit",
          transition: "background 120ms",
        }}
      >
        Save changes
      </button>
    </Sheet>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function MedicationsClient({ initialMeds }: { initialMeds: Med[] }) {
  const [meds, setMeds] = useState<Med[]>(initialMeds);
  const [taken, setTaken] = useState<Record<string, boolean>>({});
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Med | null>(null);
  const [, startTransition] = useTransition();

  const handleAdd = (data: Omit<Med, "id">) => {
    const tempId = `temp-${Date.now()}`;
    setMeds((prev) => [...prev, { id: tempId, ...data }]);
    setShowAdd(false);
    startTransition(async () => {
      const result = await addMedication(data);
      if (result.id) {
        setMeds((prev) => prev.map((m) => (m.id === tempId ? { ...m, id: result.id! } : m)));
      } else {
        setMeds((prev) => prev.filter((m) => m.id !== tempId));
      }
    });
  };

  const handleUpdate = (id: string, data: Omit<Med, "id">) => {
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
    setEditTarget(null);
    startTransition(async () => {
      const result = await updateMedication(id, data);
      if (result.error) {
        setMeds((prev) => prev.map((m) => (m.id === id ? meds.find((o) => o.id === id)! : m)));
      }
    });
  };

  const handleRemove = (id: string) => {
    setMeds((prev) => prev.filter((m) => m.id !== id));
    startTransition(async () => {
      await removeMedication(id);
    });
  };

  return (
    <div>
      <ZepboundCard />

      <div
        style={{
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-line)",
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        {/* Tile header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px 10px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-ink-3)",
            }}
          >
            Medications
          </span>
          <button
            onClick={() => setEditMode((e) => !e)}
            style={{
              background: "none",
              border: "none",
              color: editMode ? "var(--color-accent)" : "var(--color-ink-3)",
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: 0,
            }}
          >
            {editMode ? "Done" : "Edit"}
          </button>
        </div>

        {meds.length === 0 && !editMode && (
          <div
            style={{
              padding: "16px",
              borderTop: "1px solid var(--color-line)",
              fontSize: 13,
              color: "var(--color-ink-4)",
              textAlign: "center",
            }}
          >
            No medications yet
          </div>
        )}

        {meds.map((m) => {
          const isTaken = !!taken[m.id];
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 16px",
                borderTop: "1px solid var(--color-line)",
              }}
            >
              {editMode ? (
                <button
                  onClick={() => handleRemove(m.id)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: "var(--color-accent)",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 18,
                    lineHeight: 1,
                    fontWeight: 300,
                    fontFamily: "inherit",
                  }}
                >
                  −
                </button>
              ) : (
                <button
                  onClick={() => setTaken((t) => ({ ...t, [m.id]: !t[m.id] }))}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: isTaken ? "var(--color-moss)" : "transparent",
                    border: isTaken ? "none" : "1.5px solid var(--color-line-2)",
                    cursor: "pointer",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit",
                    transition: "background 120ms",
                  }}
                >
                  {isTaken && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1 }}>✓</span>}
                </button>
              )}

              {/* Row body — tappable in edit mode to open edit sheet */}
              <div
                style={{ flex: 1, minWidth: 0, cursor: editMode ? "pointer" : "default" }}
                onClick={() => editMode && setEditTarget(m)}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink)" }}>
                    {m.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)" }}>
                    {m.dose}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>
                  {m.schedule}
                </div>
              </div>

              {editMode && (
                <button
                  onClick={() => setEditTarget(m)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-ink-3)",
                    fontSize: 16,
                    cursor: "pointer",
                    padding: "0 4px",
                    fontFamily: "inherit",
                    flexShrink: 0,
                  }}
                >
                  ›
                </button>
              )}
            </div>
          );
        })}

        <button
          onClick={() => { setEditMode(false); setShowAdd(true); }}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "transparent",
            border: "none",
            borderTop: "1px solid var(--color-line)",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: "var(--color-bg-sunk)",
              border: "1.5px dashed var(--color-line-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: 18,
              color: "var(--color-ink-3)",
              lineHeight: 1,
            }}
          >
            +
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-ink-2)" }}>
            Add medication
          </span>
        </button>
      </div>

      {showAdd && <AddSheet onAdd={handleAdd} onClose={() => setShowAdd(false)} />}
      {editTarget && (
        <EditSheet
          med={editTarget}
          onSave={handleUpdate}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}
