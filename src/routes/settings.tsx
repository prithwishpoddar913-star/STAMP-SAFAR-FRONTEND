import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { addAddress, readAddresses, type AddressItem } from "@/lib/addresses";
import { applyTheme, readTheme, saveTheme, type ThemeMode } from "@/lib/theme";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Stamp Safar" },
      { name: "description", content: "Manage account, theme and preferences on Stamp Safar." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [addressValue, setAddressValue] = useState("");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "Guest collector";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const savedTheme = readTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setAddresses(readAddresses());

    if (!supabase || !isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const saveAddress = () => {
    addAddress(addressValue);
    setAddressValue("");
    setAddresses(readAddresses());
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate({ to: "/auth" });
  };

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="bg-gold/20 text-gold-foreground border border-gold/40">
              Settings
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold">Account settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage theme, profile details, addresses and alerts.
            </p>
          </div>
          {!user && (
            <Button asChild>
              <Link to="/auth">Login to manage account</Link>
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <div className="stamp-card p-5">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-xl font-semibold text-primary-foreground">
                  {initials || <User className="h-6 w-6" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-semibold">{displayName}</div>
                  <div className="truncate text-sm text-muted-foreground">
                    {user?.email || "Not signed in"}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                <InfoRow icon={Mail} label="Email" value={user?.email || "Login required"} />
                <InfoRow
                  icon={ShieldCheck}
                  label="Account"
                  value={user ? "Authenticated collector" : "Guest mode"}
                />
                <InfoRow
                  icon={Lock}
                  label="User ID"
                  value={user?.id ? `${user.id.slice(0, 8)}...` : "Unavailable"}
                />
              </div>
              {user && (
                <Button variant="outline" className="mt-4 w-full gap-2" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>

            <div className="stamp-card p-5">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <button
                type="button"
                onClick={toggleTheme}
                className="mt-4 flex w-full items-center justify-between rounded-xl border border-border bg-secondary/40 p-4 text-left transition hover:border-gold"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-card">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-gold" />
                    ) : (
                      <Sun className="h-5 w-5 text-gold" />
                    )}
                  </span>
                  <span>
                    <span className="block font-semibold">
                      {theme === "dark" ? "Dark mode" : "Light mode"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Tap to switch theme
                    </span>
                  </span>
                </span>
                <span
                  className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
                    theme === "dark" ? "justify-end bg-primary" : "justify-start bg-border"
                  }`}
                >
                  <span className="h-5 w-5 rounded-full bg-card shadow-sm" />
                </span>
              </button>
            </div>
          </aside>

          <div className="space-y-5">
            <div className="stamp-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Bell className="h-5 w-5 text-gold" />
                Notification preferences
              </h2>
              <div className="mt-4 grid gap-3">
                <PreferenceToggle
                  title="Order alerts"
                  description="Payment, COD and tracking updates."
                  checked={orderAlerts}
                  onClick={() => setOrderAlerts((value) => !value)}
                />
                <PreferenceToggle
                  title="Email updates"
                  description="Wishlist, seller upload and marketplace updates."
                  checked={emailUpdates}
                  onClick={() => setEmailUpdates((value) => !value)}
                />
              </div>
            </div>

            <div className="stamp-card p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <MapPin className="h-5 w-5 text-gold" />
                Delivery addresses
              </h2>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                <textarea
                  value={addressValue}
                  onChange={(event) => setAddressValue(event.target.value)}
                  placeholder="Add house no, area, city, pincode"
                  className="min-h-24 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <Button type="button" className="h-12 md:self-end" onClick={saveAddress}>
                  Save address
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {addresses.length ? (
                  addresses.map((address) => (
                    <div key={address.id} className="rounded-xl border border-border p-3 text-sm">
                      <div className="font-semibold">{address.label}</div>
                      <div className="mt-1 text-muted-foreground">{address.value}</div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No saved address yet.
                  </div>
                )}
              </div>
            </div>

            <div className="stamp-card p-5">
              <h2 className="text-xl font-semibold">Account actions</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/auth" search={{ recovery: "1" }}>Change password</Link>
                </Button>
                <Button asChild>
                  <Link to="/sell">Sell a stamp</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3 py-2">
      <Icon className="h-4 w-4 text-gold" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-medium">{value}</span>
      </span>
    </div>
  );
}

function PreferenceToggle({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-4 rounded-xl border border-border p-4 text-left transition hover:border-gold"
    >
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <span
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${
          checked ? "justify-end bg-primary" : "justify-start bg-border"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-card shadow-sm" />
      </span>
    </button>
  );
}
