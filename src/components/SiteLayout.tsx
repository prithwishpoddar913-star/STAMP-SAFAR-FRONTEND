 import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  User,
  Mail,
  MapPin,
  Phone,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Settings,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FloatingDakBot } from "@/components/FloatingDakBot";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  CART_ITEM_ADDED_EVENT,
  CART_UPDATED_EVENT,
  readCart,
  removeFromCart,
  type CartItem,
} from "@/lib/cart";
import {
  markNotificationsRead,
  NOTIFICATIONS_UPDATED_EVENT,
  readNotifications,
  type AppNotification,
  syncNotificationsWithSupabase,
} from "@/lib/notifications";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { applyTheme, readTheme } from "@/lib/theme";

const nav = [
  { to: "/", label: "Home" },
  { to: "/stamps", label: "Explore" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/recommendation", label: "Recommendation" },
  { to: "/sell", label: "Sell" },
  { to: "/ai", label: "AI Tools" },
  { to: "/dashboard", label: "Dashboard" },
  
] as const;
const brandLogo = "/stamp-safar-logo.jpeg";

export function SiteLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [cartToast, setCartToast] = useState<{
    item: CartItem;
    alreadyInCart: boolean;
    key: number;
  } | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Collector";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ||
    (user?.user_metadata?.picture as string | undefined);
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    applyTheme(readTheme());
  }, []);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (active) setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      syncNotificationsWithSupabase();
    }
  }, [user]);

  useEffect(() => {
    const syncNotifications = () => setNotifications(readNotifications());
    syncNotifications();
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
    window.addEventListener("storage", syncNotifications);

    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, syncNotifications);
      window.removeEventListener("storage", syncNotifications);
    };
  }, []);

  useEffect(() => {
    const syncCart = () => setCartItems(readCart());
    const showCartFeedback = (event: Event) => {
      const detail = (event as CustomEvent<{ item: CartItem; alreadyInCart: boolean }>).detail;
      if (!detail?.item) return;

      setCartPulse(false);
      window.setTimeout(() => setCartPulse(true), 0);
      setCartToast({ ...detail, key: Date.now() });
      window.setTimeout(() => setCartPulse(false), 650);
    };

    syncCart();
    window.addEventListener(CART_UPDATED_EVENT, syncCart);
    window.addEventListener(CART_ITEM_ADDED_EVENT, showCartFeedback);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCart);
      window.removeEventListener(CART_ITEM_ADDED_EVENT, showCartFeedback);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    if (!cartToast) return;

    const timeout = window.setTimeout(() => setCartToast(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [cartToast]);

  const signOut = async () => {
    setProfileOpen(false);
    setOpen(false);
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate({ to: "/auth" });
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
  const unreadNotifications = notifications.filter((notification) => !notification.read).length;
  const cartProtectionFee = cartItems.length ? Math.max(25, Math.round(cartTotal * 0.03)) : 0;
  const cartDeliveryFee = cartItems.length && cartTotal < 1000 ? 49 : 0;
  const cartGrandTotal = cartTotal + cartProtectionFee + cartDeliveryFee;
  const checkoutItem = cartItems[0];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container mx-auto px-4 sm:px-6 h-18 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-11 w-11 overflow-hidden rounded-full border border-gold/50 bg-card shadow-soft transition-transform duration-300 group-hover:scale-105">
              <img
                src={brandLogo}
                alt="Stamp Safar logo"
                className="h-full w-full object-cover"
                width={44}
                height={44}
              />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-semibold">
                Stamp <span className="gold-gradient-text">Safar</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                National Philately
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {nav.map((n) => {
              const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    active
                      ? "text-foreground bg-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden md:flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((value) => !value);
                  markNotificationsRead();
                }}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-card transition hover:border-gold hover:bg-gold/10"
                aria-label="Open notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                  <div className="border-b border-border px-4 py-3 font-semibold">
                    Notifications
                  </div>
                  {notifications.length ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="border-b border-border px-4 py-3">
                          <div className="text-sm font-semibold">{notification.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {notification.message}
                          </div>
                          <div className="mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                            {notification.date}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No notifications yet.
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={`relative inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-gold/25 ${
                cartPulse ? "animate-cart-pop" : ""
              }`}
              aria-label="Open cart"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {cartItems.length}
              </span>
            </button>
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((value) => !value)}
                  className="h-11 w-11 overflow-hidden rounded-full border-2 border-gold/70 bg-secondary shadow-soft transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/40"
                  aria-label="Open account menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center bg-primary text-sm font-semibold text-primary-foreground">
                      {initials || <User className="h-4 w-4" />}
                    </span>
                  )}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-14 w-64 rounded-xl border border-border bg-card p-2 shadow-xl">
                    <div className="px-3 py-2">
                      <div className="text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <Link
                      to="/dashboard"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={signOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="gap-2">
                  <Link to="/auth">
                    <User className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary/85 text-primary-foreground hover:opacity-95"
                >
                  <Link to="/auth">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="lg:hidden ml-auto p-2 rounded-md hover:bg-accent"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md text-sm hover:bg-accent"
                >
                  {n.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCartOpen(true);
                  setOpen(false);
                }}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                <span className="inline-flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Cart
                </span>
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                  {cartItems.length}
                </span>
              </button>
              {user ? (
                <div className="pt-2">
                  <div className="mb-2 flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-gold/60 bg-primary text-primary-foreground">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center text-sm font-semibold">
                          {initials || "DS"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{displayName}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={signOut}>
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/auth" onClick={() => setOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
      <FloatingDakBot />
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className={`fixed bottom-5 left-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-gold/50 bg-card px-4 text-sm font-semibold shadow-xl transition hover:bg-gold/10 ${
          cartPulse ? "animate-cart-pop" : ""
        }`}
        aria-label="Open cart"
      >
        <ShoppingCart className="h-5 w-5 text-gold" />
        <span>Cart</span>
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
          {cartItems.length}
        </span>
      </button>
      {cartToast && (
        <div
          key={cartToast.key}
          className="fixed bottom-20 left-5 z-50 flex w-[min(22rem,calc(100vw-2.5rem))] items-center gap-3 rounded-2xl border border-gold/40 bg-card p-3 shadow-2xl animate-cart-toast"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
            <img
              src={cartToast.item.image}
              alt={cartToast.item.name}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">
              {cartToast.alreadyInCart ? "Already in cart" : "Added to cart"}
            </div>
            <div className="truncate text-xs text-muted-foreground">{cartToast.item.name}</div>
          </div>
          <span className="rounded-full bg-gold/20 px-2 py-1 text-xs font-bold text-gold-foreground">
            ₹{cartToast.item.price.toLocaleString("en-IN")}
          </span>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <ShoppingCart className="h-5 w-5 text-gold" />
                  Cart
                </h2>
                <p className="text-xs text-muted-foreground">
                  {cartItems.length} stamp{cartItems.length === 1 ? "" : "s"} selected
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-accent"
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="grid h-full place-items-center rounded-xl border border-dashed border-border bg-secondary/40 p-6 text-center">
                  <div>
                    <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground" />
                    <div className="mt-3 font-semibold">Cart is empty</div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add any stamp to see it here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-border p-3">
                      <Link
                        to="/stamps/$stampId"
                        params={{ stampId: item.id }}
                        onClick={() => setCartOpen(false)}
                        className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-secondary transition hover:ring-2 hover:ring-gold/50"
                        aria-label={`View details for ${item.name}`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/stamps/$stampId"
                          params={{ stampId: item.id }}
                          onClick={() => setCartOpen(false)}
                          className="block truncate font-semibold transition hover:text-primary"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.year} · {item.category}
                        </div>
                        <div className="mt-2 font-bold">
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <Link
                            to="/stamps/$stampId"
                            params={{ stampId: item.id }}
                            onClick={() => setCartOpen(false)}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View info
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="space-y-2 rounded-xl bg-secondary/40 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Protection fee</span>
                  <span>₹{cartProtectionFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{cartDeliveryFee ? `₹${cartDeliveryFee}` : "Free"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2 font-bold">
                  <span>Total</span>
                  <span>₹{cartGrandTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
              {checkoutItem ? (
                <Button asChild className="mt-4 w-full gap-2">
                  <Link
                    to="/stamps/$stampId/buy"
                    params={{ stampId: checkoutItem.id }}
                    onClick={() => setCartOpen(false)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Checkout
                  </Link>
                </Button>
              ) : (
                <Button className="mt-4 w-full gap-2" disabled>
                  <ShoppingCart className="h-4 w-4" />
                  Checkout
                </Button>
              )}
            </div>
          </aside>
        </div>
      )}

      <footer className="mt-24 border-t border-border bg-secondary/40">
        <div className="container mx-auto px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 overflow-hidden rounded-full border border-gold/50 bg-card">
                <img
                  src={brandLogo}
                  alt="Stamp Safar logo"
                  className="h-full w-full object-cover"
                  width={36}
                  height={36}
                />
              </div>
              <span className="font-display text-lg font-semibold">Stamp Safar</span>
            </div>
            <p className="text-sm text-muted-foreground">
              India's premier platform for discovering, collecting and trading philatelic treasures.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/stamps" className="hover:text-foreground">
                  All Stamps
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-foreground">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link to="/ai" className="hover:text-foreground">
                  AI Tools
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-foreground">
                  My Dashboard
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>About</li>
              <li>Press</li>
              <li>Careers</li>
              <li>Privacy</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                prithwishpoddar913@gmail.com / aranyakdas32@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                +91 7980797454 / +91 9073422859
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Stamp Safar, Kolkata, West Bengal
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 py-4 text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span>© {new Date().getFullYear()} Stamp Safar. All rights reserved.</span>
            <span>Made with care for collectors across India.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}  