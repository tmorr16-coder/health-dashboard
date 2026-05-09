// Progress + Health screens + Profile
const P_M = window.MOCK;
const PIcon = window.Icon;

// ─── PROGRESS ─────────────────────────────────────────────────
const ProgressScreen = () => {
  const [tab, setTab] = uS('body');

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
      <div style={{ marginTop: 4, marginBottom: 18 }}>
        <div className="t-eyebrow">Progress</div>
        <h1 className="t-title-xl" style={{ marginTop: 6 }}>How you're<br/>trending.</h1>
      </div>

      <div className="seg" style={{ marginBottom: 16 }}>
        {[
          { k: 'body', l: 'Body' },
          { k: 'lifts', l: 'Lifts' },
          { k: 'cardio', l: 'Cardio' },
        ].map(t => (
          <button key={t.k} aria-pressed={tab === t.k} onClick={() => setTab(t.k)}>{t.l}</button>
        ))}
      </div>

      {tab === 'body' && (
        <div className="tile" style={{ padding: 16, marginBottom: 14 }}>
          <window.TrendChart
            data={P_M.BODY_HISTORY}
            height={210}
            metrics={[
              { key: 'weight', label: 'Weight', color: 'var(--ink)', unit: 'lb' },
              { key: 'muscle', label: 'Lean mass', color: 'var(--moss)', unit: 'lb' },
              { key: 'fat',    label: 'Body fat', color: 'var(--accent)', unit: '%' },
            ]}
          />
        </div>
      )}

      {tab === 'lifts' && (
        <div className="tile" style={{ padding: 16, marginBottom: 14 }}>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Estimated 1RM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { name: 'Back Squat', val: 245, delta: '+15', wk: 8 },
              { name: 'Romanian DL', val: 215, delta: '+10', wk: 8 },
              { name: 'Bench Press', val: 195, delta: '+5',  wk: 8 },
              { name: 'Overhead Press', val: 125, delta: '+5', wk: 8 },
            ].map(l => (
              <div key={l.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{l.name}</span>
                  <span>
                    <span className="t-display-num" style={{ fontSize: 22 }}>{l.val}</span>
                    <span className="t-meta" style={{ marginLeft: 4, fontSize: 11 }}>lb · </span>
                    <span style={{ color: 'var(--moss)', fontSize: 11, fontWeight: 500 }}>{l.delta}</span>
                  </span>
                </div>
                <div style={{ height: 4, background: 'var(--bg-sunk)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(l.val/300)*100}%`, background: 'var(--ink)', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cardio' && (
        <div className="tile" style={{ padding: 16, marginBottom: 14 }}>
          <div className="t-eyebrow" style={{ marginBottom: 10 }}>Running pace · Zone 2</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="tile-sunk">
              <div className="stat-label">Avg pace</div>
              <div className="stat-num" style={{ marginTop: 4 }}>9:32<small>/mi</small></div>
              <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>−18s · 8 wks</div>
            </div>
            <div className="tile-sunk">
              <div className="stat-label">Avg HR</div>
              <div className="stat-num" style={{ marginTop: 4 }}>148<small>bpm</small></div>
              <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>−6 bpm · 8 wks</div>
            </div>
            <div className="tile-sunk">
              <div className="stat-label">Weekly miles</div>
              <div className="stat-num" style={{ marginTop: 4 }}>14.8<small>mi</small></div>
              <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>3 runs</div>
            </div>
            <div className="tile-sunk">
              <div className="stat-label">VO₂ est.</div>
              <div className="stat-num" style={{ marginTop: 4 }}>42.1</div>
              <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>+1.4</div>
            </div>
          </div>
        </div>
      )}

      {/* Body composition module — always visible */}
      <div className="t-eyebrow" style={{ margin: '20px 0 10px' }}>Body composition</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { l: 'Weight', v: 184.2, u: 'lb', d: '−7.6 lb', good: true },
          { l: 'Lean mass', v: 142.1, u: 'lb', d: '+1.7 lb', good: true },
          { l: 'Body fat %', v: 16.8, u: '%', d: '−2.4 pts', good: true },
          { l: 'Waist', v: 33.5, u: 'in', d: '−1.0 in', good: true },
        ].map(t => (
          <div key={t.l} className="tile" style={{ padding: 14 }}>
            <div className="stat-label">{t.l}</div>
            <div className="stat-num" style={{ marginTop: 6 }}>{t.v}<small>{t.u}</small></div>
            <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: t.good ? 'var(--moss)' : 'var(--ink-3)' }}>{t.d} · 12 wks</div>
          </div>
        ))}
      </div>
    </div>
  );
};
window.ProgressScreen = ProgressScreen;

