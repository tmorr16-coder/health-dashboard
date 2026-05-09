// Main App — tab nav, state, modal flows
const { useState: aS } = React;
const AIcon = window.Icon;

const App = () => {
  const [signedIn, setSignedIn] = aS(() => localStorage.getItem('wa-signed-in') || null);
  const [tab, setTab] = aS('today');
  const [active, setActive] = aS(false); // active workout overlay
  const [chat, setChat] = aS(false);     // chat overlay
  const [build, setBuild] = aS(false);   // builder overlay
  const [done, setDone] = aS(false);     // workout-complete screen
  const [customPlan, setCustomPlan] = aS(null); // {plan, muscles}

  // Tweaks
  const t = window.useTweaks(window.TWEAK_DEFAULTS);
  React.useEffect(() => {
    if (t.theme) document.documentElement.dataset.theme = t.theme;
    if (t.accent) document.documentElement.style.setProperty('--accent', t.accent);
  }, [t.theme, t.accent]);

  const goWorkout = () => { setActive(true); setChat(false); setBuild(false); setDone(false); };
  const goBuilder = () => { setBuild(true); setChat(false); setActive(false); setDone(false); };
  const startCustom = (plan, muscles) => { setCustomPlan({ plan, muscles }); setBuild(false); setActive(true); };
  const finishWorkout = () => { setActive(false); setDone(true); };

  if (!signedIn) {
    return <div className="app-root"><window.SignInScreen onSignIn={(p) => { localStorage.setItem('wa-signed-in', p); setSignedIn(p); }} /></div>;
  }

  // Completion screen
  if (done) {
    return (
      <div className="app-root fade-in">
        <div className="scroll" style={{ padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center' }}>
          <div className="t-eyebrow" style={{ marginBottom: 12 }}>Session complete</div>
          <h1 className="t-title-xl" style={{ fontSize: 56, marginBottom: 4 }}>Lower<br/>Body Power</h1>
          <div className="t-meta" style={{ marginBottom: 30 }}>54 minutes · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', marginBottom: 14 }}>
            <div className="tile" style={{ padding: 16 }}><div className="stat-label">Volume</div><div className="stat-num" style={{ marginTop: 6 }}>21,840<small>lb</small></div><div className="t-meta" style={{ fontSize: 10.5, marginTop: 4, color: 'var(--moss)' }}>+500 vs last</div></div>
            <div className="tile" style={{ padding: 16 }}><div className="stat-label">PRs</div><div className="stat-num" style={{ marginTop: 6 }}>2<small>/4</small></div><div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>Squat, Lunges</div></div>
            <div className="tile" style={{ padding: 16 }}><div className="stat-label">Avg RPE</div><div className="stat-num" style={{ marginTop: 6 }}>7.8</div><div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>Productive zone</div></div>
            <div className="tile" style={{ padding: 16 }}><div className="stat-label">Calories</div><div className="stat-num" style={{ marginTop: 6 }}>~351</div><div className="t-meta" style={{ fontSize: 10.5, marginTop: 4 }}>~6.5/min</div></div>
          </div>
          <div className="tile-flat" style={{ width: '100%', padding: 16, marginBottom: 18 }}>
            <div className="t-eyebrow" style={{ marginBottom: 8 }}>Worked today</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <window.Body primary={['quads', 'glutes', 'hamstrings']} secondary={['calves', 'core', 'lower-back']} size={80} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div className="t-body" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  You moved 500 more pounds than last session. Progressive overload is working — exactly what you want for muscle preservation.
                </div>
              </div>
            </div>
          </div>
          <button className="btn btn-primary btn-block" onClick={() => { setDone(false); setTab('today'); }}>Done</button>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="app-root">
        <window.ActiveWorkout onExit={() => setActive(false)} onComplete={finishWorkout} />
      </div>
    );
  }
  if (chat) {
    return (
      <div className="app-root">
        <window.WorkoutChat onClose={() => setChat(false)} />
      </div>
    );
  }
  if (build) {
    return (
      <div className="app-root">
        <window.BuilderScreen onClose={() => setBuild(false)} onStartWorkout={startCustom} />
      </div>
    );
  }

  let screen;
  if (tab === 'today')    screen = <window.TodayScreen onStartWorkout={goWorkout} onTab={setTab} onChat={() => setChat(true)} />;
  if (tab === 'train')    screen = <window.TrainScreen onStartWorkout={goWorkout} onBuild={goBuilder} />;
  if (tab === 'progress') screen = <window.ProgressScreen />;
  if (tab === 'health')   screen = <window.HealthScreen />;
  if (tab === 'profile')  screen = <window.ProfileScreen />;

  const TABS = [
    { k: 'today',    icon: 'home',     label: 'Today' },
    { k: 'train',    icon: 'dumbbell', label: 'Train' },
    { k: 'progress', icon: 'chart',    label: 'Progress' },
    { k: 'health',   icon: 'pulse',    label: 'Health' },
    { k: 'profile',  icon: 'user',     label: 'Profile' },
  ];

  return (
    <div className="app-root">
      {screen}
      <nav className="tabbar">
        {TABS.map(T => (
          <button key={T.k} className="tab" aria-current={tab === T.k} onClick={() => setTab(T.k)}>
            <AIcon name={T.icon} size={20} stroke={tab === T.k ? 1.8 : 1.5}/>
            <span className="tab-label">{T.label}</span>
          </button>
        ))}
      </nav>

      {/* Tweaks panel */}
      {t.__visible && (
        <window.TweaksPanel onClose={t.__close} title="Tweaks">
          <window.TweakSection label="Theme">
            <window.TweakRadio value={t.theme} onChange={v => t.setTweak('theme', v)} options={[{ value: 'light', label: 'Paper' }, { value: 'dark', label: 'Ink' }]} />
          </window.TweakSection>
          <window.TweakSection label="Accent">
            <window.TweakColor value={t.accent} onChange={v => t.setTweak('accent', v)} options={['#b84a2e', '#3a6b4d', '#2f5b8c', '#7a4a8c']} />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </div>
  );
};

window.App = App;
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
