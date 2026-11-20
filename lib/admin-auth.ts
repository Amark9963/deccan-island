import { getSupabaseServer } from "@/lib/supabase-server";
export async function requireAdmin() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id,display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  return { supabase, user, isAdmin: Boolean(admin), admin };
}
