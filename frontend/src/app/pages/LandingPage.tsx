import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  Globe2,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import roadImage from "../../assets/landing-road.png";
import travelLogoIcon from "../../assets/travel-logo-icon.png";
import { authApi } from "../lib/api";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.93 10.93 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path
        fill="white"
        d="M15.36 8.86h-2.02c-.31 0-.65.4-.65.94v1.46h2.67l-.4 2.2h-2.27v6.44h-2.53v-6.44H8.04v-2.2h2.12V9.94c0-1.88 1.18-3.41 3.03-3.41h2.17v2.33Z"
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-xl shadow-slate-950/10 ring-1 ring-white/70">
      <img
        src={travelLogoIcon}
        alt="Travel Planner logo"
        className="h-12 w-12 object-contain"
      />
    </div>
  );
}

export function LandingPage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setError("");
    setShowAuthModal(true);
  };

  const handleGuestLogin = () => {
    localStorage.removeItem("token");
    localStorage.setItem("guestMode", "true");
    localStorage.setItem("userEmail", "guest@travelplanner.com");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/home");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (authMode === "signup") {
      if (!formData.name.trim()) {
        return setError("Name is required");
      }

      if (formData.password !== formData.confirmPassword) {
        return setError("Passwords do not match");
      }
    }

    setLoading(true);

    try {
      const data =
        authMode === "signup"
          ? await authApi.register(formData.email, formData.password)
          : await authApi.login(formData.email, formData.password);

      localStorage.removeItem("guestMode");
      localStorage.setItem("userEmail", formData.email);

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      window.dispatchEvent(new Event("auth-changed"));
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    setError(
      provider === "google"
        ? "Google sign-in needs a real Google ID token before it can call the backend /auth/google endpoint. Use email/password or Guest for now."
        : "Facebook sign-in is a UI placeholder because the current backend does not include a Facebook auth endpoint yet. Use email/password or Guest for now."
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-4 text-slate-950 sm:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 py-2">
        <button
          onClick={() => navigate("/")}
          className="group flex items-center gap-3 rounded-2xl text-left transition hover:opacity-90"
          aria-label="Travel Planner home"
        >
          <LogoMark />

          <span>
            <span className="block text-base font-bold leading-tight text-slate-950 sm:text-lg">
              Travel Planner
            </span>
            <span className="block text-xs font-medium text-slate-500">
              Travel website frontend
            </span>
          </span>
        </button>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={() => openAuth("signin")}
            className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            Sign In
          </button>

          <button
            onClick={() => openAuth("signup")}
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Sign Up
          </button>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-7xl overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_10%_10%,#0c4a5b_0%,#0f273e_44%,#0b1020_100%)] p-6 shadow-2xl shadow-slate-900/15 ring-1 ring-white/70 sm:p-10 lg:p-12">
        <div className="grid min-h-[660px] items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-2xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 shadow-lg shadow-black/10 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Smart travel planning made simple
            </div>

            <h1 className="text-4xl font-extrabold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              Discover places, plan trips, and organize your journey in one
              website
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-slate-200/90">
              Travel Planner combines destination browsing, trip planning, and a
              simple AI-style helper so your whole travel flow feels connected.
            </p>

            <button
              onClick={() => openAuth("signup")}
              className="mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-emerald-400 px-7 py-3.5 text-base font-black text-slate-950 shadow-xl shadow-emerald-500/25 transition hover:-translate-y-0.5 hover:bg-emerald-300"
            >
              <Star className="h-5 w-5" />
              Sign Up Free
            </button>

            <div className="mt-6 flex flex-wrap gap-3">
              {["Destination discovery", "Trip planning", "AI assistant demo"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-xs font-semibold text-emerald-100"
                  >
                    {item}
                  </span>
                )
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="grid gap-5"
          >
            <div className="overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-2xl shadow-black/25">
              <img
                src={roadImage}
                alt="Open road through a red-rock canyon"
                className="h-72 w-full rounded-[1.35rem] object-cover sm:h-80"
              />

              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Create smoother travel experiences
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Search, compare, and plan from one clean website interface.
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 px-5 py-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
                    Top rated
                  </p>
                  <p className="mt-1 text-xl font-black text-emerald-700">
                    4.9 / 5
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[1.65rem] bg-white/95 p-6 shadow-xl shadow-black/15 ring-1 ring-white/80">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Globe2 className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  Discover places faster
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Hotels, beaches, food, bars, and attractions in one modern
                  layout.
                </p>
              </div>

              <div className="rounded-[1.65rem] bg-white/95 p-6 shadow-xl shadow-black/15 ring-1 ring-white/80">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <Route className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-950">
                  Build your trip easily
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Add destinations into your itinerary with a simple interaction
                  flow.
                </p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>

      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
          >
            <button
              aria-label="Close authentication modal"
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              onClick={() => setShowAuthModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ duration: 0.2 }}
              className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute right-5 top-5 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-6 flex items-center gap-3">
                <LogoMark />

                <div>
                  <h2 className="text-2xl font-black text-slate-950">
                    {authMode === "signin" ? "Sign in" : "Create account"}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {authMode === "signin"
                      ? "Welcome back to Travel Planner."
                      : "Start planning your next journey."}
                  </p>
                </div>
              </div>

              {error && (
                <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => handleSocialLogin("google")}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin("facebook")}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <FacebookIcon />
                  Continue with Facebook
                </button>

                <button
                  onClick={handleGuestLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  <UserRound className="h-5 w-5" />
                  Continue as Guest
                </button>
              </div>

              <div className="my-6 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                )}

                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />

                {authMode === "signup" && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authMode === "signin" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}

                  {loading
                    ? "Loading..."
                    : authMode === "signin"
                      ? "Sign In"
                      : "Sign Up"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                {authMode === "signin"
                  ? "Don't have an account?"
                  : "Already have an account?"}

                <button
                  onClick={() =>
                    setAuthMode(authMode === "signin" ? "signup" : "signin")
                  }
                  className="ml-2 font-bold text-emerald-700 hover:text-emerald-800"
                >
                  {authMode === "signin" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
