// Workout Builder — tap muscles → generate exercise plan
const { useState: bS, useMemo: bMemo } = React;
const BIcon = window.Icon;
const BLabels = window.MUSCLE_LABELS;

// Exercise library, keyed by muscle group
const LIB = {
  chest: [
    { name: 'Barbell Bench Press', sets: 4, reps: 6, primary: ['chest'], secondary: ['triceps','shoulders'] },
    { name: 'Incline DB Press',    sets: 3, reps: 10, primary: ['chest'], secondary: ['shoulders'] },
    { name: 'Cable Fly',           sets: 3, reps: 12, primary: ['chest'], secondary: [] },
  ],
  back: [
    { name: 'Barbell Row',         sets: 4, reps: 8, primary: ['back','lats'], secondary: ['biceps'] },
    { name: 'Back Extension',      sets: 3, reps: 12, primary: ['back'], secondary: ['glutes','hamstrings'] },
  ],
  lats: [
    { name: 'Pull-ups',            sets: 4, reps: 8, primary: ['lats'], secondary: ['biceps'] },
    { name: 'Lat Pulldown',        sets: 3, reps: 10, primary: ['lats'], secondary: ['biceps'] },
    { name: 'Single-arm DB Row',   sets: 3, reps: 10, primary: ['lats','back'], secondary: ['biceps'] },
  ],
  shoulders: [
    { name: 'Overhead Press',      sets: 4, reps: 6, primary: ['shoulders'], secondary: ['triceps'] },
    { name: 'Lateral Raise',       sets: 3, reps: 12, primary: ['shoulders'], secondary: [] },
    { name: 'Face Pull',           sets: 3, reps: 15, primary: ['shoulders'], secondary: ['back'] },
  ],
  biceps: [
    { name: 'Barbell Curl',        sets: 3, reps: 10, primary: ['biceps'], secondary: ['forearms'] },
    { name: 'Hammer Curl',         sets: 3, reps: 10, primary: ['biceps','forearms'], secondary: [] },
  ],
  triceps: [
    { name: 'Tricep Pushdown',     sets: 3, reps: 12, primary: ['triceps'], secondary: [] },
    { name: 'Skull Crusher',       sets: 3, reps: 10, primary: ['triceps'], secondary: [] },
  ],
  forearms: [
    { name: 'Wrist Curl',          sets: 3, reps: 15, primary: ['forearms'], secondary: [] },
    { name: 'Farmer Carry',        sets: 3, reps: 30, primary: ['forearms'], secondary: ['traps','abs'] },
  ],
  traps: [
    { name: 'Barbell Shrug',       sets: 3, reps: 12, primary: ['traps'], secondary: ['forearms'] },
  ],
  abs: [
    { name: 'Hanging Leg Raise',   sets: 3, reps: 12, primary: ['abs'], secondary: ['obliques'] },
    { name: 'Cable Crunch',        sets: 3, reps: 15, primary: ['abs'], secondary: [] },
    { name: 'Plank',               sets: 3, reps: 60, primary: ['abs'], secondary: ['obliques'] },
  ],
  obliques: [
    { name: 'Russian Twist',       sets: 3, reps: 20, primary: ['obliques'], secondary: ['abs'] },
    { name: 'Side Plank',          sets: 3, reps: 45, primary: ['obliques'], secondary: ['abs'] },
  ],
  quads: [
    { name: 'Back Squat',          sets: 4, reps: 6, primary: ['quads','glutes'], secondary: ['hamstrings','abs'] },
    { name: 'Leg Press',           sets: 3, reps: 10, primary: ['quads'], secondary: ['glutes'] },
    { name: 'Bulgarian Split',     sets: 3, reps: 10, primary: ['quads','glutes'], secondary: ['hamstrings'] },
  ],
  hamstrings: [
    { name: 'Romanian Deadlift',   sets: 4, reps: 8, primary: ['hamstrings','glutes'], secondary: ['back'] },
    { name: 'Lying Leg Curl',      sets: 3, reps: 12, primary: ['hamstrings'], secondary: [] },
  ],
  glutes: [
    { name: 'Hip Thrust',          sets: 4, reps: 8, primary: ['glutes'], secondary: ['hamstrings'] },
    { name: 'Walking Lunge',       sets: 3, reps: 12, primary: ['glutes','quads'], secondary: ['hamstrings'] },
  ],
  calves: [
    { name: 'Standing Calf Raise', sets: 3, reps: 15, primary: ['calves'], secondary: [] },
    { name: 'Seated Calf Raise',   sets: 3, reps: 15, primary: ['calves'], secondary: [] },
  ],
};

