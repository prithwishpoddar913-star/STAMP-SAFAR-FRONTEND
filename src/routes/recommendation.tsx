import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { stamps } from "@/lib/stamps";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Sparkles, IndianRupee } from "lucide-react";

export const Route = createFileRoute("/recommendation")({
  component: RecommendationPage,
});

function calcPostage(weight: number): number {
  if (!weight || weight <= 0) return 0;
  if (weight <= 20) return 5;
  return 5 + Math.ceil((weight - 20) / 5) * 5;
}

function RecommendationPage() {
  const [from, setFrom] = useState("Kolkata");
  const [to, setTo] = useState("Delhi");
  const [weight, setWeight] = useState<number>(20);
  const [submitted, setSubmitted] = useState(false);

  const postage = useMemo(() => calcPostage(weight), [weight]);

  const recommendations = useMemo(() => {
    if (!submitted) return [];

    let pool = stamps;

    const cityMatch = pool.filter(
      (s) =>
        s.city?.toLowerCase().includes(to.toLowerCase()) ||
        s.state?.toLowerCase().includes(to.toLowerCase())
    );

    if (cityMatch.length > 0) pool = cityMatch;

    return [...pool]
      .sort(
        (a, b) =>
          Math.abs(a.price - postage) -
          Math.abs(b.price - postage)
      )
      .slice(0, 6);
  }, [submitted, to, postage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <SiteLayout>
      {/* ================= BACKGROUND VIDEO ================= */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source
            src="/Recommendation%20video%20bg%201.mp4"
            type="video/mp4"
          />
        </video>

        {/* dark overlay for readability */}
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div className="min-h-screen text-foreground relative z-10">
        {/* HEADER */}
        <div className="text-center pt-10 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            AI Stamp Recommendation Engine
          </div>

          <h1 className="mt-4 text-4xl font-bold">
            Smart Postal Assistant
          </h1>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto mt-8 p-6 border rounded-2xl bg-card space-y-4"
        >
          <Input value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input value={to} onChange={(e) => setTo(e.target.value)} />
          <Input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
          />

          <div className="flex justify-between p-3 bg-muted rounded-xl">
            <span>Postage</span>
            <span className="font-bold flex items-center gap-1">
              <IndianRupee className="w-4 h-4" />
              {postage}
            </span>
          </div>

          <Button type="submit" className="w-full">
            Get AI Recommendation
          </Button>
        </form>

        {/* RESULTS */}
        {submitted && (
          <div className="max-w-5xl mx-auto mt-10 px-4">
            <h2 className="text-xl font-semibold mb-4">
              Recommended Stamps
            </h2>

            <div className="grid md:grid-cols-3 gap-4">
              {recommendations.map((s) => (
                <div
                  key={s.id}
                  className="border rounded-xl p-3 bg-card"
                >
                  <img
                    src={s.image}
                    className="h-32 w-full object-contain"
                  />

                  <div className="mt-2 font-semibold">
                    {s.name}
                  </div>

                  <div className="text-xs text-muted-foreground flex gap-1 items-center">
                    <MapPin className="w-3 h-3" />
                    {s.city}, {s.state}
                  </div>

                  <div className="flex justify-between mt-2">
                    <span className="font-bold">
                      ₹{s.price}
                    </span>
                    <Badge>{s.rarity}</Badge>
                  </div>

                  <Link
                    to="/stamps/$stampId"
                    params={{ stampId: s.id }}
                  >
                    <Button className="w-full mt-3" size="sm">
                      View Stamp{" "}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}