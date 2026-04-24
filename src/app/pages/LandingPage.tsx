import { useState } from "react";
import { useNavigate } from "react-router";
import { X, MapPin, Plane } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function LandingPage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (authMode === "signup") {
      if (!formData.name) return setError("Name is required");
      if (formData.password !== formData.confirmPassword)
        return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      const endpoint =
        authMode === "signup"
          ? "http://127.0.0.1:8000/auth/register"
          : "http://127.0.0.1:8000/auth/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      navigate("/home");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    window.location.href = `http://127.0.0.1:8000/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a3a52] via-[#2d5f7f] to-[#34e0a1] relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="px-8 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <MapPin className="w-7 h-7 text-black" />
          </div>
          <span className="text-2xl font-bold text-white">
            Travel Planner
          </span>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => {
              setAuthMode("signin");
              setShowAuthModal(true);
            }}
            className="text-white hover:text-primary"
          >
            Sign In
          </button>

          <button
            onClick={() => {
              setAuthMode("signup");
              setShowAuthModal(true);
            }}
            className="bg-primary px-4 py-2 rounded-lg hover:bg-primary/90"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center text-center px-6 mt-20 relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold text-white mb-6"
        >
          Plan Smarter.
          <br />
          Travel <span className="text-primary">Better.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg text-gray-200 mb-10 max-w-2xl"
        >
          Your AI-powered travel planner to build itineraries, discover
          destinations, and organize trips effortlessly.
        </motion.p>

        {/* ✅ ONLY CTA BUTTON */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              setAuthMode("signup");
              setShowAuthModal(true);
            }}
            className="bg-primary px-12 py-4 rounded-xl text-lg font-semibold flex items-center gap-2 shadow-xl hover:scale-105 hover:shadow-2xl transition"
          >
            <Plane className="w-5 h-5" />
            Start Your Journey
          </button>
        </div>
      </div>

      {/* Features */}
      <div className="px-8 py-20 relative z-10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">
              Discover Destinations
            </h3>
            <p className="text-gray-300 text-sm">
              Explore curated travel spots with real insights.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">
              AI Planning
            </h3>
            <p className="text-gray-300 text-sm">
              Generate smart itineraries instantly with AI.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-2xl">
            <h3 className="text-white text-lg font-semibold mb-2">
              Collaborate
            </h3>
            <p className="text-gray-300 text-sm">
              Plan trips together with friends and family.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowAuthModal(false)}
            />

            <motion.div className="relative bg-white p-8 rounded-2xl w-full max-w-md">
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4"
              >
                <X />
              </button>

              <h2 className="text-2xl mb-4">
                {authMode === "signin" ? "Sign In" : "Sign Up"}
              </h2>

              {error && (
                <p className="text-red-500 text-sm mb-2">{error}</p>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 border rounded"
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
                  className="w-full p-2 border rounded"
                />

                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded"
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
                    className="w-full p-2 border rounded"
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary py-2 rounded"
                >
                  {loading
                    ? "Loading..."
                    : authMode === "signin"
                    ? "Sign In"
                    : "Sign Up"}
                </button>
              </form>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => handleSocialLogin("google")}
                  className="w-full border py-2 rounded"
                >
                  Continue with Google
                </button>

                <button
                  onClick={() => handleSocialLogin("facebook")}
                  className="w-full border py-2 rounded"
                >
                  Continue with Facebook
                </button>
              </div>

              <p className="mt-4 text-sm text-center">
                {authMode === "signin"
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  onClick={() =>
                    setAuthMode(authMode === "signin" ? "signup" : "signin")
                  }
                  className="ml-2 text-blue-500"
                >
                  Switch
                </button>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}