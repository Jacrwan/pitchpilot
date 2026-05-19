import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardWizard } from "@/components/DashboardWizard";
import { CommentsSection } from "@/components/CommentsSection";

const CARD = {
  backgroundColor: "#111118",
  border: "1px solid #2a2a3a",
  borderRadius: "0.75rem",
  padding: "1.5rem",
  marginBottom: "1.5rem",
} as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: redditToken },
    { data: comments },
    { data: startup },
  ] = await Promise.all([
    supabase.from("reddit_tokens").select("reddit_username").eq("user_id", user!.id).maybeSingle(),
    supabase.from("comments").select("id, post_id, reddit_comment_id, author, body, created_utc, is_read, suggested_reply, is_replied, posts(subreddit, title, reddit_url)").eq("user_id", user!.id).order("created_utc", { ascending: false }),
    supabase.from("startups").select("description").eq("user_id", user!.id).maybeSingle(),
  ]);

  return (
    <main style={{ padding: "2rem", maxWidth: "760px" }}>

      <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

      {error && (
        <p className="text-sm text-red-400 mb-6">{error}</p>
      )}

      {/* Reddit account */}
      <div style={CARD}>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Reddit account</h2>
        {redditToken ? (
          <p className="text-sm text-white">
            Connected as{" "}
            <span className="font-medium text-purple-400">u/{redditToken.reddit_username}</span>
          </p>
        ) : (
          <Link
            href="/api/auth/reddit"
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium border border-purple-500 text-purple-400 hover:bg-purple-600 hover:text-white transition-colors"
          >
            Connect Reddit
          </Link>
        )}
      </div>

      {/* Comments */}
      <div style={CARD}>
        <h2 className="text-sm font-semibold text-slate-300 mb-4">Comments</h2>
        <CommentsSection comments={comments ?? []} userId={user!.id} />
      </div>

      {/* Post wizard */}
      <div style={CARD}>
        <DashboardWizard savedDescription={startup?.description ?? ""} />
      </div>

    </main>
  );
}
