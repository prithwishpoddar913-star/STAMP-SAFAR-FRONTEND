import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

const NOTIFICATIONS_KEY = "stampSafar.notifications";
export const NOTIFICATIONS_UPDATED_EVENT = "stampSafar:notifications-updated";

export function readNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(NOTIFICATIONS_KEY);
    return value ? (JSON.parse(value) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

export function writeNotifications(notifications: AppNotification[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}

export function addNotification(title: string, message: string) {
  writeNotifications([
    {
      id: `note-${Date.now()}`,
      title,
      message,
      date: new Date().toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: false,
    },
    ...readNotifications(),
  ]);
}

export function markNotificationsRead() {
  const updated = readNotifications().map((notification) => ({ ...notification, read: true }));
  writeNotifications(updated);

  // Also mark as read in Supabase
  markNotificationsReadInSupabase();
}

/**
 * Sync notifications from Supabase `notifications` table into local state.
 * Called when user is authenticated. Merges Supabase notifications with local ones.
 */
export async function syncNotificationsWithSupabase(): Promise<AppNotification[]> {
  if (!supabase || !isSupabaseConfigured) return readNotifications();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readNotifications();

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Error fetching notifications from Supabase:", error);
      return readNotifications();
    }

    if (!data || data.length === 0) return readNotifications();

    const supabaseNotifications: AppNotification[] = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      message: item.message,
      date: new Date(item.created_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }),
      read: !!item.read,
    }));

    const localNotifications = readNotifications();

    // Merge: Supabase notifications take priority, local ones fill gaps
    const mergedMap = new Map<string, AppNotification>();
    localNotifications.forEach((n) => mergedMap.set(n.id, n));
    supabaseNotifications.forEach((n) => mergedMap.set(n.id, n));

    const combined = Array.from(mergedMap.values());
    writeNotifications(combined);

    return combined;
  } catch (err) {
    console.error("Notifications sync failed:", err);
    return readNotifications();
  }
}

/**
 * Mark all notifications as read in Supabase.
 */
async function markNotificationsReadInSupabase(): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", session.user.id)
      .eq("read", false);
  } catch (err) {
    console.error("Failed to mark notifications as read in Supabase:", err);
  }
}
