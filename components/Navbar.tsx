import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav style={{ borderBottom: "1px solid #2a2a3a", backgroundColor: "#0a0a0f" }}>
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="text-lg font-bold tracking-tight text-white">Pitchpilot</span>
        </Link>

        {user ? (
          <Link
            href="/dashboard"
            className="text-sm font-medium px-4 py-2 rounded-md border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium px-4 py-2 rounded-md border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
