import { createClient } from "@/lib/supabase/server";
import { SettingsPage } from "@/components/SettingsPage";

export default async function SettingsPageRoute() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: redditToken } = await supabase
    .from("reddit_tokens")
    .select("reddit_username")
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <SettingsPage
      email={user!.email ?? ""}
      redditUsername={redditToken?.reddit_username ?? null}
    />
  );
}
