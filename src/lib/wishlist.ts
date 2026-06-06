import type { Stamp } from "@/lib/stamps";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const WISHLIST_KEY = "stampSafar.wishlist";
export const WISHLIST_UPDATED_EVENT = "stampSafar:wishlist-updated";

export function readWishlist(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(WISHLIST_KEY);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

export function writeWishlist(ids: string[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT));
}

export function toggleWishlist(stamp: Stamp) {
  const current = readWishlist();
  const exists = current.includes(stamp.id);
  const next = exists ? current.filter((id) => id !== stamp.id) : [stamp.id, ...current];
  writeWishlist(next);
  return !exists;
}

export async function readWishlistFromSupabase(): Promise<string[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("wishlist")
      .select("stamp_id")
      .eq("user_id", session.user.id);

    if (error) {
      console.warn("Error fetching wishlist from Supabase, returning local fallback:", error);
      return [];
    }
    return data ? data.map((item: any) => item.stamp_id) : [];
  } catch (err) {
    console.error("Supabase wishlist read failed:", err);
    return [];
  }
}

export async function toggleWishlistInSupabase(stamp: Stamp): Promise<boolean> {
  const isLocalToggled = toggleWishlist(stamp);
  
  if (!supabase || !isSupabaseConfigured) return isLocalToggled;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return isLocalToggled;

    if (!isLocalToggled) {
      // It was removed
      await supabase
        .from("wishlist")
        .delete()
        .eq("user_id", session.user.id)
        .eq("stamp_id", stamp.id);
    } else {
      // It was added
      await supabase
        .from("wishlist")
        .insert({
          user_id: session.user.id,
          stamp_id: stamp.id
        });
    }
  } catch (err) {
    console.error("Supabase wishlist toggle failed:", err);
  }
  
  return isLocalToggled;
}

export async function syncWishlistWithSupabase(): Promise<string[]> {
  if (!supabase || !isSupabaseConfigured) return readWishlist();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readWishlist();

    const supabaseIds = await readWishlistFromSupabase();
    const localIds = readWishlist();

    // Union of both
    const combinedIds = Array.from(new Set([...localIds, ...supabaseIds]));
    
    // Save to local storage for quick access
    writeWishlist(combinedIds);

    // Upload any missing ones to Supabase
    const missingInSupabase = localIds.filter((id) => !supabaseIds.includes(id));
    if (missingInSupabase.length > 0) {
      const inserts = missingInSupabase.map((id) => ({
        user_id: session.user.id,
        stamp_id: id
      }));
      await supabase.from("wishlist").insert(inserts);
    }
    
    return combinedIds;
  } catch (err) {
    console.error("Wishlist sync failed:", err);
    return readWishlist();
  }
}

