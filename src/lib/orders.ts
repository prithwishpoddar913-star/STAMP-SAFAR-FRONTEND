import type { Stamp } from "@/lib/stamps";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export type OrderItem = {
  id: string;
  stampId: string;
  item: string;
  date: string;
  status: "Processing" | "Paid" | "COD Requested" | "Cancelled" | "Return Requested" | "Returned" | "Pending" | "Failed";
  amount: number;
  paymentMethod: string;
  trackingStep: "Order Placed" | "Confirmed" | "Packed" | "Shipped" | "Out for delivery" | "Delivered" | "Cancelled" | "Return Requested" | "Returned";
  address?: string;
  email?: string;
  latitude?: number | null;
  longitude?: number | null;
  deliveryFee?: number;
  upiId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
};

const ORDERS_KEY = "stampSafar.orders";
export const ORDERS_UPDATED_EVENT = "stampSafar:orders-updated";

/**
 * Helper: get the current access token from the Supabase session.
 * Returns empty string if no session exists.
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

export function readOrders(): OrderItem[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(ORDERS_KEY);
    return value ? (JSON.parse(value) as OrderItem[]) : [];
  } catch {
    return [];
  }
}

export function addOrder(stamp: Stamp, amount: number, paymentMethod: string, customId?: string) {
  if (typeof window === "undefined") return;

  const order: OrderItem = {
    id: customId || `SS-${Date.now().toString().slice(-6)}`,
    stampId: stamp.id,
    item: stamp.name,
    date: new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    status: paymentMethod === "cod" ? "COD Requested" : "Paid",
    amount,
    paymentMethod,
    trackingStep: paymentMethod === "cod" ? "Confirmed" : "Packed",
  };

  window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...readOrders()]));
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));
}

export async function readOrdersFromSupabase(): Promise<OrderItem[]> {
  if (!supabase || !isSupabaseConfigured) return [];
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return [];

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Error fetching orders from Supabase:", error);
      return [];
    }
    
    return data ? data.map((item: any) => ({
      id: item.id,
      stampId: item.stamp_id,
      item: item.item,
      date: item.date,
      status: item.status,
      amount: Number(item.amount),
      paymentMethod: item.payment_method,
      trackingStep: item.tracking_step
    })) : [];
  } catch (err) {
    console.error("Supabase orders read failed:", err);
    return [];
  }
}

export async function addOrderToSupabase(stamp: Stamp, amount: number, paymentMethod: string, customId?: string): Promise<string> {
  const generatedId = customId || `SS-${Date.now().toString().slice(-6)}`;
  // First save locally
  addOrder(stamp, amount, paymentMethod, generatedId);
  
  if (!supabase || !isSupabaseConfigured) return generatedId;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return generatedId;

    // Get the order we just saved locally
    const localOrders = readOrders();
    const latestOrder = localOrders.find(o => o.id === generatedId) || localOrders[0];
    if (!latestOrder) return generatedId;

    await supabase
      .from("orders")
      .insert({
        id: latestOrder.id,
        user_id: session.user.id,
        stamp_id: latestOrder.stampId,
        item: latestOrder.item,
        date: latestOrder.date,
        status: latestOrder.status,
        amount: latestOrder.amount,
        payment_method: latestOrder.paymentMethod,
        tracking_step: latestOrder.trackingStep
      });
  } catch (err) {
    console.error("Supabase order save failed:", err);
  }
  return generatedId;
}

export async function syncOrdersWithSupabase(): Promise<OrderItem[]> {
  if (!supabase || !isSupabaseConfigured) return readOrders();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readOrders();

    const supabaseOrders = await readOrdersFromSupabase();
    const localOrders = readOrders();

    // Merge by order ID
    const mergedOrdersMap = new Map<string, OrderItem>();
    
    // Add local ones first
    localOrders.forEach((o) => mergedOrdersMap.set(o.id, o));
    // Overwrite/add with Supabase ones
    supabaseOrders.forEach((o) => mergedOrdersMap.set(o.id, o));

    const combinedOrders = Array.from(mergedOrdersMap.values());
    
    // Save to local storage for quick access
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(combinedOrders));
    window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));

    // Upload local orders that are missing in Supabase
    const missingInSupabase = localOrders.filter((lo) => !supabaseOrders.some((so) => so.id === lo.id));
    if (missingInSupabase.length > 0) {
      const inserts = missingInSupabase.map((o) => ({
        id: o.id,
        user_id: session.user.id,
        stamp_id: o.stampId,
        item: o.item,
        date: o.date,
        status: o.status,
        amount: o.amount,
        payment_method: o.paymentMethod,
        tracking_step: o.trackingStep
      }));
      await supabase.from("orders").insert(inserts);
    }
    
    return combinedOrders;
  } catch (err) {
    console.error("Orders sync failed:", err);
    return readOrders();
  }
}

export async function cancelOrderInBackend(orderId: string, reason: string): Promise<boolean> {
  // Update locally first for instant feedback (or fallback)
  const localOrders = readOrders();
  const updatedOrders = localOrders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        status: "Cancelled" as const,
        trackingStep: "Cancelled" as const,
      };
    }
    return o;
  });
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));

  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/cancel-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ orderId, reason }),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (err) {
    console.error("Failed to cancel order on backend:", err);
    // If backend fails but Supabase is connected, update Supabase directly
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: "Cancelled", tracking_step: "Cancelled" })
          .eq("id", orderId);
        return !error;
      } catch (dbErr) {
        console.error("Direct Supabase update failed:", dbErr);
      }
    }
    return true; // Return true as local state has been updated
  }
}

export async function returnOrderInBackend(orderId: string, reason: string): Promise<boolean> {
  // Update locally first for instant feedback (or fallback)
  const localOrders = readOrders();
  const updatedOrders = localOrders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        status: "Return Requested" as const,
        trackingStep: "Return Requested" as const,
      };
    }
    return o;
  });
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT));

  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/return-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ orderId, reason }),
    });

    const data = await response.json();
    return response.ok && data.success;
  } catch (err) {
    console.error("Failed to return order on backend:", err);
    // If backend fails but Supabase is connected, update Supabase directly
    if (supabase && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from("orders")
          .update({ status: "Return Requested", tracking_step: "Return Requested" })
          .eq("id", orderId);
        return !error;
      } catch (dbErr) {
        console.error("Direct Supabase update failed:", dbErr);
      }
    }
    return true; // Return true as local state has been updated
  }
}

/**
 * Admin: Fetch ALL orders from backend (requires owner token).
 */
