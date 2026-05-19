import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Heart,
  MapPin,
  Star,
  Plus,
  X,
  Banknote,
  Clock,
} from "lucide-react";
import { useTripPlan, type Destination } from "../context/TripPlanContext";
import { LocationMap } from "../components/LocationMap";

export const FAVORITES_KEY = "travelPlanner.favorites";
const RATINGS_KEY = "travelPlanner.userRatings";

export function loadFavorites(): Record<string, Destination> {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveFavorites(favs: Record<string, Destination>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function readRatings(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(RATINGS_KEY) ?? "{}");
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

function FavCard({
  destination,
  userRating,
  onRate,
  onRemove,
  onAddToTrip,
  onClick,
}: {
  destination: Destination;
  userRating: number;
  onRate: (v: number) => void;
  onRemove: () => void;
  onAddToTrip: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
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
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition hover:scale-110"
          aria-label="Remove from favorites"
        >
          <Heart className="h-4 w-4 fill-red-500 text-red-500 transition-colors hover:fill-slate-300 hover:text-slate-400" />
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
          <span className="text-xs font-semibold text-slate-500">
            {destination.reviews.toLocaleString()} reviews
          </span>
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

export function FavoritesPage() {
  const [favorites, setFavorites] = useState<Record<string, Destination>>(loadFavorites);
  const [userRatings, setUserRatings] = useState<Record<string, number>>(readRatings);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const { addDestinationToTrip } = useTripPlan();

  useEffect(() => {
    localStorage.setItem(RATINGS_KEY, JSON.stringify(userRatings));
  }, [userRatings]);

  const destinations = Object.values(favorites);

  function removeFavorite(id: string | number) {
    setFavorites((prev) => {
      const next = { ...prev };
      delete next[String(id)];
      saveFavorites(next);
      return next;
    });
  }

  function rateDestination(id: string | number, rating: number) {
    setUserRatings((prev) => ({ ...prev, [String(id)]: rating }));
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <section className="border-b border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-4">
            <Link
              to="/home"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                My Favorites
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                {destinations.length} {destinations.length === 1 ? "place" : "places"} saved
              </p>
            </div>
            {destinations.length > 0 && (
              <Link
                to="/home"
                className="hidden rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-600 sm:block"
              >
                Browse more
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {destinations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-24 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 ring-1 ring-slate-200">
              <Heart className="h-9 w-9 text-slate-300" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-900">No favorites yet</h2>
            <p className="mx-auto mb-6 max-w-sm text-sm text-slate-500">
              Click the heart icon on any destination to save it here for quick access.
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-600"
            >
              Browse destinations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            <AnimatePresence mode="popLayout">
              {destinations.map((destination) => (
                <FavCard
                  key={destination.id}
                  destination={destination}
                  userRating={userRatings[String(destination.id)] ?? 0}
                  onRate={(v) => rateDestination(destination.id, v)}
                  onRemove={() => removeFavorite(destination.id)}
                  onAddToTrip={() => addDestinationToTrip(destination)}
                  onClick={() => setSelectedDestination(destination)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

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
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
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
                      {selectedDestination.features.map((feature, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => removeFavorite(selectedDestination.id)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      addDestinationToTrip(selectedDestination);
                      setSelectedDestination(null);
                    }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.99]"
                  >
                    <Plus className="h-5 w-5" />
                    Add to Trip Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
