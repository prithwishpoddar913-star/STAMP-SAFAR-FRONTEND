import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type AddressItem = {
  id: string;
  label: string;
  value: string;
};

const ADDRESSES_KEY = "stampSafar.addresses";

export function readAddresses(): AddressItem[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(ADDRESSES_KEY);
    return value ? (JSON.parse(value) as AddressItem[]) : [];
  } catch {
    return [];
  }
}

export function addAddress(value: string) {
  if (typeof window === "undefined" || !value.trim()) return;

  const next: AddressItem = {
    id: `address-${Date.now()}`,
    label: `Address ${readAddresses().length + 1}`,
    value: value.trim(),
  };

  window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify([next, ...readAddresses()]));
}

export async function readAddressesFromSupabase(): Promise<AddressItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching addresses from Supabase:", error);
      return [];
    }
    
    return data ? data.map((item: any) => ({
      id: item.id,
      label: item.label,
      value: item.value
    })) : [];
  } catch (err) {
    console.error("Supabase addresses read failed:", err);
    return [];
  }
}

export async function addAddressToSupabase(value: string): Promise<void> {
  addAddress(value);
  
  if (!supabase || !isSupabaseConfigured) return;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    const localAddresses = readAddresses();
    const latestAddress = localAddresses[0];
    if (!latestAddress) return;

    await supabase
      .from("addresses")
      .insert({
        id: latestAddress.id,
        user_id: session.user.id,
        label: latestAddress.label,
        value: latestAddress.value
      });
  } catch (err) {
    console.error("Supabase address save failed:", err);
  }
}

export async function syncAddressesWithSupabase(): Promise<AddressItem[]> {
  if (!supabase || !isSupabaseConfigured) return readAddresses();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readAddresses();

    const supabaseAddresses = await readAddressesFromSupabase();
    const localAddresses = readAddresses();

    const mergedAddressesMap = new Map<string, AddressItem>();
    
    localAddresses.forEach((a) => mergedAddressesMap.set(a.id, a));
    supabaseAddresses.forEach((a) => mergedAddressesMap.set(a.id, a));

    const combinedAddresses = Array.from(mergedAddressesMap.values());
    
    window.localStorage.setItem(ADDRESSES_KEY, JSON.stringify(combinedAddresses));

    const missingInSupabase = localAddresses.filter((la) => !supabaseAddresses.some((sa) => sa.id === la.id));
    if (missingInSupabase.length > 0) {
      const inserts = missingInSupabase.map((a) => ({
        id: a.id,
        user_id: session.user.id,
        label: a.label,
        value: a.value
      }));
      await supabase.from("addresses").insert(inserts);
    }
    
    return combinedAddresses;
  } catch (err) {
    console.error("Addresses sync failed:", err);
    return readAddresses();
  }
}

