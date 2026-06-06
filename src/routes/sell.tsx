import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeIndianRupee,
  Camera,
  CheckCircle2,
  ShoppingCart,
  ImagePlus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  readSellerListings,
  writeSellerListings,
  addSellerListingToSupabase,
  syncSellerListingsWithSupabase,
  type SellerListing as UploadedListing,
} from "@/lib/seller-listings";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { addNotification } from "@/lib/notifications";

const categories = [
  "History",
  "Wildlife",
  "Culture",
  "Festivals",
  "Science",
  "Transport",
  "Military",
  "Monuments",
] as const;

const conditions = ["Mint never hinged", "Mint hinged", "Fine used", "Very fine used"] as const;

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Stamp — Stamp Safar" },
      {
        name: "description",
        content: "List your stamp for review and sell it to collectors on Stamp Safar.",
      },
    ],
  }),
  component: SellStampPage,
});

function SellStampPage() {
  const [stampName, setStampName] = useState("");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("History");
  const [condition, setCondition] = useState<(typeof conditions)[number]>("Mint hinged");
  const [price, setPrice] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState("");
  const [certificate, setCertificate] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [uploadedListings, setUploadedListings] = useState<UploadedListing[]>([]);
  const [cartItems, setCartItems] = useState<UploadedListing[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const estimate = useMemo(() => {
    const numericPrice = Number(price);
    if (!numericPrice) return "Add price for estimate";
    const low = Math.max(50, Math.round(numericPrice * 0.9));
    const high = Math.round(numericPrice * 1.15);
    return `Suggested range ₹${low.toLocaleString("en-IN")} - ₹${high.toLocaleString("en-IN")}`;
  }, [price]);

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleCertificate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCertificate(file.name);
  };

  const submitListing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const listing: UploadedListing = {
      id: `upload-${Date.now()}`,
      name: stampName.trim(),
      year: year.trim(),
      category,
      condition,
      price: Number(price),
      image: preview || "/placeholder-stamp.jpg",
      sellerName: sellerName.trim(),
      phone: phone.trim(),
      description: description.trim(),
      certificate,
      status: "Pending review",
    };

    setUploadedListings((current) => [listing, ...current]);
    await addSellerListingToSupabase(listing);
    setSubmitted(true);
    addNotification("Stamp submitted", `${listing.name} is pending expert review.`);
  };

  const addToCart = (listing: UploadedListing) => {
    setCartItems((current) =>
      current.some((item) => item.id === listing.id) ? current : [listing, ...current],
    );
    setCartOpen(true);
  };

  const removeUploadedListing = (id: string) => {
    setUploadedListings((current) => current.filter((item) => item.id !== id));
    setCartItems((current) => current.filter((item) => item.id !== id));
  };

  const removeCartItem = (id: string) => {
    setCartItems((current) => current.filter((item) => item.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    const initListings = async () => {
      if (supabase && isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const synced = await syncSellerListingsWithSupabase();
          setUploadedListings(synced);
          return;
        }
      }
      setUploadedListings(readSellerListings());
    };
    initListings();
  }, []);

  useEffect(() => {
    writeSellerListings(uploadedListings);
  }, [uploadedListings]);

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-card transition hover:border-gold"
            aria-label="Open cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItems.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-bold text-gold-foreground">
                {cartItems.length}
              </span>
            )}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={submitListing}
            className="rounded-2xl border border-border bg-card p-5 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gold/20 text-gold-foreground border border-gold/40">
                Seller Form
              </Badge>
              <Badge variant="outline" className="gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Expert review before listing
              </Badge>
            </div>

            <h1 className="mt-3 text-3xl font-semibold">Sell your stamp</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Add stamp photo, condition and price. Stamp Safar will review authenticity before it
              appears in the marketplace.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-[260px_1fr]">
              <label className="group grid min-h-72 cursor-pointer place-items-center rounded-2xl border border-dashed border-border bg-secondary/40 p-4 text-center hover:border-gold">
                {preview ? (
                  <img src={preview} alt="Stamp preview" className="max-h-64 w-full object-contain" />
                ) : (
                  <span>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-card">
                      <ImagePlus className="h-6 w-6 text-gold" />
                    </span>
                    <span className="mt-3 block text-sm font-semibold">Upload stamp photo</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      JPG, PNG or clear phone photo
                    </span>
                  </span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>

              <div className="grid gap-3">
                <input
                  value={stampName}
                  onChange={(event) => setStampName(event.target.value)}
                  placeholder="Stamp name, e.g. Gandhi commemorative stamp"
                  className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    placeholder="Year"
                    inputMode="numeric"
                    className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                    required
                  />
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Selling price ₹"
                    inputMode="numeric"
                    className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value as (typeof categories)[number])
                    }
                    className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                  >
                    {categories.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                  <select
                    value={condition}
                    onChange={(event) =>
                      setCondition(event.target.value as (typeof conditions)[number])
                    }
                    className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                  >
                    {conditions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe condition, gum, perforation, cancellation marks, certificate, etc."
                  className="min-h-28 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none focus:border-gold"
                  required
                />
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-secondary/40 px-3 py-3 text-sm hover:border-gold">
                  <span className="min-w-0">
                    <span className="block font-semibold">Certificate / proof</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {certificate || "Upload certificate, bill, or expert note"}
                    </span>
                  </span>
                  <Upload className="h-4 w-4 text-gold" />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleCertificate}
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <input
                value={sellerName}
                onChange={(event) => setSellerName(event.target.value)}
                placeholder="Your name"
                className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                required
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone / WhatsApp number"
                inputMode="tel"
                className="h-11 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                required
              />
            </div>

            {submitted && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                Listing submitted. Our team will verify your stamp and contact you before publishing.
              </div>
            )}

            <Button type="submit" size="lg" className="mt-5 w-full gap-2">
              <Upload className="h-4 w-4" />
              Submit for selling
            </Button>
          </form>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="text-xl font-semibold">Listing preview</h2>
            <div className="mt-4 rounded-xl bg-secondary/50 p-4">
              <div className="grid aspect-[4/3] place-items-center rounded-lg bg-card">
                {preview ? (
                  <img src={preview} alt="Preview" className="h-full w-full object-contain p-3" />
                ) : (
                  <Camera className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="mt-4">
                <div className="font-display text-lg font-semibold">
                  {stampName || "Your stamp name"}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {year || "Year"} · {category} · {condition}
                </div>
                <div className="mt-3 flex items-center gap-2 text-2xl font-bold">
                  <BadgeIndianRupee className="h-5 w-5 text-gold" />
                  {price ? `₹${Number(price).toLocaleString("en-IN")}` : "₹0"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{estimate}</div>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {[
                "Clear front photo improves approval chances.",
                "Mention condition honestly for better buyer trust.",
                "Stamp Safar reviews before marketplace publishing.",
              ].map((item) => (
                <div key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

          </aside>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">My uploaded stamps</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Uploaded stamps will show here after submit. Add any item to cart for checkout
                preview.
              </p>
            </div>
            <Badge variant="outline">{uploadedListings.length} uploaded</Badge>
          </div>

          {uploadedListings.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-8 text-center text-sm text-muted-foreground">
              Upload a stamp and submit it. Your stamp card will appear here.
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {uploadedListings.map((listing) => {
                const inCart = cartItems.some((item) => item.id === listing.id);

                return (
                  <article
                    key={listing.id}
                    className="rounded-xl border border-border bg-secondary/30 p-4"
                  >
                    <div className="relative grid aspect-[4/3] place-items-center rounded-lg bg-card">
                      <button
                        type="button"
                        onClick={() => removeUploadedListing(listing.id)}
                        className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-destructive shadow-sm hover:bg-destructive hover:text-destructive-foreground"
                        aria-label="Remove uploaded stamp"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {listing.image ? (
                        <img
                          src={listing.image}
                          alt={listing.name}
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <Camera className="h-9 w-9 text-muted-foreground" />
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="font-display text-lg font-semibold">{listing.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {listing.year} · {listing.category} · {listing.condition}
                      </div>
                      <Badge variant="outline" className="mt-2 border-gold/40 bg-gold/10">
                        {listing.status || "Pending review"}
                      </Badge>
                      {listing.certificate && (
                        <div className="mt-2 text-xs text-emerald-700">
                          Certificate: {listing.certificate}
                        </div>
                      )}
                      <div className="mt-2 text-xl font-bold">
                        ₹{listing.price.toLocaleString("en-IN")}
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {listing.description}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={inCart ? "outline" : "default"}
                      className="mt-4 w-full gap-2"
                      onClick={() => addToCart(listing)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {inCart ? "Added to cart" : "Add to cart"}
                    </Button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

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
                  {cartItems.length} uploaded stamp{cartItems.length === 1 ? "" : "s"} selected
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
                      Add an uploaded stamp to see it here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-border p-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-lg bg-secondary object-contain"
                        />
                      ) : (
                        <div className="grid h-20 w-20 place-items-center rounded-lg bg-secondary">
                          <Camera className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold">{item.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {item.year} · {item.category}
                        </div>
                        <div className="mt-2 font-bold">
                          ₹{item.price.toLocaleString("en-IN")}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold">₹{cartTotal.toLocaleString("en-IN")}</span>
              </div>
              <Button className="mt-4 w-full gap-2" disabled={cartItems.length === 0}>
                <ShoppingCart className="h-4 w-4" />
                Continue
              </Button>
            </div>
          </aside>
        </div>
      )}
    </SiteLayout>
  );
}
