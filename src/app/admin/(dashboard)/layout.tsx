import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, supabase } = await requireAdmin();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("is_seen", false);
  return <AdminShell email={user.email ?? ""} unseen={count ?? 0}>{children}</AdminShell>;
}
