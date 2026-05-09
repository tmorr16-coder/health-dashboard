"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Today",    href: "/dashboard" },
  { label: "Train",    href: "/dashboard/train" },
  { label: "Eat",      href: "/dashboard/nutrition" },
  { label: "Health",   href: "/dashboard/medications" },
  { label: "Profile",  href: "/dashboard/profile" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: "var(--color-bg-raised)",
        borderTop: "1px solid var(--color-line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
      }}
    >
      {TABS.map(({ label, href }) => {
        const isActive =
          href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              textDecoration: "none",
              color: isActive ? "var(--color-accent)" : "var(--color-ink-3)",
              flex: 1,
              padding: "8px 0",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: isActive ? "var(--color-accent)" : "transparent",
              }}
            />
          </Link>
        );
      })}
    </nav>
  );
}
