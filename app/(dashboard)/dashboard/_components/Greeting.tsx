"use client";

export default function Greeting({ name }: { name: string | null }) {
  const h = new Date().getHours();
  const salutation =
    h < 12 ? "Good morning" :
    h < 17 ? "Good afternoon" :
             "Good evening";

  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontSize: 34,
        fontWeight: 400,
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
      }}
    >
      {salutation},<br />
      <span style={{ color: "var(--color-accent)" }}>{name ?? "there"}.</span>
    </div>
  );
}
