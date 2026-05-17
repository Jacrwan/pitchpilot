"use server";

import { createClient } from "@/lib/supabase/server";

export async function markCommentsRead(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("comments")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
}
