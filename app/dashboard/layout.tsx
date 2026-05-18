import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

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
        }}
      >
        {/* Logo */}
        <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid #2a2a3a" }}>
          <Link
            href="/"
            style={{
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "1.125rem",
              textDecoration: "none",
              letterSpacing: "-0.02em",
            }}
          >
            Pitchpilot
          </Link>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "2px" }}>
          <Link
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
              backgroundColor: "rgba(139, 92, 246, 0.12)",
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/settings"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Settings
          </Link>
        </nav>

        {/* User + logout */}
        <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #2a2a3a" }}>
          <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </p>
          <form action={signOut}>
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "0.4rem 0.75rem",
                borderRadius: "0.375rem",
                border: "1px solid #374151",
                color: "#94a3b8",
                backgroundColor: "transparent",
                fontSize: "0.8125rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: "240px", flex: 1, minWidth: 0 }}>
        {children}
      </div>

    </div>
  );
}
