import { Link, useNavigate } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import type { Stamp } from "@/lib/stamps";
import { addStampToCartForSignedInUser } from "@/lib/cart";
import {
  readWishlist,
  toggleWishlist,
  toggleWishlistInSupabase,
  WISHLIST_UPDATED_EVENT,
} from "@/lib/wishlist";

import {
  Heart,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

import { useEffect, useState } from "react";

export function StampCard({
  stamp,
}: {
  stamp: Stamp;
}) {
  const navigate = useNavigate();

  const [wishlisted, setWishlisted] =
    useState(false);

  useEffect(() => {
    const syncWishlist = () =>
      setWishlisted(
        readWishlist().includes(stamp.id)
      );

    syncWishlist();

    window.addEventListener(
      WISHLIST_UPDATED_EVENT,
      syncWishlist
    );

    window.addEventListener(
      "storage",
      syncWishlist
    );

    return () => {
      window.removeEventListener(
        WISHLIST_UPDATED_EVENT,
        syncWishlist
      );

      window.removeEventListener(
        "storage",
        syncWishlist
      );
    };
  }, [stamp.id]);

  const addToCart = async () => {
    if (!stamp.available) return;

    const added =
      await addStampToCartForSignedInUser(
        stamp
      );

    if (!added) {
      window.sessionStorage.setItem(
        "stampSafar.authNotice",
        "Please login first to add stamps to cart."
      );

      navigate({
        to: "/auth",
      });
    }
  };

  return (
    <article
      className={`stamp-card group overflow-hidden ${
        !stamp.available
          ? "opacity-80"
          : ""
      }`}
    >
      {/* IMAGE */}

      <div className="relative">
        <Link
          to="/stamps/$stampId"
          params={{
            stampId: stamp.id,
          }}
          className="block"
        >
          <div className="relative aspect-[4/5] bg-gradient-to-br from-secondary/60 to-secondary/30 overflow-hidden grid place-items-center p-5">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-gold/10 via-transparent to-primary/10" />

            <img
              src={stamp.image}
              alt={stamp.name}
              width={640}
              height={800}
              loading="lazy"
              className={`relative w-full h-full object-contain transition-transform duration-700 ease-out drop-shadow-md ${
                stamp.available
                  ? "group-hover:scale-[1.07] group-hover:-rotate-1"
                  : "grayscale"
              }`}
            />

            {!stamp.available && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  SOLD OUT
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* WISHLIST */}

        <button
          type="button"
          onClick={async () => {
            const nextVal = await toggleWishlistInSupabase(stamp);
            setWishlisted(nextVal);
          }}
          className={`absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border shadow-sm transition ${
            wishlisted
              ? "border-rose-300 bg-rose-50 text-rose-600"
              : "border-border bg-card/90 text-muted-foreground hover:border-gold hover:text-foreground"
          }`}
        >
          <Heart
            className={`h-4 w-4 ${
              wishlisted
                ? "fill-current"
                : ""
            }`}
          />
        </button>
      </div>

      {/* CONTENT */}

      <div className="p-4 border-t border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to="/stamps/$stampId"
              params={{
                stampId: stamp.id,
              }}
            >
              <h3 className="font-display font-semibold leading-tight truncate hover:text-primary">
                {stamp.name}
              </h3>
            </Link>

            <p className="text-xs text-muted-foreground mt-0.5">
              {stamp.year} ·{" "}
              {stamp.category}
            </p>
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${
              stamp.rarity ===
              "Legendary"
                ? "border-gold text-gold-foreground bg-gold/15"
                : stamp.rarity ===
                    "Very Rare"
                  ? "border-primary/40 bg-primary/5"
                  : stamp.rarity ===
                      "Rare"
                    ? "border-border"
                    : "border-border text-muted-foreground"
            }`}
          >
            {stamp.rarity}
          </Badge>
        </div>

        {/* PRICE */}

        <div className="mt-3 flex items-center justify-between">
          <span className="font-semibold">
            ₹
            {stamp.price.toLocaleString(
              "en-IN"
            )}
          </span>

          <span
            className={`text-xs ${
              stamp.available
                ? "text-emerald-600"
                : "text-red-500 font-medium"
            }`}
          >
            {stamp.available
              ? "● Available"
              : "● Sold Out"}
          </span>
        </div>

        {/* BUTTONS */}

        <div className="mt-4 grid grid-cols-2 gap-2">
          {stamp.available ? (
            <a
              href={`/stamps/${stamp.id}/buy#buy-section`}
              className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ShoppingBag className="h-4 w-4" />
              Buy
            </a>
          ) : (
            <button
              disabled
              className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-muted text-muted-foreground text-xs cursor-not-allowed"
            >
              <ShoppingBag className="h-4 w-4" />
              Sold Out
            </button>
          )}

          <button
            type="button"
            onClick={addToCart}
            disabled={!stamp.available}
            className={`inline-flex h-10 w-full items-center justify-center gap-1 rounded-md px-3 text-xs font-medium transition-colors ${
              stamp.available
                ? "border border-border bg-card hover:border-gold hover:bg-gold/10"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />

            {stamp.available
              ? "Add Cart"
              : "Unavailable"}
          </button>
        </div>
      </div>
    </article>
  );
}