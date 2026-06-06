import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { StampCard } from "@/components/StampCard";
import { stamps } from "@/lib/stamps";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Download,
  Heart,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  Upload,
  Crown,
  ShieldCheck,
  Users,
  Check,
  XCircle,
  Activity,
  CreditCard,
  QrCode,
  DollarSign,
  Search,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  readOrders,
  syncOrdersWithSupabase,
  type OrderItem,
  cancelOrderInBackend,
  returnOrderInBackend,
  readAllOrdersFromSupabase,
  adminUpdateOrderStatusInBackend,
  readPaymentSettings,
  updatePaymentSettingsInBackend,
  readAllUsersFromBackend
} from "@/lib/orders";
import { readWishlist, syncWishlistWithSupabase, WISHLIST_UPDATED_EVENT } from "@/lib/wishlist";
import {
  readSellerListings,
  syncSellerListingsWithSupabase,
  type SellerListing,
  type SellerListingStatus,
  readAllSellerListingsFromSupabase,
  adminUpdateListingStatusInSupabase,
} from "@/lib/seller-listings";
import { addAddressToSupabase, readAddresses, syncAddressesWithSupabase, type AddressItem } from "@/lib/addresses";
import { addNotification } from "@/lib/notifications";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "My Dashboard — Stamp Safar" }] }),
  component: Dashboard,
});

const trackingSteps = ["Order Placed", "Confirmed", "Packed", "Shipped", "Out for delivery", "Delivered"] as const;

