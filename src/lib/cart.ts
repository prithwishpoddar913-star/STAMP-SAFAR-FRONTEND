import type { Stamp } from "@/lib/stamps";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  year: number | string;
  category: string;
};

const CART_KEY = "stampSafar.cart";
export const CART_UPDATED_EVENT = "stampSafar:cart-updated";
export const CART_ITEM_ADDED_EVENT = "stampSafar:cart-item-added";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(CART_KEY);
    return value ? (JSON.parse(value) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

export function addStampToCart(stamp: Stamp) {
  const item: CartItem = {
    id: stamp.id,
    name: stamp.name,
    price: stamp.price,
    image: stamp.image,
    year: stamp.year,
    category: stamp.category,
  };
  const current = readCart();
  const alreadyInCart = current.some((cartItem) => cartItem.id === item.id);
  const next = alreadyInCart ? current : [item, ...current];
  writeCart(next);
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(CART_ITEM_ADDED_EVENT, {
      detail: { item, alreadyInCart },
    }),
  );
}

export async function addStampToCartForSignedInUser(stamp: Stamp) {
  if (!supabase || !isSupabaseConfigured) return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return false;

  addStampToCart(stamp);
  return true;
}

export function removeFromCart(id: string) {
  writeCart(readCart().filter((item) => item.id !== id));
}
