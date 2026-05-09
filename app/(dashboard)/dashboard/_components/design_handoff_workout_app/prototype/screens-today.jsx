// Tab screens for the workout app
const { useState: uS, useEffect: uE, useMemo: uM, useRef: uR } = React;
const M = window.MOCK;

// ─── Icons (Lucide-style outlines) ────────────────────────────
const Icon = ({ name, size = 20, stroke = 1.5, color = 'currentColor' }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home': return <svg {...props}><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>;
    case 'dumbbell': return <svg {...props}><path d="M6 4v16M3 7v10M9 10h6M15 4v16M18 7v10"/></svg>;
    case 'chart': return <svg {...props}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>;
    case 'pulse': return <svg {...props}><path d="M3 12h4l2-7 4 14 2-7h6"/></svg>;
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case 'play': return <svg {...props}><polygon points="6 4 20 12 6 20" fill={color} stroke="none"/></svg>;
    case 'check': return <svg {...props}><polyline points="4 12 10 18 20 6"/></svg>;
    case 'plus': return <svg {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'minus': return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/></svg>;
    case 'arrow-right': return <svg {...props}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 5 19 12 13 19"/></svg>;
    case 'pause': return <svg {...props}><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>;
    case 'send': return <svg {...props}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>;
    case 'sparkle': return <svg {...props}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 16l.6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6z"/></svg>;
    case 'flame': return <svg {...props}><path d="M12 2c1 4 5 5 5 10a5 5 0 1 1-10 0c0-3 2-4 2-7 1 2 2 3 3 4 0-3 0-5 0-7z"/></svg>;
    case 'moon': return <svg {...props}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>;
    case 'heart': return <svg {...props}><path d="M20.8 5.6a5.5 5.5 0 0 0-9-1.6L12 4.4l-.2-.2A5.5 5.5 0 1 0 4 12l8 8 8-8a5.5 5.5 0 0 0 .8-6.4z"/></svg>;
    case 'pill': return <svg {...props}><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-45 12 12)"/><line x1="8.5" y1="8.5" x2="15.5" y2="15.5" transform="rotate(-45 12 12)"/></svg>;
    case 'watch': return <svg {...props}><circle cx="12" cy="12" r="6"/><path d="M9 4l1-2h4l1 2M9 20l1 2h4l1-2"/></svg>;
    case 'scale': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7l-3 5h6z"/></svg>;
    case 'circle': return <svg {...props}><circle cx="12" cy="12" r="9"/></svg>;
    case 'plate': return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>;
    case 'chevron-right': return <svg {...props}><polyline points="9 6 15 12 9 18"/></svg>;
    case 'chevron-down': return <svg {...props}><polyline points="6 9 12 15 18 9"/></svg>;
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>;
    case 'message': return <svg {...props}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case 'bolt': return <svg {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
    case 'rotate': return <svg {...props}><polyline points="23 4 23 10 17 10"/><path d="M20.5 15A9 9 0 1 1 19 5.3L23 9"/></svg>;
    default: return null;
  }
};
window.Icon = Icon;

