import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

// Browser SpeechRecognition type augmentation
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition | undefined;
    webkitSpeechRecognition: typeof SpeechRecognition | undefined;
  }
}
import {
  Search,
  Landmark,
  Bird,
  Music2,
  Sparkles,
  ArrowRight,
  Mic,
} from "lucide-react";

import { SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { stamps } from "@/lib/stamps";

import hero from "@/assets/hero-stamps.jpg";
import bgVideo from "@/assets/stamp-bg.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Stamp Safar — Discover, Collect & Trade Indian Stamps",
      },
      {
        name: "description",
        content:
          "India's premier philately platform. Explore rare stamps, build your collection and trade with verified collectors across the country.",
      },
    ],
  }),
  component: Home,
});

const categories = [
  {
    name: "History",
    icon: Landmark,
    desc: "Freedom, leaders & monuments",
  },
  {
    name: "Wildlife",
    icon: Bird,
    desc: "Tigers, birds & biodiversity",
  },
  {
    name: "Culture",
    icon: Music2,
    desc: "Dance, music & traditions",
  },
  {
    name: "Festivals",
    icon: Sparkles,
    desc: "Diwali, Holi & celebrations",
  },
];

function Home() {
  const navigate = useNavigate();

  const [heroSearch, setHeroSearch] = useState("");
  const [heroDropdownOpen, setHeroDropdownOpen] = useState(false);

  // ================= VOICE SEARCH =================

  const startVoiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SR) {
      alert("Voice search is not supported in your browser");
      return;
    }

    const recognition = new SR();

    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;

      setHeroSearch(transcript);

      submitHeroSearch(transcript);
    };

    recognition.start();
  };

  const heroSuggestions = heroSearch.trim()
    ? stamps
        .filter((stamp) =>
          `${stamp.name} ${stamp.year} ${stamp.category} ${stamp.rarity} ${stamp.origin} ${stamp.state}`
            .toLowerCase()
            .includes(heroSearch.trim().toLowerCase()),
        )
        .slice(0, 5)
    : [];

  const submitHeroSearch = (query = heroSearch) => {
    const q = query.trim();

    setHeroDropdownOpen(false);

    navigate({
      to: "/stamps",
      search: {
        category: "",
        q,
      },
    });
  };

  return (
    <SiteLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* VIDEO BACKGROUND */}
        <div className="absolute inset-0 -z-20 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src={bgVideo} type="video/mp4" />
          </video>

          {/* DARK OVERLAY */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* ANIMATED BLOBS */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 -left-20 w-[28rem] h-[28rem] rounded-full bg-gold/20 blur-3xl animate-blob" />

          <div
            className="absolute -bottom-20 right-0 w-[32rem] h-[32rem] rounded-full bg-primary/15 blur-3xl animate-blob"
            style={{ animationDelay: "-6s" }}
          />
        </div>

        {/* MAIN CONTENT */}
        <div className="container mx-auto px-4 sm:px-6 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1.05fr_1fr] gap-14 lg:gap-20 items-center">
          {/* LEFT SIDE */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/10 border border-white/10 text-xs font-medium animate-fade-in text-white">
              <span className="relative flex w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-60" />

                <span className="relative w-2 h-2 rounded-full bg-yellow-400" />
              </span>

              India's National Philately Platform
            </div>

            <h1 className="mt-6 text-white text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.02] tracking-tight animate-fade-in-up">
              Discover, Collect & <br />

              <span className="text-yellow-400">Trade Stamps</span>

              <span className="block text-white/90">Across India</span>
            </h1>

            <p className="mt-6 text-lg text-white/80 max-w-xl leading-relaxed animate-fade-in-up delay-100">
              From the 1854 Scinde Dawk to modern commemoratives — explore a
              curated archive of India's philatelic heritage, verified by
              experts and loved by collectors.
            </p>

            {/* SEARCH BOX */}
            <form
              onSubmit={(event) => {
                event.preventDefault();

                submitHeroSearch();
              }}
              className="mt-10 animate-fade-in-up delay-200"
            >
              <div className="rounded-2xl backdrop-blur-xl bg-white/10 border border-white/10 p-2">
                <div className="flex flex-col gap-2 sm:flex-row">
                  {/* SEARCH INPUT */}
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />

                    <Input
                      value={heroSearch}
                      onChange={(event) => {
                        setHeroSearch(event.target.value);

                        setHeroDropdownOpen(true);
                      }}
                      onFocus={() => setHeroDropdownOpen(true)}
                      onBlur={() =>
                        window.setTimeout(
                          () => setHeroDropdownOpen(false),
                          140,
                        )
                      }
                      placeholder="Search by year, theme, region…"
                      className="pl-10 pr-12 border-0 bg-transparent focus-visible:ring-0 h-12 text-base text-white placeholder:text-white/50"
                    />

                    {/* MIC BUTTON */}
                    <button
                      type="button"
                      onClick={startVoiceSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-yellow-400 transition"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>

                  {/* SEARCH BUTTON */}
                  <Button
                    type="submit"
                    size="lg"
                    className="h-12 px-6 bg-yellow-400 text-black hover:bg-yellow-300 group sm:w-auto w-full"
                  >
                    Search

                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* DROPDOWN */}
              {heroDropdownOpen && heroSearch.trim() && (
                <div className="mt-3 max-h-[360px] overflow-y-auto rounded-2xl border border-white/15 bg-background text-foreground shadow-2xl">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent"
                  >
                    <Search className="h-4 w-4 text-gold" />

                    Search for{" "}
                    <span className="font-semibold">
                      "{heroSearch.trim()}"
                    </span>
                  </button>

                  {heroSuggestions.length > 0 ? (
                    <div className="border-t border-border">
                      {heroSuggestions.map((stamp) => (
                        <Link
                          key={stamp.id}
                          to="/stamps/$stampId"
                          params={{ stampId: stamp.id }}
                          onClick={() => {
                            setHeroDropdownOpen(false);

                            setHeroSearch("");
                          }}
                          className="grid grid-cols-[56px_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-accent"
                        >
                          <img
                            src={stamp.image}
                            alt={stamp.name}
                            className="h-14 w-14 rounded-lg bg-secondary object-contain"
                          />

                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {stamp.name}
                            </span>

                            <span className="block text-xs text-muted-foreground">
                              {stamp.year} · {stamp.category} ·{" "}
                              {stamp.state} · {stamp.rarity}
                            </span>
                          </span>

                          <span className="text-sm font-semibold">
                            ₹{stamp.price.toLocaleString("en-IN")}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
                      No direct match. Press Search to browse the archive.
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* QUICK TAGS */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/70 animate-fade-in-up delay-300">
              <span>Try:</span>

              {[
                "1948 Gandhi",
                "Wildlife",
                "Rajasthan",
                "West Bengal",
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => submitHeroSearch(t)}
                  className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 hover:border-yellow-400 hover:bg-yellow-400/10 transition-colors text-white"
                >
                  {t}
                </button>
              ))}
            </div>

            {/* STATS */}
            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md animate-fade-in-up delay-500">
              {[
                { n: "12,400+", l: "Verified stamps" },
                { n: "1854", l: "Earliest issue" },
                { n: "4.9★", l: "Collector rating" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-2xl font-bold text-yellow-400">
                    {s.n}
                  </div>

                  <div className="text-[11px] uppercase tracking-wider text-white/60 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative animate-scale-in delay-200">
            <div className="absolute -inset-8 bg-gradient-to-tr from-yellow-400/30 via-transparent to-primary/20 blur-3xl rounded-full" />

            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl animate-float">
              <img
                src={hero}
                alt="Curated Indian postage stamps"
                width={1536}
                height={1024}
                className="w-full h-auto"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* VERIFIED CARD */}
            <div className="absolute -bottom-6 -left-6 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-4 shadow-xl hidden sm:flex items-center gap-3 animate-fade-in-up delay-500">
              <div className="w-10 h-10 rounded-xl bg-yellow-400/20 grid place-items-center">
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </div>

              <div>
                <div className="text-sm font-semibold text-white">
                  Expert verified
                </div>

                <div className="text-xs text-white/60">
                  India Post archivists
                </div>
              </div>
            </div>

            {/* MARKETPLACE CARD */}
            <div className="absolute -top-4 -right-4 backdrop-blur-xl bg-white/10 border border-white/10 rounded-2xl p-3 shadow-xl hidden sm:flex items-center gap-2 animate-fade-in-up delay-300">
              <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black grid place-items-center text-xs font-bold">
                ₹
              </div>

              <div className="text-xs">
                <div className="font-semibold text-white">
                  Live marketplace
                </div>

                <div className="text-white/60">142 active bids</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container mx-auto px-4 sm:px-6 py-20">
        <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-yellow-400 mb-2">
              Themes
            </div>

            <h2 className="text-3xl sm:text-4xl font-semibold">
              Browse by Category
            </h2>

            <p className="text-muted-foreground mt-2 max-w-md">
              Curated themes from across India's postal history.
            </p>
          </div>

          <Link
            to="/stamps"
            className="text-sm font-medium flex items-center gap-1"
          >
            View all

            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((c, i) => (
            <Link
              key={c.name}
              to="/stamps"
              search={{ category: c.name }}
              className="p-6 rounded-2xl border border-border bg-card hover:shadow-2xl transition-all duration-300 group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 grid place-items-center mb-5 group-hover:scale-110 transition-transform duration-500">
                <c.icon className="w-5 h-5 text-yellow-400" />
              </div>

              <h3 className="font-semibold text-lg">{c.name}</h3>

              <p className="text-sm text-muted-foreground mt-1.5">
                {c.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}