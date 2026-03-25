import { supabase } from "./supabase";

export async function getNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);
  return data || [];
}

export async function markAsRead(id) {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllAsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
}

export function subscribeToNotifications(userId, onNew) {
  return supabase
    .channel("notifications:" + userId)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "notifications",
      filter: `user_id=eq.${userId}`,
    }, (payload) => onNew(payload.new))
    .subscribe();
}
