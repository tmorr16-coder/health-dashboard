"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function NoAccessPage() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });
  }, []);

  async function handleSignOut() {
    await createClient().auth.signOut();
    window.location.href = "/";
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "var(--font-sans)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "var(--color-bg-raised)",
          border: "1px solid var(--color-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          marginBottom: 24,
        }}
      >
        🔒
      </div>

      <div
        style={{
          fontSize: 10,
          fontWeight: 500,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-ink-3)",
          marginBottom: 10,
        }}
      >
        Access not granted
      </div>

      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 36,
          fontWeight: 400,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          color: "var(--color-ink)",
          marginBottom: 12,
        }}
      >
        No access to
        <br />
        Health.
      </h1>

      <p
        style={{
          fontSize: 14,
          color: "var(--color-ink-3)",
          maxWidth: 320,
          lineHeight: 1.6,
          marginBottom: 8,
        }}
      >
        Your account isn&apos;t enabled for the Health app. An admin can grant access from the platform admin panel.
      </p>

      {email && (
        <p style={{ fontSize: 12, color: "var(--color-ink-4)", marginBottom: 24 }}>
          Signed in as <strong style={{ color: "var(--color-ink-3)" }}>{email}</strong>
        </p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <a
          href="https://morrisai.family"
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-line)",
            background: "var(--color-bg-raised)",
            color: "var(--color-ink-2)",
            fontSize: 14,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Back to morrisai.family
        </a>
        <button
          onClick={handleSignOut}
          style={{
            padding: "12px 20px",
            borderRadius: 12,
            border: "1px solid var(--color-line)",
            background: "transparent",
            color: "var(--color-ink-3)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