// ─── HEALTH ───────────────────────────────────────────────────
const COMMON_MEDS = [
  { name: 'Vitamin D3', dose: '5000 IU', schedule: 'Daily · AM' },
  { name: 'Magnesium', dose: '400 mg', schedule: 'Daily · PM' },
  { name: 'Omega-3', dose: '2 g', schedule: 'Daily · AM' },
  { name: 'Creatine', dose: '5 g', schedule: 'Daily · AM' },
  { name: 'Multivitamin', dose: '1 tab', schedule: 'Daily · AM' },
  { name: 'Zinc', dose: '15 mg', schedule: 'Daily · PM' },
  { name: 'Iron', dose: '65 mg', schedule: 'Daily · AM' },
  { name: 'Probiotic', dose: '1 cap', schedule: 'Daily · AM' },
  { name: 'Lisinopril', dose: '10 mg', schedule: 'Daily · AM' },
  { name: 'Metformin', dose: '500 mg', schedule: 'Twice daily' },
  { name: 'Atorvastatin', dose: '20 mg', schedule: 'Daily · PM' },
  { name: 'GLP-1', dose: '5 mg', schedule: 'Weekly · Tue' },
];

const AddMedSheet = ({ onAdd, onClose }) => {
  const [name, setN] = uS('');
  const [dose, setD] = uS('');
  const [schedule, setS] = uS('Daily · AM');
  const valid = name.trim() && dose.trim();

  const pickPreset = (m) => { setN(m.name); setD(m.dose); setS(m.schedule); };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-end', zIndex: 50,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: '100%', background: 'var(--bg)', borderRadius: '20px 20px 0 0',
        padding: '18px 18px 24px', maxHeight: '85%', overflowY: 'auto',
        animation: 'sheetUp 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--line-2)', borderRadius: 2, margin: '0 auto 16px' }}/>
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>Add medication</div>
        <h2 className="t-title-l" style={{ margin: 0, marginBottom: 18 }}>What are you taking?</h2>

        <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Common</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
          {COMMON_MEDS.map(m => (
            <button key={m.name} onClick={() => pickPreset(m)} style={{
              background: name === m.name ? 'var(--ink)' : 'var(--bg-sunk)',
              color: name === m.name ? 'var(--bg)' : 'var(--ink-2)',
              border: 'none', borderRadius: 8, padding: '7px 11px',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{m.name}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          <label style={{ display: 'block' }}>
            <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 5 }}>Name</div>
            <input value={name} onChange={e => setN(e.target.value)} placeholder="Vitamin D3" style={{
              width: '100%', background: 'var(--bg-sunk)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '11px 12px', fontSize: 14, color: 'var(--ink)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}/>
          </label>
          <label style={{ display: 'block' }}>
            <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 5 }}>Dose</div>
            <input value={dose} onChange={e => setD(e.target.value)} placeholder="5000 IU" style={{
              width: '100%', background: 'var(--bg-sunk)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '11px 12px', fontSize: 14, color: 'var(--ink)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}/>
          </label>
          <label style={{ display: 'block' }}>
            <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 5 }}>Schedule</div>
            <select value={schedule} onChange={e => setS(e.target.value)} style={{
              width: '100%', background: 'var(--bg-sunk)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '11px 12px', fontSize: 14, color: 'var(--ink)',
              fontFamily: 'inherit', boxSizing: 'border-box',
            }}>
              <option>Daily · AM</option>
              <option>Daily · PM</option>
              <option>Twice daily</option>
              <option>Weekly · Mon</option>
              <option>Weekly · Tue</option>
              <option>As needed</option>
            </select>
          </label>
        </div>

        <button disabled={!valid} onClick={() => onAdd({ name: name.trim(), dose: dose.trim(), schedule })} style={{
          width: '100%', background: valid ? 'var(--ink)' : 'var(--bg-sunk)',
          color: valid ? 'var(--bg)' : 'var(--ink-3)', border: 'none', borderRadius: 12,
          padding: '14px', fontSize: 15, fontWeight: 600, cursor: valid ? 'pointer' : 'not-allowed',
          fontFamily: 'inherit',
        }}>Add to my medications</button>
      </div>
    </div>
  );
};

