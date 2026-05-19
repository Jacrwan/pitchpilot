"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStartupDescription(description: string): Promise<{ error?: string }> {
  console.log("[saveStartupDescription] called with", description.slice(0, 40));
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("[saveStartupDescription] auth error:", authError.message);
    return { error: `Auth error: ${authError.message}` };
  }
  if (!user) {
    console.error("[saveStartupDescription] getUser() returned null — no session in server action");
    return { error: "No session — user is null" };
  }
  console.log("[saveStartupDescription] user id:", user.id);

  const { data: existing } = await supabase
    .from("startups")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("startups").update({ description: description.trim() }).eq("user_id", user.id)
    : await supabase.from("startups").insert({ user_id: user.id, name: "My Startup", description: description.trim() });

  if (error) {
    console.error("[saveStartupDescription] write error:", error.message, "code:", error.code, "details:", error.details);
    return { error: `DB error: ${error.message}` };
  }
  console.log("[saveStartupDescription] saved ok for user", user.id);
  return {};
}

export async function clearStartupDescription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("startups").delete().eq("user_id", user.id);
}
