// Sign-in screen with SSO providers
const SignInScreen = ({ onSignIn }) => {
  const [loading, setLoading] = React.useState(null);

  const handle = (provider) => {
    setLoading(provider);
    setTimeout(() => onSignIn(provider), 700);
  };

  const Provider = ({ id, label, bg, fg, border, logo }) => (
    <button
      disabled={loading}
      onClick={() => handle(id)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        background: bg, color: fg, border: border || 'none',
        borderRadius: 12, padding: '14px 16px', fontSize: 15, fontWeight: 500,
        cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
        opacity: loading && loading !== id ? 0.4 : 1,
        transition: 'opacity 0.2s, transform 0.1s',
      }}>
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {logo}
      </span>
      <span style={{ flex: 1, textAlign: 'left' }}>
        {loading === id ? 'Signing in…' : label}
      </span>
    </button>
  );

  // SSO logos as inline SVGs
  const googleLogo = (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.61z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  );
  const fbLogo = (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#1877F2" d="M18 9a9 9 0 1 0-10.4 8.9v-6.3H5.3V9h2.3V7c0-2.3 1.4-3.5 3.4-3.5 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4V9h2.5l-.4 2.6h-2.1v6.3A9 9 0 0 0 18 9z"/>
    </svg>
  );
  const msLogo = (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <rect width="8" height="8" fill="#F25022"/>
      <rect x="10" width="8" height="8" fill="#7FBA00"/>
      <rect y="10" width="8" height="8" fill="#00A4EF"/>
      <rect x="10" y="10" width="8" height="8" fill="#FFB900"/>
    </svg>
  );

  return (
    <div className="phone-bg fade-in" style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      padding: '60px 28px 40px', boxSizing: 'border-box', position: 'relative',
    }}>
      {/* Brand mark */}
      <div style={{ marginBottom: 'auto' }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, background: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4v16M3 7v10M9 10h6M15 4v16M18 7v10"/>
          </svg>
        </div>
        <div className="t-eyebrow" style={{ marginBottom: 8 }}>Workout</div>
        <h1 className="t-title-xl" style={{ margin: 0, fontSize: 38, lineHeight: 1.05 }}>
          Train with<br/>intention.
        </h1>
        <p style={{ marginTop: 16, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.5, maxWidth: 280 }}>
          Plan, log, and track every set. Built around your body, your meds, your day.
        </p>
      </div>

      {/* Free badge */}
      <div style={{
        display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8,
        background: 'var(--moss)', color: '#fff', padding: '6px 12px', borderRadius: 999,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
        marginBottom: 18,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 12 10 18 20 6"/>
        </svg>
        Free forever · No credit card
      </div>

      {/* SSO providers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Provider id="google"    label="Continue with Google"    bg="#fff"      fg="#1f1f1f" border="1px solid #dadce0" logo={googleLogo}/>
        <Provider id="microsoft" label="Continue with Microsoft" bg="#fff"      fg="#1f1f1f" border="1px solid #dadce0" logo={msLogo}/>
        <Provider id="facebook"  label="Continue with Facebook"  bg="#1877F2"   fg="#fff"                             logo={fbLogo}/>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 18, fontSize: 11, color: 'var(--ink-3)', textAlign: 'center', lineHeight: 1.5 }}>
        By continuing, you agree to our <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Terms</span> and <span style={{ color: 'var(--ink-2)', textDecoration: 'underline' }}>Privacy Policy</span>.
        <br/>
        We never sell your health data.
      </div>
    </div>
  );
};
window.SignInScreen = SignInScreen;
