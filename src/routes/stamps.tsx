import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";

import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState } from "react";

import { SiteLayout } from "@/components/SiteLayout";
import { StampCard } from "@/components/StampCard";
import { stamps } from "@/lib/stamps";
import { Input } from "@/components/ui/input";

import {
  Search,
  SlidersHorizontal,
  Mic,
  MapPin,
} from "lucide-react";

const searchSchema = z.object({
  category: fallback(z.string(), "").default(""),
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/stamps")({
  validateSearch: zodValidator(searchSchema),

  head: () => ({
    meta: [
      {
        title: "Explore Stamps — Stamp Safar",
      },
      {
        name: "description",
        content:
          "Browse and filter India's philatelic archive by year, category, rarity and price.",
      },
    ],
  }),

  component: StampsPage,
});

const categories = [
  "All",
  "History",
  "Wildlife",
  "Culture",
  "Festivals",
  "Science",
  "Transport",
  "Military",
  "Monuments",
] as const;

const rarities = [
  "All",
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
] as const;

function StampsPage() {
  const { category, q: searchQ } = Route.useSearch();

  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const [cat, setCat] = useState<string>(category || "All");

  const [rarity, setRarity] = useState<string>("All");

  const [q, setQ] = useState(searchQ || "");

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  const [maxPrice, setMaxPrice] = useState(100);

  // ================= VOICE SEARCH =================

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.interimResults = false;

    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;

      setQ(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
    };
  };

  // ================= FILTER =================

  const filtered = useMemo(() => {
    return stamps.filter((s) => {
      // CATEGORY FILTER
      if (cat !== "All" && s.category !== cat) {
        return false;
      }

      // RARITY FILTER
      if (rarity !== "All" && s.rarity !== rarity) {
        return false;
      }

      // PRICE FILTER
      if (s.price > maxPrice) {
        return false;
      }

      // SEARCH
      const query = q.toLowerCase().trim();

      const searchableFields = [
        s.name,
        s.year?.toString(),
        s.category,
        s.rarity,
        s.origin,
        s.description,
        s.state,
        s.city,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // ✅ SEARCH BY STATE / CITY / NAME / CATEGORY
      if (query && !searchableFields.includes(query)) {
        return false;
      }

      return true;
    });
  }, [cat, rarity, maxPrice, q]);

  // ================= SEARCH SUGGESTIONS =================

  const suggestions = q.trim()
    ? filtered.slice(0, 8)
    : [];

  if (pathname !== "/stamps") {
    return <Outlet />;
  }

  return (
    <SiteLayout>
      {/* ================= BACKGROUND VIDEO ================= */}

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        >
          <source
            src="/background video 1.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      </div>

      {/* ================= HEADER ================= */}

      <section className="container mx-auto px-4 sm:px-6 pt-10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Explore The Archive
            </h1>

            <p className="text-gray-200 mt-3 max-w-2xl text-base leading-relaxed">
              Browse through {stamps.length}+ curated Indian postage
              stamps from different eras, themes and historical
              collections.
            </p>
          </div>

          <div className="px-5 py-4 flex items-center gap-5 rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md">
            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {stamps.length}+
              </div>

              <div className="text-xs text-gray-300 uppercase">
                Total Stamps
              </div>
            </div>

            <div className="w-px h-10 bg-white/20" />

            <div>
              <div className="text-2xl font-bold text-yellow-400">
                {filtered.length}
              </div>

              <div className="text-xs text-gray-300 uppercase">
                Showing
              </div>
            </div>
          </div>
        </div>

        {/* ================= SEARCH ================= */}

        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />

          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onBlur={() =>
              window.setTimeout(
                () => setSuggestionsOpen(false),
                140,
              )
            }
            placeholder="Search by stamp, state, city, category or rarity..."
            className="pl-12 pr-14 h-14 text-base rounded-2xl border border-white/10 bg-black/40 text-white placeholder:text-gray-300 backdrop-blur-md"
          />

          {/* ================= MIC BUTTON ================= */}

          <button
            type="button"
            onClick={startVoiceSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-yellow-400 transition"
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* ================= SUGGESTIONS ================= */}

          {suggestionsOpen && q.trim() && (
            <div className="absolute left-0 right-0 top-16 z-30 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-xl">
              {suggestions.length ? (
                suggestions.map((stamp) => (
                  <Link
                    key={stamp.id}
                    to="/stamps/$stampId"
                    params={{ stampId: stamp.id }}
                    className="flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0 hover:bg-white/10"
                  >
                    <img
                      src={stamp.image}
                      alt={stamp.name}
                      className="h-12 w-12 rounded-lg bg-secondary object-contain"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {stamp.name}
                      </span>

                      <span className="flex items-center gap-1 text-xs text-gray-300 mt-1">
                        <MapPin className="w-3 h-3" />

                        {stamp.city
                          ? `${stamp.city}, ${stamp.state}`
                          : stamp.state}
                      </span>

                      <span className="block text-xs text-gray-400 mt-1">
                        {stamp.year} · {stamp.rarity} · ₹
                        {stamp.price.toLocaleString("en-IN")}
                      </span>
                    </span>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-gray-300">
                  No quick match. Results will update below.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ================= MAIN SECTION ================= */}

      <section className="container mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[280px_1fr] gap-8">
        {/* ================= SIDEBAR ================= */}

        <aside className="p-6 h-fit lg:sticky lg:top-20 rounded-3xl border border-white/10 bg-black/35 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6 text-white">
            <SlidersHorizontal className="w-5 h-5" />

            <h2 className="font-semibold text-lg">
              Filters
            </h2>
          </div>

          <FilterGroup
            label="Category"
            options={categories}
            value={cat}
            onChange={setCat}
          />

          <FilterGroup
            label="Rarity"
            options={rarities}
            value={rarity}
            onChange={setRarity}
          />

          {/* ================= PRICE FILTER ================= */}

          <div className="mt-7">
            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-300">
                Maximum Price
              </span>

              <span className="font-semibold text-yellow-400">
                ₹{maxPrice.toLocaleString("en-IN")}
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(Number(e.target.value))
              }
              className="w-full accent-yellow-400"
            />
          </div>

          {/* ================= RESET BUTTON ================= */}

          <button
            onClick={() => {
              setCat("All");
              setRarity("All");
              setMaxPrice(100);
              setQ("");
            }}
            className="mt-8 w-full bg-yellow-500 text-black rounded-xl py-3 text-sm font-medium hover:opacity-90 transition"
          >
            Reset Filters
          </button>
        </aside>

        {/* ================= STAMP GRID ================= */}

        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="text-sm text-gray-200">
              {filtered.length} stamps found
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((s, i) => (
              <div
                key={s.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <StampCard stamp={s} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="p-16 text-center text-gray-300 rounded-3xl border border-white/10 bg-black/30 backdrop-blur-md">
              No stamps match your filters.
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

// ================= FILTER GROUP =================

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;

  options: readonly string[];

  value: string;

  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-6 first:mt-0">
      <div className="text-sm font-semibold mb-3 text-white">
        {label}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all duration-300 ${
              value === o
                ? "bg-yellow-500 text-black border-yellow-500 scale-105"
                : "bg-black/30 text-white border-white/10 hover:border-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}