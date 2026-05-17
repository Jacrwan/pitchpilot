import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/SubmitButton";
import { DashboardWizard } from "@/components/DashboardWizard";
import { CommentsSection } from "@/components/CommentsSection";

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

  const { data: redditToken } = await supabase
    .from("reddit_tokens")
    .select("reddit_username")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { data: comments } = await supabase
    .from("comments")
    .select("id, post_id, reddit_comment_id, author, body, created_utc, is_read, suggested_reply, is_replied, posts(subreddit, title, reddit_url)")
    .eq("user_id", user!.id)
    .order("created_utc", { ascending: false });

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          {user?.email}
        </p>

        {error && (
          <p className="mb-6 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
            Reddit account
          </h2>
          {redditToken ? (
            <p className="text-sm text-zinc-900 dark:text-zinc-50">
              Connected as{" "}
              <span className="font-medium">u/{redditToken.reddit_username}</span>
            </p>
          ) : (
            <Button asChild>
              <Link href="/api/auth/reddit">Connect Reddit</Link>
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
            Comments
          </h2>
          <CommentsSection comments={comments ?? []} userId={user!.id} />
        </div>

        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 mb-6">
          <DashboardWizard />
        </div>

        <form action={signOut}>
          <SubmitButton label="Log out" pendingLabel="Logging out…" />
        </form>
      </div>
    </main>
  );
}
