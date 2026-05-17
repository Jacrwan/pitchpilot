import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mb-8">
          Logged in as {user?.email}
        </p>
        <form action={signOut}>
          <Button variant="outline" type="submit">
            Log out
          </Button>
        </form>
      </div>
    </main>
  );
}