// Smart pick: 1-2 exercises per selected group, prefer compounds that hit multiple selected
const buildPlan = (selected) => {
  if (!selected.length) return [];
  const sel = new Set(selected);
  // Score every candidate: # of selected primary + 0.5 × # of selected secondary
  const scored = [];
  Object.entries(LIB).forEach(([group, list]) => {
    if (!sel.has(group)) return;
    list.forEach(ex => {
      const score =
        ex.primary.filter(m => sel.has(m)).length +
        0.5 * ex.secondary.filter(m => sel.has(m)).length;
      scored.push({ ...ex, _score: score, _key: ex.name });
    });
  });
  // Dedupe by name (compounds appear under multiple groups), keep highest score
  const byName = {};
  scored.forEach(ex => {
    if (!byName[ex._key] || byName[ex._key]._score < ex._score) byName[ex._key] = ex;
  });
  // Sort by score desc; greedily ensure each selected group has at least one
  const sorted = Object.values(byName).sort((a, b) => b._score - a._score);
  const plan = [];
  const covered = new Set();
  for (const ex of sorted) {
    const newCoverage = ex.primary.filter(m => sel.has(m) && !covered.has(m));
    if (newCoverage.length || plan.length < 5) {
      plan.push(ex);
      ex.primary.forEach(m => sel.has(m) && covered.add(m));
    }
    if (covered.size === sel.size && plan.length >= Math.min(4, sel.size + 1)) break;
    if (plan.length >= 6) break;
  }
  // Order: compounds (score >= 2) first, isolation last
  plan.sort((a, b) => b._score - a._score);
  return plan;
};

const estimateDuration = (plan) =>
  Math.round(plan.reduce((sum, ex) => sum + ex.sets * 2.5, 0)); // ~2.5 min per set including rest

// ─── BUILDER SCREEN ──────────────────────────────────────────
const LEVELS = {
  beginner:     { sMul: 0.75, rMul: 1.10, label: 'Beginner',     hint: 'Lower volume, higher reps' },
  intermediate: { sMul: 1.00, rMul: 1.00, label: 'Intermediate', hint: 'Standard programming' },
  advanced:     { sMul: 1.25, rMul: 0.92, label: 'Advanced',     hint: 'More sets, lower reps' },
};

const applyLevel = (plan, level) => {
  const m = LEVELS[level];
  return plan.map(ex => ({
    ...ex,
    sets: Math.max(2, Math.round(ex.sets * m.sMul)),
    reps: Math.max(3, Math.round(ex.reps * m.rMul)),
  }));
};

