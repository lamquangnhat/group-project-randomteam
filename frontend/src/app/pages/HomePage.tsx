import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  MapPin,
  Banknote,
  Clock,
  Heart,
  Bookmark,
  Plus,
  Star,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from "lucide-react";
import { useTripPlan } from "../context/TripPlanContext";
import { locationsApi, adaptLocation, type Destination } from "../lib/api";
import { FAVORITES_KEY, loadFavorites, saveFavorites } from "./FavoritesPage";
import { LocationMap } from "../components/LocationMap";

const BACKEND_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Hotels", value: "hotel" },
  { label: "Beaches", value: "beach" },
  { label: "Food & Drink", value: "food" },
  { label: "Attractions", value: "tourist_attraction" },
  { label: "Malls", value: "mall" },
  { label: "Nature", value: "nature" },
  { label: "Entertainment", value: "entertainment" },
];

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest", label: "Newest First" },
];

const PRICE_LEVEL_OPTIONS = [
  { value: 1, label: "Budget", hint: "< 100K ₫" },
  { value: 2, label: "Mid-range", hint: "100K–500K ₫" },
  { value: 3, label: "Upscale", hint: "500K–2M ₫" },
  { value: 4, label: "Luxury", hint: "> 2M ₫" },
];

const VIET_CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
  "Da Nang",
  "Hoi An",
  "Hue",
  "Nha Trang",
  "Phu Quoc",
  "Da Lat",
  "Ha Long",
  "Sa Pa",
  "Can Tho",
  "Mui Ne",
  "Ninh Binh",
];

const RATINGS_KEY = "travelPlanner.userRatings";

