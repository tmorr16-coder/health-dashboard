"use client";

import Link from "next/link";

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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-36.8-162.1-105.3C110.3 749.8 30 603.8 30 462c0-217.1 141.4-332 269.8-332 71.2 0 130.6 47.2 175.1 47.2 42.3 0 109.3-50.1 190.3-50.1 30.6 0 110.5 2.8 173.9 80.4zm-165.3-180.6c31.1-37.9 53.1-90.8 53.1-143.6 0-7.4-.6-14.9-1.9-21.1-50.5 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 85.3-55.1 139.3 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71z"/>
    </svg>
  );
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
          onClick={() => {
            // Supabase OAuth: configure Google provider in Supabase dashboard,
            // then replace this with: supabase.auth.signInWithOAuth({ provider: "google" })
            window.location.href = "/dashboard";
          }}
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

        {/* Apple */}
        <button
          onClick={() => {
            // Supabase OAuth: configure Apple provider in Supabase dashboard,
            // then replace this with: supabase.auth.signInWithOAuth({ provider: "apple" })
            window.location.href = "/dashboard";
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "14px 20px",
            borderRadius: 12,
            border: "none",
            background: "var(--color-ink)",
            color: "var(--color-bg)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            width: "100%",
          }}
        >
          <AppleIcon />
          Continue with Apple
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "4px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
          <span style={{ fontSize: 11, color: "var(--color-ink-4)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--color-line)" }} />
        </div>

        {/* Dev bypass — personal app, skip to dashboard directly */}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-line)",
            background: "transparent",
            color: "var(--color-ink-3)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
            textAlign: "center",
          }}
        >
          Open dashboard →
        </Link>
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