export async function readAllOrdersFromSupabase(): Promise<OrderItem[]> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/orders`, { headers });
    const data = await response.json();
    if (response.ok && data.success) {
      return data.orders.map((item: any) => ({
        id: item.id,
        stampId: item.stamp_id,
        item: item.item,
        date: item.date,
        status: item.status,
        amount: Number(item.amount),
        paymentMethod: item.payment_method,
        trackingStep: item.tracking_step,
        address: item.address || "",
        email: item.email || "",
        latitude: item.latitude ? Number(item.latitude) : null,
        longitude: item.longitude ? Number(item.longitude) : null,
        deliveryFee: item.delivery_fee ? Number(item.delivery_fee) : 0,
        upiId: item.upi_id || "",
        razorpayPaymentId: item.razorpay_payment_id || "",
        razorpayOrderId: item.razorpay_order_id || ""
      }));
    }
  } catch (err) {
    console.error("Failed to read all orders from backend:", err);
  }
  return [];
}

/**
 * Admin: Update order tracking step and/or status (requires owner token).
 */
export async function adminUpdateOrderStatusInBackend(
  orderId: string,
  trackingStep: string,
  status?: string
): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/update-order`, {
      method: "POST",
      headers,
      body: JSON.stringify({ orderId, trackingStep, status }),
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch (err) {
    console.error("Failed to update order status via admin API:", err);
    return false;
  }
}

export async function readPaymentSettings(): Promise<{ upi_id: string; qr_code_url: string }> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const response = await fetch(`${backendUrl}/payment-settings`);
    const data = await response.json();
    if (response.ok && data.success) {
      return data.settings;
    }
  } catch (err) {
    console.error("Failed to fetch payment settings:", err);
  }
  return {
    upi_id: "8017599702@superyes",
    qr_code_url: "/upi_qr.jpg",
  };
}

/**
 * Admin: Update UPI payment settings (requires owner token).
 */
export async function updatePaymentSettingsInBackend(upiId: string, qrCodeUrl: string): Promise<boolean> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/update-settings`, {
      method: "POST",
      headers,
      body: JSON.stringify({ upiId, qrCodeUrl }),
    });
    const data = await response.json();
    return response.ok && data.success;
  } catch (err) {
    console.error("Failed to update payment settings in backend:", err);
    return false;
  }
}

/**
 * Admin: Fetch registered users from backend (requires owner token).
 */
export async function readAllUsersFromBackend(): Promise<
  { id: string; email: string; name: string; role: string; created_at: string; last_sign_in_at: string }[]
> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const headers = await authHeaders();
    const response = await fetch(`${backendUrl}/admin/users`, { headers });
    const data = await response.json();
    if (response.ok && data.success) {
      return data.users;
    }
  } catch (err) {
    console.error("Failed to fetch users from backend:", err);
  }
  return [];
}