function Dashboard() {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  
  // Local state variables for buyer sections
  const [savedOrders, setSavedOrders] = useState<OrderItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [sellerListings, setSellerListings] = useState<SellerListing[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressValue, setAddressValue] = useState("");
  const [openTrackingId, setOpenTrackingId] = useState<string | null>(null);
  
  // Cancellation / Returns states
  const [activeCancelOrderId, setActiveCancelOrderId] = useState<string | null>(null);
  const [activeReturnOrderId, setActiveReturnOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Admin Dashboard administrative states
  const [allListings, setAllListings] = useState<SellerListing[]>([]);
  const [adminTab, setAdminTab] = useState<'overview' | 'orders' | 'submissions' | 'upi' | 'users'>('overview');
  const [activeUsers, setActiveUsers] = useState<{ email: string; name: string; role: string; lastActive: string }[]>([]);
  
  const [adminOrders, setAdminOrders] = useState<OrderItem[]>([]);
  const [ordersSearchQuery, setOrdersSearchQuery] = useState("");
  const [adminUpiId, setAdminUpiId] = useState("8017599702@superyes");
  const [adminQrUrl, setAdminQrUrl] = useState("/upi_qr.jpg");
  const [savingUpiSettings, setSavingUpiSettings] = useState(false);
  const [upiNotice, setUpiNotice] = useState("");
  
  const [adminAnalytics, setAdminAnalytics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    paymentStats: { Paid: 0, Pending: 0, Failed: 0, Cancelled: 0 }
  });

  const isOwner = user?.email === 'prithwishpoddar913@gmail.com';
  const wishlist = stamps.filter((stamp) => wishlistIds.includes(stamp.id));
  const collection = stamps.slice(0, 4);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Collector";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Authentication check effect
  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setCheckingAuth(false);
      return;
    }

    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUser(data.user);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUser(session.user);
      setCheckingAuth(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Sync local browser data on load
  useEffect(() => {
    const syncLocalData = () => {
      setSavedOrders(readOrders());
      setWishlistIds(readWishlist());
      setSellerListings(readSellerListings());
      setAddresses(readAddresses());
    };

    syncLocalData();
    window.addEventListener(WISHLIST_UPDATED_EVENT, syncLocalData);
    window.addEventListener("storage", syncLocalData);

    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, syncLocalData);
      window.removeEventListener("storage", syncLocalData);
    };
  }, []);

  // Fetch Supabase data for customer dashboard
  useEffect(() => {
    if (!user) return;

    const syncAllWithSupabase = async () => {
      try {
        const [syncedWishlist, syncedOrders, syncedListings, syncedAddresses] = await Promise.all([
          syncWishlistWithSupabase(),
          syncOrdersWithSupabase(),
          syncSellerListingsWithSupabase(),
          syncAddressesWithSupabase()
        ]);
        
        setWishlistIds(syncedWishlist);
        setSavedOrders(syncedOrders);
        setSellerListings(syncedListings);
        setAddresses(syncedAddresses);
      } catch (err) {
        console.error("Error syncing dashboard data with Supabase:", err);
      }
    };

    syncAllWithSupabase();
  }, [user]);

  // Load Owner Admin Dashboard configurations & analytics
  useEffect(() => {
    if (!user || user.email !== "prithwishpoddar913@gmail.com") return;

    const getHeaders = async () => {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }
      return headers;
    };

    const loadAdminData = async () => {
      try {
        // 1. Fetch Listings
        const listings = await readAllSellerListingsFromSupabase();
        setAllListings(listings);

        // 2. Fetch all system orders
        const allOrders = await readAllOrdersFromSupabase();
        setAdminOrders(allOrders);

        // 3. Fetch UPI configurations
        const settings = await readPaymentSettings();
        if (settings) {
          setAdminUpiId(settings.upi_id);
          setAdminQrUrl(settings.qr_code_url);
        }

        // 4. Fetch dynamic analytics with authorization header
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const headers = await getHeaders();
        const aRes = await fetch(`${backendUrl}/admin/analytics`, { headers });
        const aData = await aRes.json();
        if (aRes.ok && aData.success) {
          setAdminAnalytics(aData.analytics);
        }

        // 5. Generate active user list merging registered users from backend with inferred mock users
        const uniqueUsersMap = new Map<string, { email: string; name: string; role: string; lastActive: string }>();

        try {
          const registeredUsers = await readAllUsersFromBackend();
          registeredUsers.forEach((u) => {
            uniqueUsersMap.set(u.email, {
              email: u.email,
              name: u.name || u.email.split("@")[0],
              role: u.role || (u.email === "prithwishpoddar913@gmail.com" ? "Owner / Administrator" : "Collector (Buyer)"),
              lastActive: u.last_sign_in_at
                ? new Date(u.last_sign_in_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Registered",
            });
          });
        } catch (err) {
          console.error("Failed to load registered users:", err);
        }

        // Ensure Owner/Admin is always present with correct display
        if (!uniqueUsersMap.has("prithwishpoddar913@gmail.com")) {
          uniqueUsersMap.set("prithwishpoddar913@gmail.com", {
            email: "prithwishpoddar913@gmail.com",
            name: "Prithwish Poddar",
            role: "Owner / Administrator",
            lastActive: "Active Now",
          });
        }

        // Inferred users from local/guest orders (e.g. mock orders)
        allOrders.forEach((o) => {
          const email = o.email || "customer@stampsafar.com";
          const namePart = email.split("@")[0];
          if (!uniqueUsersMap.has(email)) {
            uniqueUsersMap.set(email, {
              email,
              name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
              role: "Collector (Buyer)",
              lastActive: "Recent Order",
            });
          }
        });

        // Inferred users from seller listings
        listings.forEach((listing) => {
          const name = listing.sellerName || "Collector";
          const inferredEmail = `${name.toLowerCase().replace(/\s+/g, "")}@gmail.com`;
          if (!uniqueUsersMap.has(inferredEmail)) {
            uniqueUsersMap.set(inferredEmail, {
              email: inferredEmail,
              name: name,
              role: "Seller Partner",
              lastActive: "Recent Submission",
            });
          }
        });

        setActiveUsers(Array.from(uniqueUsersMap.values()));
      } catch (err) {
        console.error("Error loading admin panels:", err);
      }
    };

    loadAdminData();
  }, [user, adminTab]);

  // Admin approves or rejects listing submissions
  const handleReviewListing = async (listingId: string, action: SellerListingStatus) => {
    try {
      await adminUpdateListingStatusInSupabase(listingId, action);
      setAllListings((prev) =>
        prev.map((l) => (l.id === listingId ? { ...l, status: action } : l))
      );
      console.log(`Listing ${listingId} is marked as ${action}`);
    } catch (err) {
      console.error(`Failed reviewing listing ${listingId}:`, err);
    }
  };

  // Admin manually updates tracking steps and/or payment status
  const handleManualOrderUpdate = async (orderId: string, nextStep: any, status?: string) => {
    try {
      const success = await adminUpdateOrderStatusInBackend(orderId, nextStep, status);
      if (success) {
        // Reload all orders
        const allOrders = await readAllOrdersFromSupabase();
        setAdminOrders(allOrders);

        // Reload analytics with authorization header
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const sessionRes = supabase ? await supabase.auth.getSession() : null;
        const token = sessionRes?.data?.session?.access_token || "";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const aRes = await fetch(`${backendUrl}/admin/analytics`, { headers });
        const aData = await aRes.json();
        if (aRes.ok && aData.success) {
          setAdminAnalytics(aData.analytics);
        }
      }
    } catch (err) {
      console.error("Manual order status update failed:", err);
    }
  };

  // Admin saves UPI setup changes (ID collect and QR display URL)
  const handleSaveUpiSettings = async () => {
    setSavingUpiSettings(true);
    setUpiNotice("");
    try {
      const success = await updatePaymentSettingsInBackend(adminUpiId, adminQrUrl);
      if (success) {
        setUpiNotice("UPI configurations successfully synchronized. All checkouts will now direct payments here!");
      } else {
        setUpiNotice("Configuration sync failed. Please verify API endpoints.");
      }
    } catch (err) {
      console.error("Settings update error:", err);
      setUpiNotice("Error writing configuration settings.");
    } finally {
      setSavingUpiSettings(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const saveAddress = async () => {
    if (!addressValue.trim()) return;
    await addAddressToSupabase(addressValue);
    setAddressValue("");
    setAddresses(readAddresses());
  };

  const downloadInvoice = (order: OrderItem) => {
    const invoice = [
      "Stamp Safar Kiosk Invoice",
      `========================`,
      `Order Reference: ${order.id}`,
      `Item Purchased: ${order.item}`,
      `Date Completed: ${order.date}`,
      `Payment Method: ${order.paymentMethod}`,
      `Amount Paid: ₹${order.amount.toLocaleString("en-IN")}`,
      `Delivery Charge: ₹${order.deliveryFee || 0}`,
      `Shipping Address: ${order.address || "N/A"}`,
      `Geolocated lat: ${order.latitude || "N/A"}, lng: ${order.longitude || "N/A"}`,
      `Transaction Status: ${order.status}`,
      `========================`,
      "Thank you for shopping with Stamp Safar!",
    ].join("\n");

    const blob = new Blob([invoice], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${order.id}-invoice.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getTrackingIndex = (step: OrderItem["trackingStep"]) => {
    const index = trackingSteps.indexOf(step as any);
    return index >= 0 ? index : 0;
  };

  // Filter orders by ID, UPI ID, or Transaction ID
  const filteredAdminOrders = adminOrders.filter((o) => {
    const query = ordersSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      o.id.toLowerCase().includes(query) ||
      (o.upiId && o.upiId.toLowerCase().includes(query)) ||
      (o.razorpayPaymentId && o.razorpayPaymentId.toLowerCase().includes(query)) ||
      (o.email && o.email.toLowerCase().includes(query)) ||
      o.item.toLowerCase().includes(query)
    );
  });

  if (checkingAuth) {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 sm:px-6 py-20">
          <div className="stamp-card p-8 text-center bg-card border border-border">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent inline-block mb-2" />
            <p className="text-sm text-muted-foreground">Checking authentication status...</p>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 sm:px-6 py-20">
          <div className="stamp-card p-8 text-center max-w-xl mx-auto border border-border bg-card">
            <h1 className="text-2xl font-semibold">Connect Supabase to use the dashboard</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your Supabase URL and anon key in a local <code>.env</code> file, then restart the
              dev server.
            </p>
            <Button asChild className="mt-5">
              <Link to="/auth">Back to login</Link>
            </Button>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 sm:px-6 pt-10">
        <div className="stamp-card p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 bg-card border border-border">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground grid place-items-center text-2xl font-display font-semibold shadow-inner">
            {initials || "DS"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {user?.email} · Stamp Safar Collector
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {isOwner ? (
                <>
                  <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black border-none font-bold shadow-md shadow-amber-500/25 animate-pulse flex items-center gap-1.5 px-3 py-1">
                    <Crown className="w-3.5 h-3.5" />
                    Stamp Safar Owner
                  </Badge>
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-500" />
                    Platform Administrator
                  </Badge>
                </>
              ) : (
                <>
                  <Badge className="bg-gold/20 text-gold-foreground border border-gold/40 hover:bg-gold/25">
                    Gold Tier
                  </Badge>
                  <Badge variant="outline">Verified Seller</Badge>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full lg:w-auto">
            <Stat icon={Package} label="Collection" value="142" />
            <Stat icon={Heart} label="Wishlist" value={String(wishlist.length)} />
            <Stat icon={ShoppingBag} label="Orders" value={String(savedOrders.length)} />
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </section>

      {/* OWNER COMPREHENSIVE ADMINISTRATIVE DASHBOARD PANEL */}
      {isOwner && (
        <section className="container mx-auto px-4 sm:px-6 py-8 animate-scale-in">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-border/60 pb-5">
            <div>
              <h2 className="text-3xl font-display font-bold flex items-center gap-2">
                <Crown className="w-7 h-7 text-amber-500" />
                Owner Administrative Dashboard
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Manage transactions, update courier stages, configure payment QR settings, and oversee platform users.
              </p>
            </div>
            
            {/* Admin control panel tab selectors */}
            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-secondary/80 backdrop-blur border border-border/80">
              <button
                type="button"
                onClick={() => setAdminTab("overview")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  adminTab === "overview" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                Overview
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("orders")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  adminTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Customer Orders
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("submissions")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                  adminTab === "submissions" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Partner Submissions
                {allListings.filter((l) => l.status === "Pending review" || !l.status).length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                    {allListings.filter((l) => l.status === "Pending review" || !l.status).length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("upi")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  adminTab === "upi" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                UPI QR Setup
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("users")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  adminTab === "users" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Collectors
              </button>
            </div>
          </div>

          <div className="stamp-card p-6 min-h-[350px] bg-card border border-border">
            
            {/* TAB 1: SYSTEM OVERVIEW ANALYTICS */}
            {adminTab === "overview" && (
              <div className="grid gap-6 animate-scale-in">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <StatItem label="Total users" value={adminAnalytics.totalUsers} color="text-blue-500" icon={Users} />
                  <StatItem label="Total orders" value={adminAnalytics.totalOrders} color="text-amber-500" icon={ShoppingBag} />
                  <StatItem label="Total revenue" value={`₹${adminAnalytics.totalRevenue.toLocaleString("en-IN")}`} color="text-emerald-500" icon={DollarSign} />
                  <StatItem label="Pending orders" value={adminAnalytics.pendingOrders} color="text-purple-500" icon={Truck} />
                  <StatItem label="Shipped orders" value={adminAnalytics.shippedOrders} color="text-pink-500" icon={Truck} />
                  <StatItem label="Delivered orders" value={adminAnalytics.deliveredOrders} color="text-teal-500" icon={CheckCircle2} />
                  <StatItem label="Partner reviews" value={allListings.filter((l) => l.status === "Pending review" || !l.status).length} color="text-red-500" icon={Upload} />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-4">
                  <div className="border border-border rounded-2xl p-5 bg-secondary/15 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-gold" />
                        Transaction Statistics
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Successful Payments (Paid)</span>
                          <span className="font-bold text-emerald-500">{adminAnalytics.paymentStats.Paid} orders</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Pending verification (Pending)</span>
                          <span className="font-bold text-amber-500">{adminAnalytics.paymentStats.Pending} collect requests</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-border/40 pb-2">
                          <span className="text-muted-foreground">Failed attempts (Failed)</span>
                          <span className="font-bold text-red-500">{adminAnalytics.paymentStats.Failed} transactions</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Cancelled Orders</span>
                          <span className="font-bold text-muted-foreground">{adminAnalytics.paymentStats.Cancelled} orders</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-border rounded-2xl p-5 bg-secondary/15 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                        System Health Status
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supabase Connection: <span className="text-emerald-500 font-semibold">● Operational</span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Active Database Tables: <code className="text-amber-500 font-mono text-xs">orders, payment_settings, seller_listings, addresses</code>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Email Transporter: <span className={isSupabaseConfigured ? "text-emerald-500 font-semibold" : "text-red-500 font-semibold"}>● NodeMailer Enabled</span>
                      </p>
                    </div>
                    <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-400">
                      <strong>Automatic Sync:</strong> All courier status adjustments triggered here will immediately record to remote databases and automatically fire professional invoice/update notifications to buyers.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPREHENSIVE CUSTOMER ORDERS MANAGEMENT */}
            {adminTab === "orders" && (
              <div className="space-y-4 animate-scale-in">
                <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-3">
                  <h3 className="font-semibold text-lg">Platform Orders Ledger</h3>
                  
                  {/* Search box by order ID, VPA, Transaction ID */}
                  <div className="relative max-w-sm w-full">
                    <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      value={ordersSearchQuery}
                      onChange={(e) => setOrdersSearchQuery(e.target.value)}
                      placeholder="Search ID, UPI ID, or Transaction ID..."
                      className="h-10 pl-9 pr-4 w-full rounded-lg border border-border bg-secondary/40 text-xs focus:border-gold outline-none"
                    />
                  </div>
                </div>

                {filteredAdminOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No matching orders found in database.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-border rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-secondary/60 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-4 py-3 font-medium">Order ID</th>
                          <th className="px-4 py-3 font-medium">Customer Email</th>
                          <th className="px-4 py-3 font-medium">Item Details</th>
                          <th className="px-4 py-3 font-medium">Amount</th>
                          <th className="px-4 py-3 font-medium">Delivery Fees</th>
                          <th className="px-4 py-3 font-medium">Address Location Coordinates</th>
                          <th className="px-4 py-3 font-medium">Payment Status</th>
                          <th className="px-4 py-3 font-medium text-right">Advance Stage Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminOrders.map((o) => (
                          <tr key={o.id} className="border-t border-border hover:bg-accent/40 align-middle">
                            <td className="px-4 py-3 font-mono font-bold text-foreground">{o.id}</td>
                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{o.email || "guest@gmail.com"}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{o.item}</td>
                            <td className="px-4 py-3 font-bold text-foreground">₹{o.amount.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-muted-foreground">₹{o.deliveryFee || 0}</td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <span className="block truncate font-medium text-foreground" title={o.address}>{o.address || "N/A"}</span>
                              {o.latitude && o.longitude ? (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  🌐 {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-mono">No Map Selected</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={o.status}
                                onChange={(e) => handleManualOrderUpdate(o.id, o.trackingStep, e.target.value)}
                                className={`text-[10px] py-1 px-2 rounded-full font-bold border-none outline-none ${
                                  o.status === "Paid"
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : o.status === "Pending"
                                      ? "bg-amber-500/10 text-amber-500"
                                      : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Return Requested">Return Req</option>
                                <option value="Returned">Returned</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <select
                                value={o.trackingStep}
                                onChange={(e) => handleManualOrderUpdate(o.id, e.target.value as any)}
                                className="h-8 rounded-lg border border-border bg-card px-2 text-xs font-semibold outline-none focus:border-gold"
                              >
                                <option value="Order Placed">Order Placed</option>
                                <option value="Confirmed">Confirmed (Payment OK)</option>
                                <option value="Packed">Packed & Ready</option>
                                <option value="Shipped">Shipped (Courier)</option>
                                <option value="Out for delivery">Out for Delivery</option>
                                <option value="Delivered">Delivered (Completed)</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Return Requested">Return Requested</option>
                                <option value="Returned">Returned</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PARTNER SUBMISSIONS */}
            {adminTab === "submissions" && (
              <div className="space-y-4 animate-scale-in">
                <h3 className="font-semibold text-lg mb-3">Stamp Listing Partner Submissions</h3>
                {allListings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No submissions available in the system yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {allListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="rounded-2xl border border-border p-4 bg-secondary/10 flex flex-col md:flex-row gap-5"
                      >
                        <div className="w-32 h-32 md:w-36 md:h-36 bg-card border rounded-xl flex items-center justify-center p-2 shrink-0">
                          <img
                            src={listing.image}
                            alt={listing.name}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <h4 className="text-lg font-bold text-foreground truncate">
                                {listing.name}
                              </h4>
                              <Badge variant="outline" className="border-gold bg-gold/10">
                                {listing.status || "Pending review"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground space-x-2">
                              <span><strong>Year:</strong> {listing.year}</span>
                              <span>•</span>
                              <span><strong>Category:</strong> {listing.category}</span>
                              <span>•</span>
                              <span><strong>Condition:</strong> {listing.condition}</span>
                            </p>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {listing.description}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-3">
                            <div className="text-xs">
                              <span className="text-muted-foreground">Seller: </span>
                              <strong className="text-foreground">{listing.sellerName}</strong>
                              <span className="text-muted-foreground"> ({listing.phone})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-foreground">
                                ₹{listing.price.toLocaleString("en-IN")}
                              </span>

                              {listing.status === "Pending review" || !listing.status ? (
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleReviewListing(listing.id, "Rejected")}
                                    className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReviewListing(listing.id, "Listed")}
                                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-colors"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleReviewListing(listing.id, "Pending review")}
                                  className="text-xs text-amber-500 hover:underline"
                                >
                                  Reset Status
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: EDITABLE UPI QR SETTINGS */}
            {adminTab === "upi" && (
              <div className="max-w-xl mx-auto space-y-5 py-4 animate-scale-in">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-gold" />
                    Configure Payment Gateway QR & ID Setup
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Update the active payment credentials below. Changes will sync immediately to Supabase and reflect on the checkout screens without editing source files.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="block text-left">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Merchant UPI Address (VPA ID)</span>
                    <input
                      value={adminUpiId}
                      onChange={(e) => setAdminUpiId(e.target.value)}
                      placeholder="e.g. 8017599702@superyes"
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm outline-none focus:border-gold font-mono"
                    />
                  </label>

                  <label className="block text-left">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">UPI QR Image Asset URL</span>
                    <input
                      value={adminQrUrl}
                      onChange={(e) => setAdminQrUrl(e.target.value)}
                      placeholder="e.g. /upi_qr.jpg"
                      className="mt-2 h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 text-sm outline-none focus:border-gold font-mono"
                    />
                  </label>

                  {upiNotice && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-600 font-medium">
                      {upiNotice}
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={savingUpiSettings}
                    onClick={handleSaveUpiSettings}
                  >
                    {savingUpiSettings ? "Synchronizing Configuration..." : "Apply & Sync Payments"}
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 5: COLLECTORS DIRECTORY */}
            {adminTab === "users" && (
              <div className="animate-scale-in">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2.5">
                  <h3 className="font-semibold text-lg">Active Collectors Directory</h3>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5">
                    Live Directory
                  </Badge>
                </div>
                <div className="overflow-hidden border border-border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/60 text-left text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">User Name</th>
                        <th className="px-4 py-3 font-medium">Email Address</th>
                        <th className="px-4 py-3 font-medium">Access Authorization</th>
                        <th className="px-4 py-3 font-medium text-right">Last Action Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeUsers.map((u) => (
                        <tr key={u.email} className="border-t border-border hover:bg-accent/40">
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-primary/20 text-primary-foreground text-xs grid place-items-center font-bold">
                              {u.name[0].toUpperCase()}
                            </span>
                            {u.name}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant="outline"
                              className={
                                u.role.includes("Owner")
                                  ? "border-amber-500/50 bg-amber-500/10 text-amber-500 font-bold"
                                  : "border-border bg-secondary/50 text-muted-foreground"
                              }
                            >
                              {u.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-muted-foreground">
                            {u.lastActive === "Active Now" ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold text-xs">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                Active Now
                              </span>
                            ) : (
                              u.lastActive
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <Section title="My Collection" cta="Manage">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {collection.map((s) => (
            <StampCard key={s.id} stamp={s} />
          ))}
        </div>
      </Section>

      <Section title="Wishlist" cta="View all">
        {wishlist.length ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {wishlist.map((s) => (
              <StampCard key={s.id} stamp={s} />
            ))}
          </div>
        ) : (
          <div className="stamp-card p-8 text-center text-sm text-muted-foreground bg-card border border-border">
            No wishlist stamps yet. Tap the heart on any stamp to save it here.
          </div>
        )}
      </Section>

      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-semibold">Seller Dashboard</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/sell">Add listing</Link>
          </Button>
        </div>
        <div className="stamp-card overflow-hidden bg-card border border-border">
          {sellerListings.length ? (
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Stamp</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {sellerListings.map((listing) => (
                  <tr key={listing.id} className="border-t border-border hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">{listing.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{listing.year}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="border-gold/40 bg-gold/10">
                        {listing.status || "Pending review"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      ₹{listing.price.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <Upload className="mx-auto h-9 w-9 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                Upload a stamp from the Sell page to track partner review status here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="stamp-card p-5 bg-card border border-border">
            <h2 className="flex items-center gap-2 text-2xl font-semibold">
              <MapPin className="h-5 w-5 text-gold" />
              Address Book
            </h2>
            <textarea
              value={addressValue}
              onChange={(event) => setAddressValue(event.target.value)}
              placeholder="Add delivery address"
              className="mt-4 min-h-24 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <Button type="button" className="mt-3 w-full" onClick={saveAddress}>
              Save address
            </Button>
          </div>
          <div className="stamp-card p-5 bg-card border border-border">
            <h3 className="text-lg font-semibold">Saved addresses</h3>
            <div className="mt-3 grid gap-2">
              {addresses.length ? (
                addresses.map((address) => (
                  <div key={address.id} className="rounded-xl border border-border p-3 text-sm">
                    <div className="font-semibold">{address.label}</div>
                    <div className="mt-1 text-muted-foreground">{address.value}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No addresses saved yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED ORDER TIMELINE Lifecycle TRACKING */}
      <section className="container mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-semibold">Order History & Timeline Tracking</h2>
        </div>
        <div className="grid gap-4">
          {savedOrders.length === 0 ? (
            <div className="stamp-card p-12 text-center text-sm text-muted-foreground bg-card border border-border">
              <ShoppingBag className="mx-auto h-10 w-10 mb-2 text-muted-foreground" />
              No previous orders found. Add stamps to your collection on the marketplace!
            </div>
          ) : (
            savedOrders.map((order) => {
              const currentStepIndex = getTrackingIndex(order.trackingStep);
              const isOpen = openTrackingId === order.id;

              return (
                <article key={order.id} className="stamp-card overflow-hidden bg-card border border-border">
                  <button
                    type="button"
                    onClick={() => setOpenTrackingId(isOpen ? null : order.id)}
                    className="flex w-full flex-col gap-4 p-4 text-left md:flex-row md:items-center md:justify-between"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-foreground">{order.item}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Order ID: <span className="font-mono">{order.id}</span> · Completed {order.date}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-3">
                      <Badge
                        variant="outline"
                        className={
                          order.status === "Paid"
                            ? "border-emerald-300 bg-emerald-500/10 text-emerald-600"
                            : order.status === "Pending"
                              ? "border-amber-300 bg-amber-500/10 text-amber-600"
                              : "border-red-300 bg-red-500/10 text-red-600"
                        }
                      >
                        {order.status}
                      </Badge>
                      <span className="text-sm font-bold text-foreground">
                        ₹{order.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-primary">
                        {isOpen ? "Hide tracking timeline" : "View tracking timeline"}
                      </span>
                    </span>
                  </button>

                  <div className="border-t border-border bg-secondary/15 p-4">
                    {order.trackingStep === "Cancelled" || order.trackingStep === "Return Requested" || order.trackingStep === "Returned" ? (
                      <div className={`rounded-xl border p-4 text-center ${
                        order.trackingStep === "Cancelled"
                          ? "border-red-500/20 bg-red-500/5 text-red-600"
                          : "border-amber-500/20 bg-amber-500/5 text-amber-600"
                      }`}>
                        <span className="font-semibold block text-sm">
                          {order.trackingStep === "Cancelled"
                            ? "🚫 This order has been Cancelled."
                            : "↩️ Return Requested. Courier review under progress."}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {order.trackingStep === "Cancelled"
                            ? "Refund processes synchronize automatically. Expect credit within 5-7 business days."
                            : "Support has received your return request and will communicate shipment details soon."}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                        {trackingSteps.map((step, index) => {
                          const complete = index <= currentStepIndex;
                          const active = index === currentStepIndex;

                          return (
                            <div key={step} className="flex min-w-28 flex-1 items-center">
                              <div className="flex flex-col items-center text-center">
                                <span
                                  className={`grid h-8 w-8 place-items-center rounded-full border-2 ${
                                    complete
                                      ? "border-emerald-500 bg-emerald-500 text-white"
                                      : "border-border bg-card text-muted-foreground"
                                  } ${active ? "ring-4 ring-emerald-500/15" : ""}`}
                                >
                                  {complete ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span className="h-2 w-2 rounded-full bg-current" />
                                  )}
                                </span>
                                <span
                                  className={`mt-2 text-[10px] font-semibold tracking-tight ${
                                    complete ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {step}
                                </span>
                              </div>
                              {index < trackingSteps.length - 1 && (
                                <div
                                  className={`mx-2 h-0.5 flex-1 rounded-full ${
                                    index < currentStepIndex ? "bg-emerald-500" : "bg-border"
                                  }`}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {isOpen && (
                      <div className="mt-4 grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-3 animate-scale-in">
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Current Stage
                          </div>
                          <div className="mt-1 font-semibold text-foreground">{order.trackingStep}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                            Courier Expected Hand-Off
                          </div>
                          <div className="mt-1 font-semibold text-foreground">
                            {order.trackingStep === "Cancelled" || order.trackingStep === "Returned"
                              ? "N/A"
                              : order.trackingStep === "Delivered"
                                ? "Delivered"
                                : "Within 3-5 days"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 items-end justify-start md:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => downloadInvoice(order)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Invoice
                          </Button>

                          {(order.trackingStep === "Order Placed" || order.trackingStep === "Confirmed" || order.trackingStep === "Packed") && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveCancelOrderId(order.id);
                              }}
                            >
                              Cancel Order
                            </Button>
                          )}

                          {order.trackingStep === "Delivered" && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="bg-amber-600 hover:bg-amber-700 hover:text-white text-white border-none text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveReturnOrderId(order.id);
                              }}
                            >
                              Return Order
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {/* Cancellation Modal Overlay */}
      {activeCancelOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card animate-scale-in">
            <h3 className="text-xl font-bold text-foreground">Cancel Order</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to cancel order <strong>{activeCancelOrderId}</strong>? This action cannot be undone.
            </p>
            <label className="mt-4 block text-left">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason for cancellation (optional)</span>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, bought by mistake, wrong delivery address"
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCancelOrderId(null);
                  setCancelReason("");
                }}
                disabled={submittingAction}
              >
                Go Back
              </Button>
              <Button
                variant="destructive"
                disabled={submittingAction}
                onClick={async () => {
                  setSubmittingAction(true);
                  try {
                    const success = await cancelOrderInBackend(activeCancelOrderId, cancelReason);
                    if (success) {
                      const synced = await syncOrdersWithSupabase();
                      setSavedOrders(synced);
                    }
                  } catch (err) {
                    console.error("Error cancelling order:", err);
                  } finally {
                    setSubmittingAction(false);
                    setActiveCancelOrderId(null);
                    setCancelReason("");
                  }
                }}
              >
                {submittingAction ? "Cancelling..." : "Confirm Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal Overlay */}
      {activeReturnOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-card animate-scale-in">
            <h3 className="text-xl font-bold text-foreground">Request Return</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Request a return for order <strong>{activeReturnOrderId}</strong>. Our support team will contact you with shipment details.
            </p>
            <label className="mt-4 block text-left">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reason for return (required)</span>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. Damaged stamp, certificate missing, wrong item received"
                className="mt-2 min-h-20 w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveReturnOrderId(null);
                  setReturnReason("");
                }}
                disabled={submittingAction}
              >
                Cancel
              </Button>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                disabled={submittingAction || !returnReason.trim()}
                onClick={async () => {
                  setSubmittingAction(true);
                  try {
                    const success = await returnOrderInBackend(activeReturnOrderId, returnReason);
                    if (success) {
                      const synced = await syncOrdersWithSupabase();
                      setSavedOrders(synced);
                    }
                  } catch (err) {
                    console.error("Error returning order:", err);
                  } finally {
                    setSubmittingAction(false);
                    setActiveReturnOrderId(null);
                    setReturnReason("");
                  }
                }}
              >
                {submittingAction ? "Submitting..." : "Submit Return"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </SiteLayout>
  );
}

function Section({
  title,
  cta,
  children,
}: {
  title: string;
  cta: string;
  children: React.ReactNode;
}) {
  return (
    <section className="container mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-end justify-between mb-5">
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm">
          {cta}
        </Button>
      </div>
      {children}
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-center shadow-sm">
      <Icon className="w-4 h-4 mx-auto text-gold animate-pulse" />
      <div className="text-lg font-semibold mt-1 text-foreground">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function StatItem({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 text-center hover:bg-secondary/40 transition">
      <Icon className={`w-4 h-4 mx-auto ${color} mb-1`} />
      <div className="text-xs text-muted-foreground uppercase tracking-widest text-[9px]">{label}</div>
      <div className={`text-xl font-bold mt-1 text-foreground truncate`}>{value}</div>
    </div>
  );
}
