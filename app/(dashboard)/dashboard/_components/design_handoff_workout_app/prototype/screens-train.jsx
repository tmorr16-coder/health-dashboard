// Train + Active workout + Chat screens
const T_M = window.MOCK;
const TIcon = window.Icon;

// ─── TRAIN (list/index) ───────────────────────────────────────
const TrainScreen = ({ onStartWorkout, onBuild }) => {
  const today = T_M.WEEK_PLAN.find(d => d.today);
  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
      <div style={{ marginTop: 4, marginBottom: 18 }}>
        <div className="t-eyebrow">Train</div>
        <h1 className="t-title-xl" style={{ marginTop: 6 }}>Today's session.</h1>
      </div>

      {/* Hero — today */}
      <div className="tile" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '16px 18px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="pill pill-accent">Up next · {T_M.TODAY_WORKOUT.duration}</span>
            <span className="t-meta">Today, Fri</span>
          </div>
          <div className="t-title-lg" style={{ marginBottom: 14 }}>{today.name}</div>
        </div>
        {/* Body diagram + exercises */}
        <div style={{ display: 'flex', gap: 14, padding: '0 18px 16px' }}>
          <div style={{ flexShrink: 0, paddingTop: 4 }}>
            <window.Body primary={['quads', 'glutes', 'hamstrings']} secondary={['calves', 'core', 'lower-back']} size={100} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {T_M.EXERCISES.map((ex, i) => (
              <div key={ex.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: 'var(--bg-sunk)', borderRadius: 8,
              }}>
                <span style={{ width: 16, color: 'var(--ink-4)', fontSize: 11, fontFamily: 'Geist Mono' }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>{ex.name}</span>
                <span className="t-num" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ex.target.sets}×{ex.target.reps}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ borderRadius: 0 }} onClick={onStartWorkout}>
          <TIcon name="play" size={14}/> Start workout
        </button>
      </div>

      {/* Build your own */}
      <button onClick={onBuild} className="tile" style={{
        width: '100%', padding: 14, marginBottom: 14,
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'var(--bg-raised)', border: '1px solid var(--line)',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
      }}>
        <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 12, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TIcon name="plus" size={22} stroke={1.8} color="var(--accent)"/>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 2 }}>Build your own</div>
          <div className="t-meta" style={{ fontSize: 11.5 }}>Tap muscles, get a plan in seconds</div>
        </div>
        <TIcon name="chevron-right" size={16} color="var(--ink-3)"/>
      </button>

      {/* Browse */}
      <div className="t-eyebrow" style={{ margin: '20px 0 10px' }}>Browse</div>
      <div className="chip-row" style={{ marginBottom: 14 }}>
        {['All', 'Strength', 'Cardio', 'Mobility', 'Programs'].map((c, i) => (
          <button key={c} className="chip" aria-pressed={i === 0}>{c}</button>
        ))}
      </div>

      {/* Recent sessions list */}
      <div className="tile-flat">
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>History</div>
        {T_M.RECENT_SESSIONS.map((s, i) => (
          <div key={i} className="row">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
              <div className="t-meta" style={{ fontSize: 11.5, marginTop: 2 }}>
                {s.date} · {s.duration}m
                {s.volume && <> · <span className="t-num">{(s.volume/1000).toFixed(1)}k lb</span></>}
                {s.distance && <> · <span className="t-num">{s.pace}</span>/mi</>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {s.rpe && <span className="pill" style={{ fontSize: 10 }}>RPE {s.rpe}</span>}
              {s.hr && <span className="pill" style={{ fontSize: 10 }}>{s.hr} bpm</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
window.TrainScreen = TrainScreen;

// ─── ACTIVE WORKOUT ───────────────────────────────────────────
const ActiveWorkout = ({ onExit, onComplete }) => {
  const exercises = T_M.EXERCISES;
  const [exIdx, setExIdx] = uS(0);
  const [setIdx, setSetIdx] = uS(0);
  const [bodyView, setBodyView] = uS('front');
  // logs[exIdx] = [{reps, weight, rpe, done} | null]
  const [logs, setLogs] = uS(() => exercises.map(e => Array(e.target.sets).fill(null)));
  const [resting, setResting] = uS(0); // seconds left
  const [elapsed, setElapsed] = uS(0);
  const ex = exercises[exIdx];

  // Pre-fill suggestion when advancing
  uE(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  uE(() => {
    if (resting <= 0) return;
    const id = setInterval(() => setResting(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [resting]);

  const currentLog = logs[exIdx][setIdx] || { reps: ex.target.reps, weight: ex.suggested.weight, rpe: 7 };

  const updateField = (k, v) => {
    const next = logs.map(arr => arr.slice());
    next[exIdx][setIdx] = { ...(next[exIdx][setIdx] || currentLog), [k]: v };
    setLogs(next);
  };

  const completeSet = () => {
    const next = logs.map(arr => arr.slice());
    next[exIdx][setIdx] = { ...currentLog, done: true };
    setLogs(next);
    setResting(ex.rest);
    if (setIdx + 1 < ex.target.sets) {
      setSetIdx(setIdx + 1);
    } else if (exIdx + 1 < exercises.length) {
      setExIdx(exIdx + 1); setSetIdx(0);
    }
  };

  const skipRest = () => setResting(0);

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  // Aggregate progress
  const totalSets = exercises.reduce((s, e) => s + e.target.sets, 0);
  const doneSets = logs.flat().filter(s => s?.done).length;
  const allDone = doneSets === totalSets;

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          End session
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="t-eyebrow">Active</div>
          <div className="t-num" style={{ fontSize: 13, color: 'var(--ink)' }}>{fmtTime(elapsed)}</div>
        </div>
        <div style={{ width: 80, textAlign: 'right' }}>
          <span className="t-meta" style={{ fontSize: 11 }}>{doneSets}/{totalSets}</span>
        </div>
      </div>

      {/* Exercise title */}
      <div style={{ marginBottom: 14 }}>
        <div className="t-eyebrow" style={{ marginBottom: 4 }}>Exercise {exIdx + 1} of {exercises.length}</div>
        <div className="t-title-xl" style={{ fontSize: 32 }}>{ex.name}</div>
      </div>

      {/* Body diagram */}
      <div className="tile" style={{ padding: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flexShrink: 0 }}>
          <window.Body primary={ex.primary} secondary={ex.secondary} view={bodyView} size={92} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="t-eyebrow" style={{ marginBottom: 6 }}>Working</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {ex.primary.map(m => <span key={m} className="pill pill-accent" style={{ textTransform: 'capitalize' }}>{m.replace('-', ' ')}</span>)}
            {ex.secondary.map(m => <span key={m} className="pill" style={{ textTransform: 'capitalize' }}>{m.replace('-', ' ')}</span>)}
          </div>
          <div className="seg" style={{ width: 130 }}>
            <button aria-pressed={bodyView === 'front'} onClick={() => setBodyView('front')}>Front</button>
            <button aria-pressed={bodyView === 'back'} onClick={() => setBodyView('back')}>Back</button>
          </div>
        </div>
      </div>

      {/* Rest timer (overlays UX flow when active) */}
      {resting > 0 && (
        <div className="tile" style={{
          marginBottom: 14, padding: 18, textAlign: 'center',
          background: 'var(--ink)', color: 'var(--bg)', border: 'none',
        }}>
          <div className="t-eyebrow" style={{ color: 'var(--ink-4)', marginBottom: 6 }}>Rest</div>
          <div className="t-display-num" style={{ fontSize: 56, color: 'var(--bg)' }}>{fmtTime(resting)}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', margin: '6px 0 14px' }}>
            Suggested {fmtTime(ex.rest)} between heavy sets
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setResting(r => r + 30)} className="btn btn-ghost" style={{ borderColor: 'var(--ink-3)', color: 'var(--bg)', padding: '8px 14px', fontSize: 12 }}>+30s</button>
            <button onClick={skipRest} className="btn" style={{ background: 'var(--bg)', color: 'var(--ink)', padding: '8px 14px', fontSize: 12 }}>Skip rest</button>
          </div>
        </div>
      )}

      {/* Set logger */}
      <div className="tile" style={{ marginBottom: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div className="t-eyebrow">Set {setIdx + 1} of {ex.target.sets}</div>
            <div className="t-meta" style={{ fontSize: 11, marginTop: 2 }}>
              Last week · <span className="t-num">{ex.last[setIdx]?.weight}lb × {ex.last[setIdx]?.reps} @ RPE {ex.last[setIdx]?.rpe}</span>
            </div>
          </div>
          <span className="pill pill-accent">
            <TIcon name="sparkle" size={11}/> {ex.suggested.hint.split('—')[0].trim()}
          </span>
        </div>

        {/* Inputs: stepper-style */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { key: 'weight', label: 'Weight', unit: 'lb', step: 5 },
            { key: 'reps', label: 'Reps', unit: '', step: 1 },
            { key: 'rpe', label: 'RPE', unit: '/10', step: 0.5 },
          ].map(f => (
            <div key={f.key}>
              <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 5, textAlign: 'center' }}>{f.label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-sunk)', borderRadius: 10, padding: 3 }}>
                <button onClick={() => updateField(f.key, Math.max(0, (currentLog[f.key] || 0) - f.step))}
                  style={{ width: 28, height: 30, border: 'none', background: 'var(--bg-raised)', borderRadius: 7, cursor: 'pointer', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }}>−</button>
                <div style={{ flex: 1, textAlign: 'center', fontFamily: 'Geist Mono', fontWeight: 500, fontSize: 16 }}>
                  {currentLog[f.key]}<span style={{ fontSize: 9, color: 'var(--ink-3)', marginLeft: 1 }}>{f.unit}</span>
                </div>
                <button onClick={() => updateField(f.key, (currentLog[f.key] || 0) + f.step)}
                  style={{ width: 28, height: 30, border: 'none', background: 'var(--bg-raised)', borderRadius: 7, cursor: 'pointer', color: 'var(--ink)', fontSize: 14, fontFamily: 'inherit', fontWeight: 500 }}>+</button>
              </div>
            </div>
          ))}
        </div>

        {/* Cues */}
        <div className="tile-sunk" style={{ padding: '10px 12px', marginBottom: 12 }}>
          <div className="t-eyebrow" style={{ fontSize: 9, marginBottom: 5 }}>Form cues</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {ex.cues.map((c, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--ink-2)', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--ink-4)', fontFamily: 'Geist Mono' }}>·</span>{c}
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={completeSet}>
          <TIcon name="check" size={15}/> Complete set
        </button>
      </div>

      {/* All sets summary */}
      <div className="tile-flat">
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Sets logged</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {logs[exIdx].map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: i === setIdx ? 'var(--bg-sunk)' : 'transparent',
              border: i === setIdx ? '1px solid var(--line)' : '1px solid transparent',
              borderRadius: 8,
            }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, background: s?.done ? 'var(--moss)' : 'var(--bg-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s?.done ? <TIcon name="check" size={11} color="#fff"/> : <span style={{ color: 'var(--ink-4)', fontSize: 10, fontFamily: 'Geist Mono' }}>{i+1}</span>}
              </span>
              <span className="t-num" style={{ fontSize: 12, flex: 1, color: s?.done ? 'var(--ink)' : 'var(--ink-3)' }}>
                {s?.done ? `${s.weight} × ${s.reps} @ ${s.rpe}` : `Target: ${ex.target.weight} × ${ex.target.reps}`}
              </span>
              {s?.done && <TIcon name="check" size={12} color="var(--moss)"/>}
            </div>
          ))}
        </div>
      </div>

      {allDone && (
        <button className="btn btn-accent btn-block" style={{ marginTop: 16 }} onClick={onComplete}>
          Finish & review
        </button>
      )}
    </div>
  );
};
window.ActiveWorkout = ActiveWorkout;

// ─── CHAT (workout coach) ─────────────────────────────────────
const WorkoutChat = ({ onClose }) => {
  const [msgs, setMsgs] = uS([
    { from: 'ai', text: 'Hey Terry. What are you in the mood to train today?' },
  ]);
  const [draft, setDraft] = uS('');
  const scrollRef = uR(null);

  uE(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = (text) => {
    if (!text.trim()) return;
    const userMsg = { from: 'user', text };
    setMsgs(m => [...m, userMsg]);
    setDraft('');
    // Canned responses
    setTimeout(() => {
      let reply = "Got it. I'll suggest a session that fits your recovery.";
      const t = text.toLowerCase();
      if (t.includes('cardio') || t.includes('run')) {
        reply = 'Recovery is 84 — green light for cardio. Suggesting a 30–40 min Zone 2 run, ~9:30/mi pace. Want me to swap in your usual route?';
      } else if (t.includes('strength') || t.includes('lift') || t.includes('lower') || t.includes('legs')) {
        reply = "You're due for legs. Here's tonight's session: Squat 4×6, RDL 4×8, Walking lunges 3×10, Calf raises 3×15. Hits quads, glutes, hamstrings, calves.";
      } else if (t.includes('upper') || t.includes('push') || t.includes('pull')) {
        reply = 'Push day on tap: Bench 4×6, Overhead press 3×8, Incline DB 3×10, Cable fly 3×12. About 45 minutes. Sound good?';
      } else if (t.includes('rest') || t.includes('off')) {
        reply = "Rest is productive. I'll move tomorrow's run to Sunday so you don't lose the long run.";
      } else if (t.includes('mix') || t.includes('both')) {
        reply = '20 min lower-body strength superset + 20 min Zone 2 bike. Best of both — preserves the lifting stimulus without compromising tomorrow.';
      }
      setMsgs(m => [...m, { from: 'ai', text: reply }]);
    }, 600);
  };

  const quick = ['Cardio focus', 'Strength', 'Mix both', 'Rest day'];

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
          ← Back
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="t-eyebrow">Coach</div>
        </div>
        <div style={{ width: 50 }}></div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.from === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
            padding: '10px 14px',
            borderRadius: m.from === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            background: m.from === 'user' ? 'var(--ink)' : 'var(--bg-raised)',
            color: m.from === 'user' ? 'var(--bg)' : 'var(--ink)',
            border: m.from === 'user' ? 'none' : '1px solid var(--line)',
            fontSize: 13.5, lineHeight: 1.45,
          }}>{m.text}</div>
        ))}
      </div>

      {/* Quick chips */}
      <div className="chip-row" style={{ marginBottom: 8, marginLeft: 0, marginRight: 0, paddingLeft: 0, paddingRight: 0 }}>
        {quick.map(q => (
          <button key={q} className="chip" onClick={() => send(q)}>{q}</button>
        ))}
      </div>

      {/* Composer */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 0 18px', borderTop: '1px solid var(--line)' }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(draft)}
          placeholder="What are you up for today?"
          style={{
            flex: 1, border: '1px solid var(--line)', borderRadius: 22, padding: '10px 14px',
            fontFamily: 'inherit', fontSize: 13.5, background: 'var(--bg-raised)', color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button onClick={() => send(draft)} className="btn btn-primary" style={{ padding: '0 14px', borderRadius: 22 }}>
          <TIcon name="send" size={15}/>
        </button>
      </div>
    </div>
  );
};
window.WorkoutChat = WorkoutChat;