const BuilderScreen = ({ onClose, onStartWorkout }) => {
  const [selected, setSelected] = bS([]);
  const [view, setView] = bS('front');
  const [step, setStep] = bS('select'); // 'select' | 'review'
  const [level, setLevel] = bS('intermediate');
  const [editedPlan, setEditedPlan] = bS(null); // [{name, sets, reps, primary, secondary}]

  const toggle = (group) => {
    setSelected(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };
  const clear = () => setSelected([]);

  const basePlan = bMemo(() => applyLevel(buildPlan(selected), level), [selected, level]);
  const plan = editedPlan || basePlan;
  const duration = estimateDuration(plan);

  // When entering review, snapshot the auto-built plan so user edits persist
  const enterReview = () => { setEditedPlan(basePlan.map(ex => ({...ex}))); setStep('review'); };
  const updateSet = (i, key, delta) => {
    setEditedPlan(p => p.map((ex, idx) => idx === i ? { ...ex, [key]: Math.max(1, ex[key] + delta) } : ex));
  };
  const removeEx = (i) => setEditedPlan(p => p.filter((_, idx) => idx !== i));

  // Quick presets
  const presets = [
    { label: 'Push',   groups: ['chest', 'shoulders', 'triceps'] },
    { label: 'Pull',   groups: ['lats', 'back', 'biceps'] },
    { label: 'Legs',   groups: ['quads', 'hamstrings', 'glutes', 'calves'] },
    { label: 'Upper',  groups: ['chest', 'lats', 'shoulders', 'biceps', 'triceps'] },
    { label: 'Core',   groups: ['abs', 'obliques'] },
  ];

  if (step === 'review') {
    return (
      <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
          <button onClick={() => setStep('select')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← Edit</button>
          <div className="t-eyebrow">Your plan</div>
          <div style={{ width: 40 }}></div>
        </div>

        <h1 className="t-title-xl" style={{ fontSize: 36, marginBottom: 4 }}>Custom session.</h1>
        <div className="t-meta" style={{ marginBottom: 20 }}>
          <span className="t-num">{plan.length}</span> exercises · ~<span className="t-num">{duration}</span> min · {selected.length} muscle groups
        </div>

        {/* Body summary */}
        <div className="tile" style={{ padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <window.Body primary={selected} size={110} view={view} />
          <div style={{ flex: 1 }}>
            <div className="t-eyebrow" style={{ marginBottom: 6 }}>Targeting</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {selected.map(g => <span key={g} className="pill pill-accent">{BLabels[g] || g}</span>)}
            </div>
            <div className="seg" style={{ width: 130, marginTop: 10 }}>
              <button aria-pressed={view === 'front'} onClick={() => setView('front')}>Front</button>
              <button aria-pressed={view === 'back'}  onClick={() => setView('back')}>Back</button>
            </div>
          </div>
        </div>

        {/* Editable plan list */}
        <div className="tile-flat" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="t-eyebrow">Exercises · tap −/+ to adjust</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {plan.map((ex, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--bg-sunk)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 14, color: 'var(--ink-4)', fontSize: 11, fontFamily: 'Geist Mono' }}>{i + 1}</span>
                  <div style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{ex.name}</div>
                  <button onClick={() => removeEx(i)} style={{ background: 'none', border: 'none', color: 'var(--ink-4)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }} title="Remove">×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[{k:'sets', label:'Sets', step:1}, {k:'reps', label:'Reps', step:1}].map(f => (
                    <div key={f.k} style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-raised)', borderRadius: 8, padding: 3 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--ink-3)', fontFamily: 'Geist Mono', width: 28, paddingLeft: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</span>
                      <button onClick={() => updateSet(i, f.k, -f.step)} style={{ width: 24, height: 24, border: 'none', background: 'var(--bg-sunk)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}>−</button>
                      <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 13 }}>{ex[f.k]}</div>
                      <button onClick={() => updateSet(i, f.k, f.step)} style={{ width: 24, height: 24, border: 'none', background: 'var(--bg-sunk)', borderRadius: 6, cursor: 'pointer', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13 }}>+</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => onStartWorkout(plan, selected)}>
          <BIcon name="play" size={14}/> Start workout
        </button>
        <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }} onClick={() => setStep('select')}>
          Adjust selection
        </button>
      </div>
    );
  }

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 4 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>← Back</button>
        <div className="t-eyebrow">Build workout</div>
        <button onClick={clear} disabled={!selected.length} style={{ background: 'none', border: 'none', color: selected.length ? 'var(--accent)' : 'var(--ink-4)', fontSize: 13, cursor: selected.length ? 'pointer' : 'default', padding: 0, fontFamily: 'inherit' }}>Clear</button>
      </div>

      <h1 className="t-title-xl" style={{ fontSize: 30, marginBottom: 4, lineHeight: 1.05 }}>Tap what<br/>you want to train.</h1>
      <div className="t-meta" style={{ marginBottom: 14 }}>
        Tap muscle groups on the body. We'll build the plan.
      </div>

      {/* Experience level */}
      <div style={{ marginBottom: 14 }}>
        <div className="t-eyebrow" style={{ marginBottom: 6 }}>Experience level</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, padding: 3, background: 'var(--bg-sunk)', borderRadius: 10 }}>
          {Object.entries(LEVELS).map(([k, v]) => (
            <button key={k} onClick={() => setLevel(k)} style={{
              padding: '8px 4px', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: level === k ? 'var(--bg-raised)' : 'transparent',
              color: level === k ? 'var(--ink)' : 'var(--ink-3)',
              border: 'none', borderRadius: 7, fontWeight: level === k ? 500 : 400,
              boxShadow: level === k ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            }}>{v.label}</button>
          ))}
        </div>
        <div className="t-meta" style={{ fontSize: 11, marginTop: 6 }}>{LEVELS[level].hint}</div>
      </div>

      {/* Body diagram — interactive */}
      <div className="tile" style={{ padding: '14px 14px 10px', marginBottom: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div className="seg" style={{ width: 130, position: 'absolute', top: 14, right: 14 }}>
          <button aria-pressed={view === 'front'} onClick={() => setView('front')}>Front</button>
          <button aria-pressed={view === 'back'}  onClick={() => setView('back')}>Back</button>
        </div>
        <window.Body primary={selected} view={view} size={240} onMuscleClick={toggle} />
        {!selected.length && (
          <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', fontSize: 11.5, color: 'var(--ink-4)', fontStyle: 'italic' }}>
            Tap chest, quads, lats… any muscle group.
          </div>
        )}
      </div>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div className="t-eyebrow" style={{ marginBottom: 6 }}>Selected · {selected.length}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.map(g => (
              <button key={g} onClick={() => toggle(g)} className="pill pill-accent" style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {BLabels[g] || g}
                <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 2 }}>×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="t-eyebrow" style={{ marginBottom: 8 }}>Or pick a split</div>
      <div className="chip-row" style={{ marginBottom: 18 }}>
        {presets.map(p => {
          const matches = p.groups.every(g => selected.includes(g)) && selected.length === p.groups.length;
          return (
            <button key={p.label} className="chip" aria-pressed={matches} onClick={() => setSelected(p.groups)}>
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Live plan preview */}
      {selected.length > 0 && (
        <div className="tile-flat" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="t-eyebrow">Plan preview</div>
            <span className="t-meta" style={{ fontSize: 11 }}>~<span className="t-num">{duration}</span> min</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {plan.map((ex, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--bg-sunk)', borderRadius: 8 }}>
                <span style={{ width: 14, color: 'var(--ink-4)', fontSize: 11, fontFamily: 'Geist Mono' }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{ex.name}</span>
                <span className="t-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ex.sets}×{ex.reps}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary btn-block" disabled={!selected.length} onClick={enterReview} style={{ opacity: selected.length ? 1 : 0.4 }}>
        Review plan {selected.length > 0 && <>· <span className="t-num" style={{ marginLeft: 4 }}>{plan.length}</span> exercises</>}
      </button>
    </div>
  );
};

window.BuilderScreen = BuilderScreen;
