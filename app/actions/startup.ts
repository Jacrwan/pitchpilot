"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveStartupDescription(description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("startups").upsert(
    { user_id: user.id, description: description.trim(), updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function clearStartupDescription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("startups").delete().eq("user_id", user.id);
}