function readRatings(): Record<string, number> {
  try {
    const v = localStorage.getItem(RATINGS_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

function BubbleRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2.5 w-2.5 rounded-full ${
              i <= Math.round(rating) ? "bg-emerald-500" : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-600">{rating.toFixed(1)}</span>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(star === value ? 0 : star); }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              (hover || value) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1 text-xs font-semibold text-amber-600">{value}/5</span>
      )}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200">
      {label}
      <button onClick={onRemove} className="ml-0.5 text-slate-400 transition hover:text-slate-700">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function DestinationCard({
  destination,
  isLiked,
  userRating,
  onLike,
  onRate,
  onAddToTrip,
  onClick,
}: {
  destination: Destination;
  isLiked: boolean;
  userRating: number;
  onLike: () => void;
  onRate: (v: number) => void;
  onAddToTrip: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-110"
          aria-label="Add to favorites"
        >
          <Heart className={`h-4 w-4 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
        </button>
        <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-slate-800 backdrop-blur">
          {destination.category}
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1 font-bold leading-snug text-slate-900">{destination.name}</h3>
        <div className="mb-2.5 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{destination.location}</span>
        </div>
        <div className="mb-1.5 flex items-center justify-between">
          <BubbleRating rating={destination.rating} />
          <span className="text-xs font-semibold text-slate-500">{destination.reviews.toLocaleString()} reviews</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-slate-400">Your rating:</span>
          <StarRating value={userRating} onChange={onRate} />
        </div>

        <div className="mb-3 text-sm font-semibold text-slate-700">{destination.price}</div>

        <button
          onClick={(e) => { e.stopPropagation(); onAddToTrip(); }}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add to Trip
        </button>
      </div>
    </motion.div>
  );
}

export function HomePage() {
  const [searchParams] = useSearchParams();
  const urlKeyword = (searchParams.get("q") ?? "").trim();

  const [keyword, setKeyword] = useState(urlKeyword);
  const [activeKeyword, setActiveKeyword] = useState(urlKeyword);

  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceLevel, setPriceLevel] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState({ city: "", minRating: 0, priceLevel: 0 });

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [favorites, setFavorites] = useState<Record<string, Destination>>(loadFavorites);
  const [userRatings, setUserRatings] = useState<Record<string, number>>(readRatings);
  const { addDestinationToTrip, tripActivities } = useTripPlan();

  useEffect(() => {
    if (urlKeyword !== activeKeyword) {
      setKeyword(urlKeyword);
      setActiveKeyword(urlKeyword);
    }
  }, [urlKeyword]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(userRatings));
  }, [userRatings]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchDestinations() {
      try {
        const raw = await locationsApi.search({
          keyword: activeKeyword || undefined,
          category: category || undefined,
          city: city || undefined,
          min_rating: minRating > 0 ? minRating : undefined,
          price_level: priceLevel > 0 ? priceLevel : undefined,
          sort_by: sortBy,
          limit: 50,
        });
        if (!cancelled) setDestinations(raw.map(adaptLocation));
      } catch {
        if (!cancelled) setDestinations([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDestinations();
    return () => { cancelled = true; };
  }, [activeKeyword, category, sortBy, city, minRating, priceLevel]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setActiveKeyword(keyword.trim());
  }

  function openFilters() {
    setDraft({ city, minRating, priceLevel });
    setShowFilters(true);
  }

  function applyFilters() {
    setCity(draft.city);
    setMinRating(draft.minRating);
    setPriceLevel(draft.priceLevel);
    setShowFilters(false);
  }

  function clearDraft() {
    setDraft({ city: "", minRating: 0, priceLevel: 0 });
  }

  function clearAllFilters() {
    setCity("");
    setMinRating(0);
    setPriceLevel(0);
    setCategory("");
    setSortBy("popular");
    setActiveKeyword("");
    setKeyword("");
  }

  function toggleFavorite(destination: Destination) {
    setFavorites((prev) => {
      const next = { ...prev };
      const key = String(destination.id);
      if (next[key]) delete next[key];
      else next[key] = destination;
      saveFavorites(next);
      return next;
    });
  }

  function rateDestination(id: string | number, rating: number) {
    setUserRatings((prev) => ({ ...prev, [String(id)]: rating }));
  }

  const panelFilterCount = (city ? 1 : 0) + (minRating > 0 ? 1 : 0) + (priceLevel > 0 ? 1 : 0);
  const hasActiveFilters = panelFilterCount > 0 || activeKeyword;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Sort";

  return (
    <div className="min-h-screen bg-slate-50">

      <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-emerald-600">
            Explore Vietnam
          </p>
          <h1 className="mb-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Where do you want to go?
          </h1>
          <p className="mb-8 text-slate-500">
            Hotels, restaurants, attractions, beaches & more across Vietnam
          </p>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Destinations, cities, activities..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => { setKeyword(""); setActiveKeyword(""); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-emerald-500 px-7 py-4 font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-95"
            >
              Search
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/favorites"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <Bookmark className="h-4 w-4 text-emerald-500" />
              {Object.keys(favorites).length} Favorites
            </Link>
            <Link
              to="/planning"
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
            >
              <MapPin className="h-4 w-4 text-emerald-500" />
              {tripActivities.length} in Trip
            </Link>
          </div>
        </div>
      </section>

      <div className="sticky top-16 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 py-2.5">
            <div className="flex flex-1 gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              {BACKEND_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                    category === cat.value
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-2">
              <button
                onClick={openFilters}
                className={`relative flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                  panelFilterCount > 0
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {panelFilterCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                    {panelFilterCount}
                  </span>
                )}
              </button>

              <div className="relative" ref={sortMenuRef}>
                <button
                  onClick={() => setShowSortMenu((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="max-w-[110px] truncate">{currentSortLabel}</span>
                  <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showSortMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-slate-50"
                        >
                          {sortBy === opt.value ? (
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                          ) : (
                            <span className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span className={sortBy === opt.value ? "font-semibold text-emerald-700" : "text-slate-700"}>
                            {opt.label}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-slate-100 bg-slate-50"
          >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Active:
              </span>
              {activeKeyword && (
                <FilterPill
                  label={`"${activeKeyword}"`}
                  onRemove={() => { setActiveKeyword(""); setKeyword(""); }}
                />
              )}
              {city && <FilterPill label={city} onRemove={() => setCity("")} />}
              {minRating > 0 && (
                <FilterPill label={`${minRating}★ & up`} onRemove={() => setMinRating(0)} />
              )}
              {priceLevel > 0 && (
                <FilterPill
                  label={PRICE_LEVEL_OPTIONS.find((p) => p.value === priceLevel)?.label ?? ""}
                  onRemove={() => setPriceLevel(0)}
                />
              )}
              <button
                onClick={clearAllFilters}
                className="ml-auto text-xs font-semibold text-slate-500 underline transition hover:text-slate-800"
              >
                Clear all
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!loading && (
          <p className="mb-5 text-sm text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">{destinations.length}</span> places
            {activeKeyword && (
              <> for <span className="font-bold text-slate-900">&ldquo;{activeKeyword}&rdquo;</span></>
            )}
            {city && (
              <> in <span className="font-bold text-slate-900">{city}</span></>
            )}
          </p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-slate-200" />
            ))}
          </div>
        ) : destinations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="mb-2 text-xl font-bold text-slate-900">No results found</h3>
            <p className="mb-4 text-slate-500">Try adjusting your search or filters.</p>
            <button
              onClick={clearAllFilters}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {destinations.map((destination) => (
              <DestinationCard
                key={destination.id}
                destination={destination}
                isLiked={String(destination.id) in favorites}
                userRating={userRatings[String(destination.id)] ?? 0}
                onLike={() => toggleFavorite(destination)}
                onRate={(v) => rateDestination(destination.id, v)}
                onAddToTrip={() => addDestinationToTrip(destination)}
                onClick={() => setSelectedDestination(destination)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Filters</h2>
                  {(draft.city || draft.minRating > 0 || draft.priceLevel > 0) && (
                    <p className="text-xs text-slate-400">
                      {[draft.city, draft.minRating > 0 && `${draft.minRating}★+`, draft.priceLevel > 0 && PRICE_LEVEL_OPTIONS.find(p => p.value === draft.priceLevel)?.label].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">

                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-800">City</label>
                  <select
                    value={draft.city}
                    onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                  >
                    <option value="">All cities</option>
                    {VIET_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-800">Minimum Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setDraft((d) => ({ ...d, minRating: d.minRating === r ? 0 : r }))}
                        className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl border py-2.5 text-xs font-semibold transition ${
                          draft.minRating === r
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <Star
                          className={`h-4 w-4 ${
                            draft.minRating >= r ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                        {r}+
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-3 block text-sm font-bold text-slate-800">Price Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_LEVEL_OPTIONS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() =>
                          setDraft((d) => ({ ...d, priceLevel: d.priceLevel === p.value ? 0 : p.value }))
                        }
                        className={`rounded-xl border px-4 py-3 text-left transition ${
                          draft.priceLevel === p.value
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-semibold">{p.label}</div>
                        <div className="mt-0.5 text-xs text-slate-400">{p.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={clearDraft}
                  className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 active:scale-[0.98]"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
              <div className="relative h-72 overflow-hidden rounded-t-2xl sm:h-80">
                <img
                  src={selectedDestination.image}
                  alt={selectedDestination.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <button
                  onClick={() => setSelectedDestination(null)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-slate-800 backdrop-blur">
                  {selectedDestination.category}
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">
                      {selectedDestination.name}
                    </h2>
                    <div className="mt-1.5 flex items-center gap-1.5 text-slate-500">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{selectedDestination.location}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <BubbleRating rating={selectedDestination.rating} />
                    <p className="mt-1 text-xs text-slate-500">
                      {selectedDestination.reviews.toLocaleString()} reviews
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <Star className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">Your rating:</span>
                  <StarRating
                    value={userRatings[String(selectedDestination.id)] ?? 0}
                    onChange={(v) => rateDestination(selectedDestination.id, v)}
                  />
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <Banknote className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs text-slate-500">Price</p>
                      <p className="font-semibold text-slate-900">{selectedDestination.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <Clock className="h-5 w-5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-xs text-slate-500">Hours</p>
                      <p className="text-sm font-semibold text-slate-900">{selectedDestination.hours}</p>
                    </div>
                  </div>
                </div>

                {selectedDestination.latitude && selectedDestination.longitude && (
                  <div className="mb-6">
                    <h3 className="mb-2 font-bold text-slate-900">Location</h3>
                    <LocationMap
                      locations={[{
                        id: selectedDestination.id,
                        name: selectedDestination.name,
                        latitude: selectedDestination.latitude,
                        longitude: selectedDestination.longitude,
                        category: selectedDestination.category,
                      }]}
                      className="rounded-xl ring-1 ring-slate-200"
                      style={{ height: 200 }}
                    />
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="mb-2 font-bold text-slate-900">About</h3>
                  <p className="text-sm leading-7 text-slate-500">{selectedDestination.fullDescription}</p>
                </div>

                {selectedDestination.features.length > 0 && (
                  <div className="mb-8">
                    <h3 className="mb-3 font-bold text-slate-900">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDestination.features.map((feature, index) => (
                        <span
                          key={index}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    addDestinationToTrip(selectedDestination);
                    setSelectedDestination(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99]"
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
