import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  Globe2,
  Route,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { authApi } from "../lib/api";

function LogoMark() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl">
      <img src="/logo.png" alt="Travel Planner logo" className="h-full w-full object-contain" />
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (authMode === "signup") {
      if (!formData.name.trim()) return setError("Name is required");
      if (formData.password !== formData.confirmPassword)
        return setError("Passwords do not match");
    }

    setLoading(true);
    try {
      const data =
        authMode === "signup"
          ? await authApi.register(formData.email, formData.password)
          : await authApi.login(formData.email, formData.password);

      localStorage.removeItem("guestMode");
      localStorage.setItem("userEmail", formData.email);
      if (data.access_token) localStorage.setItem("token", data.access_token);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-950 antialiased">

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2.5 transition hover:opacity-80"
            aria-label="Travel Planner home"
          >
            <LogoMark />
            <span className="text-[15px] font-bold tracking-tight text-slate-900">
              Travel Planner
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuth("signin")}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuth("signup")}
              className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-emerald-600 hover:shadow-md"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section className="px-6 py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              Smart travel planning made simple
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
              Discover places,{" "}
              <span className="text-emerald-600">plan trips,</span>{" "}
              and organize your journey
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-500">
              Travel Planner combines destination browsing, trip planning, and a
              simple AI-style helper so your whole travel flow feels connected —
              in one clean website.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => openAuth("signup")}
                className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                Sign Up Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => openAuth("signin")}
                className="rounded-full border border-slate-300 px-7 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Sign In
              </button>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-slate-500">
              {["Destination discovery", "Trip planning", "AI assistant demo"].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/20">
              <img
                src="/scenery.png"
                alt="Beautiful travel scenery"
                className="h-[26rem] w-full object-cover object-center"
              />
              <div className="absolute inset-x-4 bottom-4">
                <div className="flex items-center gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      Create smoother travel experiences
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      Search, compare, and plan from one interface
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-emerald-50 px-4 py-2.5 text-center ring-1 ring-emerald-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
                      Top rated
                    </p>
                    <p className="mt-0.5 text-xl font-black text-emerald-700">4.9</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 -top-3 rounded-2xl bg-[#0f273e] px-4 py-2.5 shadow-xl">
              <p className="text-xs font-bold text-emerald-400">AI-Powered</p>
              <p className="text-sm font-extrabold text-white">Trip Planner</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 text-center"
          >
            <span className="mb-3 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700">
              Everything you need
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Create smoother travel experiences
            </h2>
            <p className="mx-auto mt-4 max-w-md text-slate-500">
              Search, compare, and plan from one clean interface.
            </p>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0 }}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <Globe2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Discover places faster</h3>
              <p className="mt-2.5 text-sm leading-7 text-slate-500">
                Hotels, beaches, food, bars, and attractions in one modern layout.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#0f273e] text-emerald-400">
                <Route className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">Build your trip easily</h3>
              <p className="mt-2.5 text-sm leading-7 text-slate-500">
                Add destinations into your itinerary with a simple interaction flow.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl bg-white p-7 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900">AI assistant demo</h3>
              <p className="mt-2.5 text-sm leading-7 text-slate-500">
                Get suggestions and assistance for planning your perfect journey.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-14">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl"
        >
          <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-8 text-center sm:px-8 sm:py-0">
              <p className="text-4xl font-black text-[#0f273e]">4.9 / 5</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Top rated</p>
            </div>
            <div className="py-8 text-center sm:px-8 sm:py-0">
              <p className="text-4xl font-black text-[#0f273e]">3-in-1</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Discover, plan &amp; assist</p>
            </div>
            <div className="py-8 text-center sm:px-8 sm:py-0">
              <p className="text-4xl font-black text-[#0f273e]">100%</p>
              <p className="mt-2 text-sm font-medium text-slate-500">Free to get started</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_10%_10%,#0c4a5b_0%,#0f273e_44%,#0b1020_100%)] px-6 py-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,#ffffff06_1px,transparent_1px)] bg-[size:28px_28px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-2xl"
        >
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Start planning your next journey
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg text-slate-300">
            Join travelers who use Travel Planner to discover, plan, and organize
            their trips — all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => openAuth("signup")}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400"
            >
              Sign Up Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => openAuth("signin")}
              className="rounded-full border border-white/20 px-8 py-4 text-base font-semibold text-white/90 transition hover:border-white/40 hover:bg-white/10"
            >
              Sign In
            </button>
          </div>
        </motion.div>
      </section>

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
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
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

              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                )}
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
                {authMode === "signup" && (
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-bold text-white shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {authMode === "signin" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <Star className="h-5 w-5" />
                  )}
                  {loading ? "Loading..." : authMode === "signin" ? "Sign In" : "Sign Up"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500">
                {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                  className="ml-2 font-bold text-emerald-600 hover:text-emerald-700"
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
