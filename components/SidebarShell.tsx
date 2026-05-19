"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarNav } from "./SidebarNav";
import { signOut } from "@/app/actions/auth";

function useIsMobile() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setV(mq.matches);
    const h = (e: MediaQueryListEvent) => setV(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return v;
}

export function SidebarShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const isMobile = useIsMobile();
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebarVisible = isMobile ? mobileOpen : desktopOpen;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 19,
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          minWidth: "240px",
          backgroundColor: "#111118",
          borderRight: "1px solid #2a2a3a",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 20,
          transform: sidebarVisible ? "translateX(0)" : "translateX(-240px)",
          transition: "transform 0.25s ease",
        }}
      >
        {/* Logo row */}
        <div
          style={{
            padding: "1.25rem 1.25rem",
            borderBottom: "1px solid #2a2a3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <span
              style={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1.0625rem",
                letterSpacing: "-0.02em",
              }}
            >
              Pitchpilot
            </span>
          </Link>

          {/* Desktop: collapse button */}
          {!isMobile && (
            <button
              onClick={() => setDesktopOpen(false)}
              aria-label="Collapse sidebar"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: "0.25rem",
                borderRadius: "0.25rem",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Mobile: X button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3L13 13M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <SidebarNav />

        {/* User + logout */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #2a2a3a" }}>
          <p
            style={{
              fontSize: "0.75rem",
              color: "#94a3b8",
              marginBottom: "0.75rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {email}
          </p>
          <button
            onClick={async () => { setLoggingOut(true); await signOut(); }}
            disabled={loggingOut}
            style={{
              width: "100%",
              padding: "0.4rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #374151",
              color: loggingOut ? "#64748b" : "#94a3b8",
              backgroundColor: "transparent",
              fontSize: "0.8125rem",
              cursor: loggingOut ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "color 0.15s, opacity 0.15s",
              opacity: loggingOut ? 0.6 : 1,
            }}
          >
            {loggingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>

      {/* Desktop expand button (shown when collapsed) */}
      {!isMobile && !desktopOpen && (
        <button
          onClick={() => setDesktopOpen(true)}
          aria-label="Expand sidebar"
          style={{
            position: "fixed",
            top: "1.125rem",
            left: "0.625rem",
            zIndex: 21,
            backgroundColor: "#111118",
            border: "1px solid #2a2a3a",
            borderRadius: "0.375rem",
            padding: "0.375rem",
            cursor: "pointer",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            lineHeight: 1,
            transition: "border-color 0.15s",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Main content */}
      <div
        style={{
          marginLeft: !isMobile && desktopOpen ? "240px" : "0",
          flex: 1,
          minWidth: 0,
          transition: "margin-left 0.25s ease",
        }}
      >
        {/* Mobile top bar */}
        {isMobile && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              backgroundColor: "#111118",
              borderBottom: "1px solid #2a2a3a",
              padding: "0.875rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                lineHeight: 1,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span
              style={{
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              Pitchpilot
            </span>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
