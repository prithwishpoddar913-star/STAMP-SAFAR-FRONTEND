import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type SellerListingStatus = "Pending review" | "Listed" | "Sold" | "Rejected";

export type SellerListing = {
  id: string;
  name: string;
  year: string;
  category: string;
  condition: string;
  price: number;
  image: string;
  sellerName: string;
  phone: string;
  description: string;
  certificate?: string;
  status?: SellerListingStatus;
};

const SELL_LISTINGS_KEY = "stampSafar.sellerListings";
export const SELL_LISTINGS_UPDATED_EVENT = "stampSafar:seller-listings-updated";

/**
 * Helper: get the current access token from the Supabase session.
 */
async function getAccessToken(): Promise<string> {
  if (!supabase || !isSupabaseConfigured) return "";
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  } catch {
    return "";
  }
}

/**
 * Helper: build Authorization headers using the current session token.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export function readSellerListings(): SellerListing[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(SELL_LISTINGS_KEY);
    return value ? (JSON.parse(value) as SellerListing[]) : [];
  } catch {
    return [];
  }
}

export function writeSellerListings(listings: SellerListing[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(SELL_LISTINGS_KEY, JSON.stringify(listings));
  window.dispatchEvent(new CustomEvent(SELL_LISTINGS_UPDATED_EVENT));
}

export function updateSellerListingStatus(id: string, status: SellerListingStatus) {
  writeSellerListings(
    readSellerListings().map((listing) =>
      listing.id === id ? { ...listing, status } : listing,
    ),
  );
  
  if (!supabase || !isSupabaseConfigured) return;
  
  // Also async update in Supabase in background
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    supabase
      .from("seller_listings")
      .update({ status })
      .eq("id", id)
      .eq("user_id", session.user.id)
      .then(({ error }) => {
        if (error) console.error("Error updating listing status in Supabase:", error);
      });
  });
}

export async function readSellerListingsFromSupabase(): Promise<SellerListing[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("seller_listings")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching seller listings from Supabase:", error);
      return [];
    }
    
    return data ? data.map((item: any) => ({
      id: item.id,
      name: item.name,
      year: item.year,
      category: item.category,
      condition: item.condition,
      price: Number(item.price),
      image: item.image,
      sellerName: item.seller_name,
      phone: item.phone,
      description: item.description,
      certificate: item.certificate,
      status: item.status as SellerListingStatus
    })) : [];
  } catch (err) {
    console.error("Supabase seller listings read failed:", err);
    return [];
  }
}

export async function addSellerListingToSupabase(listing: SellerListing): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from("seller_listings")
      .insert({
        id: listing.id,
        user_id: session.user.id,
        name: listing.name,
        year: listing.year,
        category: listing.category,
        condition: listing.condition,
        price: listing.price,
        image: listing.image,
        seller_name: listing.sellerName,
        phone: listing.phone,
        description: listing.description,
        certificate: listing.certificate,
        status: listing.status || "Pending review"
      });
  } catch (err) {
    console.error("Supabase seller listing save failed:", err);
  }
}

export async function syncSellerListingsWithSupabase(): Promise<SellerListing[]> {
  if (!supabase || !isSupabaseConfigured) return readSellerListings();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readSellerListings();

    const supabaseListings = await readSellerListingsFromSupabase();
    const localListings = readSellerListings();

    const mergedListingsMap = new Map<string, SellerListing>();
    
    localListings.forEach((l) => mergedListingsMap.set(l.id, l));
    supabaseListings.forEach((l) => mergedListingsMap.set(l.id, l));

    const combinedListings = Array.from(mergedListingsMap.values());
    
    window.localStorage.setItem(SELL_LISTINGS_KEY, JSON.stringify(combinedListings));
    window.dispatchEvent(new CustomEvent(SELL_LISTINGS_UPDATED_EVENT));

    const missingInSupabase = localListings.filter((ll) => !supabaseListings.some((sl) => sl.id === ll.id));
    if (missingInSupabase.length > 0) {
      const inserts = missingInSupabase.map((l) => ({
        id: l.id,
        user_id: session.user.id,
        name: l.name,
        year: l.year,
        category: l.category,
        condition: l.condition,
        price: l.price,
        image: l.image,
        seller_name: l.sellerName,
        phone: l.phone,
        description: l.description,
        certificate: l.certificate,
        status: l.status || "Pending review"
      }));
      await supabase.from("seller_listings").insert(inserts);
    }
    
    return combinedListings;
  } catch (err) {
    console.error("Seller listings sync failed:", err);
    return readSellerListings();
  }
}

/**
 * Admin: Fetch ALL seller listings from backend (requires owner token).
 * Uses the secured `/admin/listings` endpoint which bypasses RLS.
 */
export async function readAllSellerListingsFromSupabase(): Promise<SellerListing[]> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://stamp-safar-backend.onrender.com";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/listings`, { headers });
    const data = await response.json();
    if (response.ok && data.success) {
      return data.listings.map((item: any) => ({
        id: item.id,
        name: item.name,
        year: item.year,
        category: item.category,
        condition: item.condition,
        price: Number(item.price),
        image: item.image,
        sellerName: item.seller_name,
        phone: item.phone,
        description: item.description,
        certificate: item.certificate,
        status: item.status as SellerListingStatus
      }));
    }
  } catch (err) {
    console.error("Failed to fetch all seller listings from backend:", err);
  }
  return [];
}

/**
 * Admin: Update listing status via backend (requires owner token).
 * Uses the secured `/admin/update-listing` endpoint which bypasses RLS.
 */
export async function adminUpdateListingStatusInSupabase(id: string, status: SellerListingStatus): Promise<void> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://stamp-safar-backend.onrender.com";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/update-listing`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      console.error("Admin listing update failed:", data.error);
    }
  } catch (err) {
    console.error("Failed to update listing status via admin API:", err);
  }
}
