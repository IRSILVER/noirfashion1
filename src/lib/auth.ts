import "server-only";
import { redirect } from "next/navigation";
import { getServerClient } from "./supabase/server";

/** Returns the logged-in admin, or null. Uses getUser() which verifies the token with Supabase. */
export async function getAdmin() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) return null;
  return { user, supabase };
}

/** Use at the top of every admin page and server action. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
