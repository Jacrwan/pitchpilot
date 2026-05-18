"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINK_BASE = {
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  textDecoration: "none",
  fontSize: "0.875rem",
  fontWeight: 500,
} as const;

const ACTIVE = {
  ...LINK_BASE,
  color: "#ffffff",
  backgroundColor: "rgba(139, 92, 246, 0.12)",
} as const;

const INACTIVE = {
  ...LINK_BASE,
  color: "#94a3b8",
} as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
      <Link href="/dashboard" style={pathname === "/dashboard" ? ACTIVE : INACTIVE}>
        Dashboard
      </Link>
      <Link href="/dashboard/settings" style={pathname === "/dashboard/settings" ? ACTIVE : INACTIVE}>
        Settings
      </Link>
    </nav>
  );
}
