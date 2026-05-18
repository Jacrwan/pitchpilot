"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateEmail(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not authenticated." };

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return {};
}

export async function disconnectReddit(): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("reddit_tokens")
    .delete()
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return {};
}

export async function deleteAccount(): Promise<void> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("comments").delete().eq("user_id", user.id);
  await supabase.from("posts").delete().eq("user_id", user.id);
  await supabase.from("reddit_tokens").delete().eq("user_id", user.id);
  await supabase.from("startups").delete().eq("user_id", user.id);

  await admin.auth.admin.deleteUser(user.id);
  await supabase.auth.signOut();
  redirect("/");
}