// ─── TODAY DASHBOARD ──────────────────────────────────────────
const TodayScreen = ({ onStartWorkout, onTab, onChat }) => {
  const today = M.WEEK_PLAN.find(d => d.today);
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="scroll fade-in" style={{ padding: '8px 18px 100px' }}>
      <div style={{ marginTop: 4, marginBottom: 24 }}>
        <div className="t-eyebrow">{date}</div>
        <h1 className="t-title-xl" style={{ marginTop: 6 }}>Good morning,<br/>Terry.</h1>
      </div>

      {/* Today's workout — primary card */}
      <div className="tile" style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="t-eyebrow">Today · Strength</span>
            <span className="pill pill-accent">Up next</span>
          </div>
          <div className="t-title-lg" style={{ marginBottom: 6 }}>{today.name}</div>
          <div className="t-meta">{M.TODAY_WORKOUT.exercises} exercises · {M.TODAY_WORKOUT.duration}</div>

          {/* Body diagram preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, padding: '10px 0' }}>
            <div style={{ flexShrink: 0 }}>
              <window.Body primary={['quads', 'glutes', 'hamstrings']} secondary={['calves', 'core', 'lower-back']} size={92} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="t-eyebrow" style={{ marginBottom: 6 }}>Targets</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {['Quads', 'Glutes', 'Hamstrings'].map(m => <span key={m} className="pill pill-accent">{m}</span>)}
                {['Calves', 'Core'].map(m => <span key={m} className="pill">{m}</span>)}
              </div>
              <div className="t-body" style={{ marginTop: 10, fontSize: 12.5, color: 'var(--ink-3)' }}>
                {M.TODAY_WORKOUT.rationale}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--line)' }}>
          <button className="btn btn-primary" style={{ flex: 1, borderRadius: 0, padding: '15px' }} onClick={onStartWorkout}>
            <Icon name="play" size={14}/> Start workout
          </button>
          <button onClick={onChat} style={{
            background: 'transparent', border: 'none', borderLeft: '1px solid var(--line)',
            padding: '15px 20px', cursor: 'pointer', color: 'var(--ink)',
          }}>
            <Icon name="message" size={18}/>
          </button>
        </div>
      </div>

      {/* Week strip */}
      <div className="tile-flat" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="t-eyebrow">This week</span>
          <span className="t-meta">3 of 5 done</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {M.WEEK_PLAN.map(d => (
            <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
              <div className="t-meta" style={{ fontSize: 10, marginBottom: 6 }}>{d.label}</div>
              <div style={{
                width: 32, height: 32, borderRadius: 10, margin: '0 auto',
                background: d.today ? 'var(--accent)' : d.done ? 'var(--ink)' : d.type === 'rest' ? 'transparent' : 'var(--bg-sunk)',
                border: d.today ? 'none' : d.type === 'rest' ? '1px dashed var(--line-2)' : 'none',
                color: d.today || d.done ? 'var(--bg)' : 'var(--ink-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, position: 'relative',
              }}>
                {d.done ? <Icon name="check" size={14}/> : d.type === 'cardio' ? <Icon name="pulse" size={13}/> : d.type === 'strength' ? <Icon name="dumbbell" size={13}/> : '·'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module grid: dashboard tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <button onClick={() => onTab('progress')} className="tile" style={{ textAlign: 'left', cursor: 'pointer', padding: 14, fontFamily: 'inherit', color: 'inherit' }}>
          <div className="stat-label">Weight</div>
          <div className="stat-num" style={{ marginTop: 6 }}>184.2<small>lb</small></div>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>−7.6 lb · 12 wks</div>
        </button>
        <button onClick={() => onTab('progress')} className="tile" style={{ textAlign: 'left', cursor: 'pointer', padding: 14, fontFamily: 'inherit', color: 'inherit' }}>
          <div className="stat-label">Body fat</div>
          <div className="stat-num" style={{ marginTop: 6 }}>16.8<small>%</small></div>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>−2.4 pts · 12 wks</div>
        </button>
        <div className="tile" style={{ padding: 14 }}>
          <div className="stat-label">Recovery</div>
          <div className="stat-num" style={{ marginTop: 6 }}>{M.RECOVERY.score}<small>/100</small></div>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>HRV {M.RECOVERY.hrv} · RHR {M.RECOVERY.rhr}</div>
        </div>
        <div className="tile" style={{ padding: 14 }}>
          <div className="stat-label">Sleep</div>
          <div className="stat-num" style={{ marginTop: 6 }}>7.3<small>h</small></div>
          <div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>87% efficiency</div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="tile-flat" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="t-eyebrow">Recent</span>
          <button onClick={() => onTab('train')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            All <Icon name="chevron-right" size={12}/>
          </button>
        </div>
        {M.RECENT_SESSIONS.slice(0, 3).map((s, i) => (
          <div key={i} className="row">
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
              <div className="t-meta" style={{ fontSize: 11, marginTop: 2 }}>{s.date} · {s.duration}m{s.volume ? ` · ${(s.volume / 1000).toFixed(1)}k lb` : ''}{s.distance ? ` · ${s.pace}/mi` : ''}</div>
            </div>
            <Icon name="chevron-right" size={16} color="var(--ink-4)"/>
          </div>
        ))}
      </div>
    </div>
  );
};
window.TodayScreen = TodayScreen;
