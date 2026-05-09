"use client";

import { createClient } from "@/lib/supabase/client";

// ── SVG brand icons ────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71C3.784 10.17 3.682 9.593 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}


async function signInWithGoogle() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px 80px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--color-ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <span style={{ fontSize: 26, color: "var(--color-bg)", lineHeight: 1 }}>◎</span>
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          marginBottom: 12,
        }}
      >
        Health Dashboard
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 42,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "var(--color-ink)",
          textAlign: "center",
          marginBottom: 10,
        }}
      >
        Your body,
        <br />
        <span style={{ color: "var(--color-accent)" }}>tracked.</span>
      </h1>

      <p
        style={{
          fontSize: 15,
          color: "var(--color-ink-3)",
          textAlign: "center",
          maxWidth: 300,
          lineHeight: 1.6,
          marginBottom: 40,
        }}
      >
        Workouts, nutrition, sleep, and AI insights — all in one place.
      </p>

      {/* Auth buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-line)",
            background: "var(--color-bg-raised)",
            color: "var(--color-ink)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            width: "100%",
          }}
        >
          <GoogleIcon />
          Continue with Google
        </button>

      </div>

      {/* Feature chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
          marginTop: 40,
          maxWidth: 340,
        }}
      >
        {["Workout Tracker", "Zepbound Doses", "Sleep & HRV", "Nutrition", "AI Coach", "Progress Feed"].map((label) => (
          <span
            key={label}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              background: "var(--color-bg-raised)",
              border: "1px solid var(--color-line)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--color-ink-3)",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <p style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 32, textAlign: "center" }}>
        Personal health data — private by default
      </p>
    </div>
  );
}
