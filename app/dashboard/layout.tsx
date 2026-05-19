import { createClient } from "@/lib/supabase/server";
import { SidebarShell } from "@/components/SidebarShell";

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
    <SidebarShell email={user?.email ?? ""}>
      {children}
    </SidebarShell>
  );
}
