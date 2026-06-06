import {
  Outlet,
  createFileRoute,
  Link,
  notFound,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  IndianRupee,
  MapPin,
  MessageSquareText,
  PackageCheck,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StampCard } from "@/components/StampCard";
import { getStamp, stamps } from "@/lib/stamps";
import { addStampToCartForSignedInUser } from "@/lib/cart";
import { readWishlist, toggleWishlistInSupabase } from "@/lib/wishlist";

const stampDetailSearchSchema = z.object({
  mode: fallback(z.enum(["buy", "details"]), "details").default("details"),
});

type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  date: string;
};

const defaultReviews: Review[] = [
  {
    id: "r1",
    name: "Amit Roy",
    rating: 5,
    text: "Stamp arrived safely packed and matched the photos. Good condition for a collector display.",
    date: "12 May 2026",
  },
  {
    id: "r2",
    name: "Nisha Mehta",
    rating: 4,
    text: "Nice verified piece. Seller shared clear details before dispatch.",
    date: "4 May 2026",
  },
];

export const Route = createFileRoute("/stamps/$stampId")({
  validateSearch: zodValidator(stampDetailSearchSchema),
  loader: ({ params }) => {
    const stamp = getStamp(params.stampId);
    if (!stamp) throw notFound();
    return { stamp };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.stamp.name} (${loaderData?.stamp.year}) — Stamp Safar` },
      { name: "description", content: loaderData?.stamp.description ?? "Stamp detail" },
      { property: "og:title", content: loaderData?.stamp.name },
      { property: "og:description", content: loaderData?.stamp.description },
      { property: "og:image", content: loaderData?.stamp.image },
    ],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold">Stamp not found</h1>
        <Link to="/stamps" className="text-sm text-muted-foreground underline mt-2 inline-block">
          Back to all stamps
        </Link>
      </div>
    </SiteLayout>
  ),
  component: StampDetail,
});

function StampDetail() {
  const { stamp } = Route.useLoaderData();
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [activePanel, setActivePanel] = useState<"buy" | "details">(
    mode === "buy" ? "buy" : "details",
  );
  const [pincode, setPincode] = useState("");
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<Review[]>(defaultReviews);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [sellerQuestion, setSellerQuestion] = useState("");
  const [sellerMessages, setSellerMessages] = useState([
    {
      id: "m1",
      from: "seller",
      text: "Hi, ask anything about condition, certificate, shipping or final price.",
    },
  ]);
  const [wishlisted, setWishlisted] = useState(false);
  const related = stamps
    .filter((s) => s.id !== stamp.id && s.category === stamp.category)
    .slice(0, 3);
  const protectionFee = Math.max(25, Math.round(stamp.price * 0.03));
  const deliveryFee = stamp.price > 999 ? 0 : 49;
  const total = stamp.price + protectionFee + deliveryFee;
  const deliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  useEffect(() => {
    setActivePanel(mode === "buy" ? "buy" : "details");
    setWishlisted(readWishlist().includes(stamp.id));
  }, [mode, stamp.id]);

  if (pathname === `/stamps/${stamp.id}/buy`) {
    return <Outlet />;
  }

  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(reviews.length, 1);

  const submitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewName.trim() || !reviewText.trim()) {
      setMessage("Please add your name and review before submitting.");
      return;
    }

    setReviews((current) => [
      {
        id: `review-${Date.now()}`,
        name: reviewName.trim(),
        rating: reviewRating,
        text: reviewText.trim(),
        date: "Just now",
      },
      ...current,
    ]);
    setReviewName("");
    setReviewText("");
    setReviewRating(5);
    setMessage("Thanks. Your review has been added.");
  };

  const addToCart = async () => {
    const added = await addStampToCartForSignedInUser(stamp);
    if (!added) {
      navigate({ to: "/auth" });
    }
  };

  const sendSellerMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sellerQuestion.trim()) return;

    setSellerMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, from: "buyer", text: sellerQuestion.trim() },
      {
        id: `seller-${Date.now()}`,
        from: "seller",
        text: "Thanks. Seller will confirm certificate, condition and dispatch details shortly.",
      },
    ]);
    setSellerQuestion("");
  };

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/stamps"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to archive
        </Link>
      </div>

      <section className="container mx-auto px-4 sm:px-6 pb-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(340px,480px)_1fr]">
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="aspect-square rounded-xl bg-secondary/60 grid place-items-center p-7">
                <img
                  src={stamp.image}
                  alt={stamp.name}
                  className="max-w-full max-h-full object-contain drop-shadow-xl"
                  width={640}
                  height={800}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  asChild
                  size="lg"
                  className="h-12 w-full gap-2 bg-gold text-gold-foreground hover:bg-gold/90"
                  aria-disabled={!stamp.available}
                >
                  <a
                    href={stamp.available ? `/stamps/${stamp.id}/buy#buy-section` : undefined}
                    onClick={(event) => {
                      if (!stamp.available) event.preventDefault();
                    }}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Buy Now
                  </a>
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2"
                  onClick={addToCart}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add Cart
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-gold/40 bg-gold/15">
                  {stamp.category}
                </Badge>
                <Badge variant="outline">{stamp.year}</Badge>
                {stamp.available ? (
                  <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
                    In stock
                  </Badge>
                ) : (
                  <Badge variant="secondary">Sold out</Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified
                </Badge>
              </div>

              <h1 className="mt-3 text-3xl lg:text-4xl font-semibold">{stamp.name}</h1>
              <p className="text-muted-foreground mt-1">
                {stamp.origin} · {stamp.condition} · {stamp.rarity}
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="text-4xl font-bold">₹{stamp.price.toLocaleString("en-IN")}</div>
                <div className="pb-1 text-sm text-emerald-700">Assured collector price</div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat label="Year" value={stamp.year.toString()} />
                <Stat label="Rarity" value={stamp.rarity} />
                <Stat label="Score" value={`${stamp.rarityScore}/100`} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex border-b border-border">
                {(["buy", "details"] as const).map((panel) => (
                  <button
                    key={panel}
                    onClick={() => setActivePanel(panel)}
                    className={`px-4 py-3 text-sm font-medium capitalize ${
                      activePanel === panel
                        ? "border-b-2 border-primary text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {panel === "details" ? "Details" : panel}
                  </button>
                ))}
              </div>

              {message && (
                <div className="mb-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              )}

              {activePanel === "buy" && (
                <div className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info icon={Truck} label="Delivery" value={`By ${deliveryDate}`} />
                    <Info icon={ShieldCheck} label="Buyer protection" value="Verified dispatch" />
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium">Check delivery pincode</span>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={pincode}
                        onChange={(event) => setPincode(event.target.value)}
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter pincode"
                        className="h-11 flex-1 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setMessage(
                            pincode.length === 6
                              ? `Delivery available to ${pincode}. Expected by ${deliveryDate}.`
                              : "Enter a valid 6 digit pincode.",
                          )
                        }
                      >
                        Check
                      </Button>
                    </div>
                  </label>

                  <div className="rounded-xl bg-secondary/50 p-4 text-sm">
                    <Line label="Stamp price" value={`₹${stamp.price.toLocaleString("en-IN")}`} />
                    <Line
                      label="Protection fee"
                      value={`₹${protectionFee.toLocaleString("en-IN")}`}
                    />
                    <Line label="Delivery" value={deliveryFee ? `₹${deliveryFee}` : "Free"} />
                    <div className="mt-3 border-t border-border pt-3">
                      <Line label="Total" value={`₹${total.toLocaleString("en-IN")}`} strong />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button asChild className="flex-1 gap-2" size="lg">
                      <a href={`/stamps/${stamp.id}/buy#buy-section`}>
                        <IndianRupee className="h-4 w-4" />
                        Place Order
                      </a>
                    </Button>
                    <Button
                      variant={wishlisted ? "default" : "outline"}
                      className="flex-1 gap-2"
                      size="lg"
                      onClick={async () => {
                        const nextVal = await toggleWishlistInSupabase(stamp);
                        setWishlisted(nextVal);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${wishlisted ? "fill-current" : ""}`} />
                      {wishlisted ? "Saved" : "Save for later"}
                    </Button>
                  </div>
                </div>
              )}

              {activePanel === "details" && (
                <div className="grid gap-5">
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-2">About this stamp</h2>
                    <p className="text-muted-foreground leading-relaxed">{stamp.description}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info icon={ShieldCheck} label="Authenticity" value="Stamp Safar Expert Panel" />
                    <Info icon={MapPin} label="Origin" value={stamp.origin} />
                    <Info icon={PackageCheck} label="Stock" value={`${stamp.stock} available`} />
                    <Info icon={Truck} label="Dispatch" value="Secure archival packing" />
                  </div>
                </div>
              )}
            </div>

            {stamp.seller && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 text-sm font-semibold">Seller</div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground grid place-items-center font-semibold">
                    {stamp.seller.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{stamp.seller.name}</div>
                    <div className="text-xs text-muted-foreground">{stamp.seller.location}</div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-sm text-emerald-900">
                    <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                    {stamp.seller.rating}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <MessageSquareText className="h-5 w-5 text-gold" />
                Chat with seller
              </h2>
              <div className="mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl bg-secondary/40 p-3">
                {sellerMessages.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex ${chat.from === "buyer" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-xl px-3 py-2 text-sm ${
                        chat.from === "buyer"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card"
                      }`}
                    >
                      {chat.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={sendSellerMessage} className="mt-3 flex gap-2">
                <input
                  value={sellerQuestion}
                  onChange={(event) => setSellerQuestion(event.target.value)}
                  placeholder="Ask about certificate, condition, shipping..."
                  className="h-11 flex-1 rounded-xl border border-border bg-secondary/50 px-3 text-sm outline-none focus:border-gold"
                />
                <Button type="submit" className="gap-2">
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                    <MessageSquareText className="h-5 w-5 text-gold" />
                    Reviews
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Collector feedback for this stamp and seller experience.
                  </p>
                </div>
                <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-semibold">
                    {averageRating.toFixed(1)}
                    <Star className="h-4 w-4 fill-gold text-gold" />
                  </div>
                  <div className="text-xs text-muted-foreground">{reviews.length} reviews</div>
                </div>
              </div>

              <form onSubmit={submitReview} className="mt-5 rounded-xl bg-secondary/40 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={reviewName}
                    onChange={(event) => setReviewName(event.target.value)}
                    placeholder="Your name"
                    className="h-11 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-gold"
                  />
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewRating(rating)}
                        className="p-1"
                        aria-label={`${rating} star rating`}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            rating <= reviewRating ? "fill-gold text-gold" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  placeholder="Share condition, packaging, seller response or collecting value..."
                  className="mt-3 min-h-24 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:border-gold"
                />
                <Button type="submit" className="mt-3 w-full sm:w-auto">
                  Add Review
                </Button>
              </form>

              <div className="mt-5 space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm">{review.name}</div>
                        <div className="text-xs text-muted-foreground">{review.date}</div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            className={`h-4 w-4 ${
                              index < review.rating
                                ? "fill-gold text-gold"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {review.text}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="container mx-auto px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" /> You may also like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {related.map((s) => (
              <StampCard key={s.id} stamp={s} />
            ))}
          </div>
        </section>
      )}
    </SiteLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-3 bg-card">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/40 p-3">
      <Icon className="h-4 w-4 text-gold" />
      <div className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${strong ? "font-semibold" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
