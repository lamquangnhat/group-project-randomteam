import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Star,
  X,
  MapPin,
  DollarSign,
  Clock,
  Heart,
  Bookmark,
  Plus,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useTripPlan } from "../context/TripPlanContext";
import { locationsApi, adaptLocation, type Destination } from "../lib/api";

const BACKEND_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Hotel", value: "hotel" },
  { label: "Beach", value: "beach" },
  { label: "Food", value: "food" },
  { label: "Tourist Attraction", value: "tourist_attraction" },
  { label: "Mall", value: "mall" },
  { label: "Nature", value: "nature" },
  { label: "Entertainment", value: "entertainment" },
];

export function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [likedDestinations, setLikedDestinations] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const { addDestinationToTrip, tripActivities } = useTripPlan();
  const [searchParams] = useSearchParams();
  const searchQuery = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchDestinations() {
      try {
        let raw;
        if (searchQuery && selectedCategory) {
          raw = await locationsApi.search({ keyword: searchQuery, category: selectedCategory, limit: 50 });
        } else if (searchQuery) {
          raw = await locationsApi.search({ keyword: searchQuery, limit: 50 });
        } else if (selectedCategory) {
          raw = await locationsApi.search({ category: selectedCategory, limit: 50 });
        } else {
          raw = await locationsApi.getPopular(50);
        }
        if (!cancelled) setDestinations(raw.map(adaptLocation));
      } catch {
        if (!cancelled) setDestinations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDestinations();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, searchQuery]);

  const favoriteDestinations = destinations.filter((d) =>
    likedDestinations.includes(d.id)
  );

  const toggleLike = (id: string) => {
    setLikedDestinations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToTrip = (destination: Destination) => {
    addDestinationToTrip(destination);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_14%_20%,#3ee7b1_0%,transparent_23%),radial-gradient(circle_at_84%_16%,#5ab5ff_0%,transparent_26%),linear-gradient(135deg,#071827_0%,#123a55_48%,#0f5f69_100%)] text-white">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute right-10 top-4 h-48 w-48 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-50 shadow-lg backdrop-blur">
                <Sparkles className="h-4 w-4 text-emerald-300" />
                Curated destinations for smarter travel
              </div>
              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Discover Your Next Adventure
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-100/90">
                Explore curated destinations, save favorites, and add places to your trip plan with one click.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  {destinations.length > 0 ? `${destinations.length}+ places` : "Explore places"}
                </span>
                <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  {BACKEND_CATEGORIES.length - 1} travel styles
                </span>
                <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/20">
                  Local browser trip plan
                </span>
              </div>
            </div>

            <div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md lg:max-w-sm">
              <button
                onClick={() => setShowFavorites(true)}
                className="group relative flex w-full items-center justify-between rounded-2xl bg-white px-5 py-4 text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <span className="flex items-center gap-3 font-bold">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Bookmark className="h-5 w-5" />
                  </span>
                  My Favorites
                </span>
                <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-emerald-400 px-2 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/30">
                  {likedDestinations.length}
                </span>
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Trip Plan</p>
                  <p className="mt-2 text-3xl font-black">{tripActivities.length}</p>
                  <p className="text-xs text-slate-200">places added</p>
                </div>
                <div className="rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Quick Add</p>
                  <p className="mt-2 text-3xl font-black">+</p>
                  <p className="text-xs text-slate-200">use the plus icon</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <div className="sticky top-16 z-40 border-b border-border bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-4">
            {BACKEND_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`whitespace-nowrap rounded-full px-4 py-2 font-semibold transition-all ${
                  selectedCategory === cat.value
                    ? "bg-slate-950 text-white shadow-md shadow-slate-900/10"
                    : "bg-muted text-foreground hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {searchQuery && (
          <p className="mb-6 rounded-2xl bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm ring-1 ring-border">
            Showing {destinations.length} result{destinations.length === 1 ? "" : "s"} for "{searchParams.get("q")}"
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card py-16 text-center shadow-sm">
            <h3 className="mb-2 text-xl font-bold">No destinations found</h3>
            <p className="text-muted-foreground">
              Try a different search or category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <motion.div
                key={destination.id}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-md transition hover:-translate-y-1 hover:shadow-2xl"
                onClick={() => setSelectedDestination(destination)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(destination.id);
                    }}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-110 hover:bg-white"
                    aria-label="Add to favorites"
                    title="Add to favorites"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        likedDestinations.includes(destination.id)
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600"
                      }`}
                    />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToTrip(destination);
                    }}
                    className="absolute right-3 top-16 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-900/20 transition hover:scale-110 hover:bg-emerald-300"
                    aria-label="Add to trip plan"
                    title="Add to trip plan"
                  >
                    <Plus className="h-5 w-5" />
                  </button>

                  <div className="absolute bottom-3 left-3 rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950 shadow-lg">
                    {destination.category}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="mb-1 text-lg font-bold text-foreground">{destination.name}</h3>
                  <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{destination.location}</span>
                  </div>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="text-sm font-semibold">{destination.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({destination.reviews})</span>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-sm font-semibold text-muted-foreground">
                      {destination.price}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{destination.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Favorites Modal */}
      <AnimatePresence>
        {showFavorites && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setShowFavorites(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[radial-gradient(circle_at_10%_20%,#42e6ad_0%,transparent_28%),linear-gradient(135deg,#10263d_0%,#235c78_100%)] p-6 text-white">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-emerald-50 ring-1 ring-white/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Saved places
                  </div>
                  <h2 className="text-3xl font-black">My Favorite Destinations</h2>
                  <p className="mt-1 text-sm text-slate-100/85">
                    {favoriteDestinations.length} {favoriteDestinations.length === 1 ? "place" : "places"} saved · add any favorite directly to your trip plan
                  </p>
                </div>
                <button
                  onClick={() => setShowFavorites(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white hover:text-slate-950"
                  aria-label="Close favorites"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(90vh-132px)] overflow-y-auto p-6">
                {favoriteDestinations.length === 0 ? (
                  <div className="rounded-[2rem] border border-dashed border-emerald-200 bg-emerald-50/60 py-16 text-center">
                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
                      <Heart className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="mb-2 text-2xl font-black">No favorites yet</h3>
                    <p className="mx-auto max-w-md text-muted-foreground">
                      Click the heart icon on a destination card to save it here, then use the plus button to add it to your trip plan.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {favoriteDestinations.map((destination) => (
                      <motion.div
                        key={destination.id}
                        initial={{ opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-md transition hover:-translate-y-1 hover:shadow-2xl"
                        onClick={() => {
                          setShowFavorites(false);
                          setSelectedDestination(destination);
                        }}
                      >
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={destination.image}
                            alt={destination.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLike(destination.id);
                            }}
                            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-110"
                            aria-label="Remove favorite"
                            title="Remove favorite"
                          >
                            <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToTrip(destination);
                            }}
                            className="absolute right-3 top-16 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400 text-slate-950 shadow-lg transition hover:scale-110 hover:bg-emerald-300"
                            aria-label="Add favorite to trip plan"
                            title="Add to trip plan"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-3 left-3 rounded-full bg-emerald-400 px-3 py-1 text-sm font-bold text-slate-950 shadow-lg">
                            {destination.category}
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="mb-1 text-lg font-bold">{destination.name}</h3>
                          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{destination.location}</span>
                          </div>
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-accent text-accent" />
                              <span className="text-sm font-semibold">{destination.rating.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">({destination.reviews})</span>
                            </div>
                            <span className="text-sm font-semibold text-muted-foreground">{destination.price}</span>
                          </div>
                          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{destination.description}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToTrip(destination);
                            }}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                          >
                            <Plus className="h-4 w-4" />
                            Add to Trip Plan
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Destination Detail Modal */}
      <AnimatePresence>
        {selectedDestination && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setSelectedDestination(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="relative h-80">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-4 rounded-full bg-emerald-400 px-4 py-2 font-bold text-slate-950">
                  {selectedDestination.category}
                </div>
              </div>

              <div className="p-8">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="mb-2 text-3xl font-black">{selectedDestination.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span>{selectedDestination.location}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 flex items-center gap-2">
                      <Star className="h-5 w-5 fill-accent text-accent" />
                      <span className="text-xl font-bold">{selectedDestination.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{selectedDestination.reviews} reviews</span>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Price Range</div>
                      <div>{selectedDestination.price}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-muted p-4">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Hours</div>
                      <div className="text-sm">{selectedDestination.hours}</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="mb-3 text-xl font-bold">About</h3>
                  <p className="leading-relaxed text-muted-foreground">{selectedDestination.fullDescription}</p>
                </div>

                {selectedDestination.features.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-3 text-xl font-bold">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDestination.features.map((feature, index) => (
                        <span key={index} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    handleAddToTrip(selectedDestination);
                    setSelectedDestination(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  <Plus className="h-5 w-5" />
                  Add to Trip Plan
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