const HealthScreen = () => {
  const [taken, setTaken] = uS({});
  const [meds, setMeds] = uS(P_M.MEDICATIONS);
  const [showAdd, setShowAdd] = uS(false);
  const [editMode, setEdit] = uS(false);

  const addMed = (m) => {
    const id = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    setMeds(prev => [...prev, { id, ...m, last: '—', next: 'Tomorrow', streak: 0, weekly: m.schedule.startsWith('Weekly') }]);
    setShowAdd(false);
  };
  const removeMed = (id) => setMeds(prev => prev.filter(m => m.id !== id));

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
      <div style={{ marginTop: 4, marginBottom: 18 }}>
        <div className="t-eyebrow">Health</div>
        <h1 className="t-title-xl" style={{ marginTop: 6 }}>Your daily<br/>baseline.</h1>
      </div>

      {/* Vitals row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        <div className="tile" style={{ padding: 12, textAlign: 'center' }}>
          <PIcon name="moon" size={16} color="var(--ink-3)"/>
          <div className="stat-num" style={{ fontSize: 22, marginTop: 4, justifyContent: 'center' }}>7.3<small>h</small></div>
          <div className="stat-label" style={{ fontSize: 9 }}>Sleep</div>
        </div>
        <div className="tile" style={{ padding: 12, textAlign: 'center' }}>
          <PIcon name="heart" size={16} color="var(--ink-3)"/>
          <div className="stat-num" style={{ fontSize: 22, marginTop: 4, justifyContent: 'center' }}>54<small>bpm</small></div>
          <div className="stat-label" style={{ fontSize: 9 }}>Resting HR</div>
        </div>
        <div className="tile" style={{ padding: 12, textAlign: 'center' }}>
          <PIcon name="flame" size={16} color="var(--ink-3)"/>
          <div className="stat-num" style={{ fontSize: 22, marginTop: 4, justifyContent: 'center' }}>2,140</div>
          <div className="stat-label" style={{ fontSize: 9 }}>Calories</div>
        </div>
      </div>

      {/* Medications */}
      <div className="tile-flat" style={{ marginBottom: 14, padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
          <span className="t-eyebrow">Medications</span>
          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={() => setEdit(e => !e)} style={{ background: 'none', border: 'none', color: editMode ? 'var(--accent)' : 'var(--ink-3)', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{editMode ? 'Done' : 'Edit'}</button>
          </div>
        </div>
        <div>
          {meds.map((m, i) => {
            const isTaken = taken[m.id] || (m.last && m.last.startsWith('Today'));
            return (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderTop: '1px solid var(--line)',
              }}>
                {editMode ? (
                  <button onClick={() => removeMed(m.id)} style={{
                    width: 26, height: 26, borderRadius: 13,
                    background: 'var(--accent)', border: 'none', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PIcon name="minus" size={14} color="#fff"/>
                  </button>
                ) : (
                  <button
                    onClick={() => setTaken(t => ({ ...t, [m.id]: !t[m.id] }))}
                    style={{
                      width: 26, height: 26, borderRadius: 8,
                      background: isTaken ? 'var(--moss)' : 'transparent',
                      border: isTaken ? 'none' : '1.5px solid var(--line-2)',
                      cursor: 'pointer', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {isTaken && <PIcon name="check" size={14} color="#fff"/>}
                  </button>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</span>
                    <span className="t-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.dose}</span>
                  </div>
                  <div className="t-meta" style={{ fontSize: 11, marginTop: 1 }}>
                    {m.schedule}{m.weekly && m.next ? ' · Next ' + m.next : ''}
                  </div>
                </div>
                {!editMode && (
                  <div style={{ textAlign: 'right' }}>
                    <div className="t-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{m.streak}d</div>
                    <div className="t-meta" style={{ fontSize: 9, marginTop: 1 }}>streak</div>
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={() => setShowAdd(true)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            background: 'transparent', border: 'none', borderTop: '1px solid var(--line)',
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8, background: 'var(--bg-sunk)',
              border: '1.5px dashed var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PIcon name="plus" size={14} color="var(--ink-3)"/>
            </div>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-2)' }}>Add medication</span>
          </button>
        </div>
      </div>

      {showAdd && <AddMedSheet onAdd={addMed} onClose={() => setShowAdd(false)}/>}

      {/* Integrations */}
      <div className="tile-flat" style={{ marginBottom: 14, padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 10px' }}>
          <span className="t-eyebrow">Integrations</span>
          <span className="t-meta" style={{ fontSize: 11 }}>4 syncing</span>
        </div>
        {P_M.INTEGRATIONS.map((it, i) => (
          <div key={it.name} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderTop: '1px solid var(--line)',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'var(--bg-sunk)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <PIcon name={it.icon} size={16} color="var(--ink-2)"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{it.name}</div>
              <div className="t-meta" style={{ fontSize: 11, marginTop: 1 }}>
                {it.synced ? `Synced ${it.synced}` : 'Tap to connect'}
              </div>
            </div>
            {it.status === 'connected' ? (
              <span className="pill pill-moss">Live</span>
            ) : (
              <PIcon name="plus" size={16} color="var(--ink-3)"/>
            )}
          </div>
        ))}
      </div>

      <div className="t-meta" style={{ fontSize: 11, textAlign: 'center', marginTop: 8 }}>
        Health data is private to you. Edit visibility in <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Settings</span>.
      </div>
    </div>
  );
};
window.HealthScreen = HealthScreen;

// ─── PROFILE ──────────────────────────────────────────────────
const ProfileScreen = () => {
  const [sex, setSex] = React.useState(() => localStorage.getItem('wa-sex') || 'male');
  const updateSex = (s) => {
    localStorage.setItem('wa-sex', s);
    setSex(s);
    window.dispatchEvent(new CustomEvent('wa-sex-changed', { detail: s }));
  };
  return (
  <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
    <div style={{ marginTop: 4, marginBottom: 18 }}>
      <div className="t-eyebrow">Profile</div>
      <h1 className="t-title-xl" style={{ marginTop: 6 }}>Terry.</h1>
    </div>

    <div className="tile" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: 'linear-gradient(135deg, var(--accent), var(--ink))',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Instrument Serif, serif', fontSize: 24,
      }}>T</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 500 }}>Terry</div>
        <div className="t-meta" style={{ marginTop: 2 }}>Member since Feb 2026</div>
      </div>
    </div>

    {/* Body type / sex */}
    <div className="tile" style={{ marginBottom: 14, padding: '14px 16px' }}>
      <div className="t-eyebrow" style={{ marginBottom: 10 }}>Body type</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { k: 'male', label: 'Male' },
          { k: 'female', label: 'Female' },
        ].map(o => (
          <button key={o.k} onClick={() => updateSex(o.k)} style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: sex === o.k ? 'var(--ink)' : 'var(--bg-sunk)',
            color: sex === o.k ? 'var(--bg)' : 'var(--ink-2)',
            border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}>{o.label}</button>
        ))}
      </div>
      <div className="t-meta" style={{ fontSize: 11, marginTop: 8 }}>
        Used for the body diagram silhouette and exercise targeting visuals.
      </div>
    </div>

    <div className="tile-flat" style={{ padding: 0, marginBottom: 14 }}>
      {[
        { label: 'Goals & targets', meta: 'Lose fat · Preserve muscle' },
        { label: 'Programs', meta: '4-day power · Wk 4 of 8' },
        { label: 'Notifications', meta: 'Workouts, meds, sync' },
        { label: 'Data sources', meta: '4 connected' },
        { label: 'Privacy', meta: 'Health data stays on device' },
        { label: 'Export data', meta: 'CSV, JSON' },
      ].map((r, i) => (
        <div key={r.label} style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
          borderTop: i === 0 ? 'none' : '1px solid var(--line)', cursor: 'pointer',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{r.label}</div>
            <div className="t-meta" style={{ fontSize: 11, marginTop: 1 }}>{r.meta}</div>
          </div>
          <PIcon name="chevron-right" size={16} color="var(--ink-4)"/>
        </div>
      ))}
    </div>
  </div>
  );
};
window.ProfileScreen = ProfileScreen;
