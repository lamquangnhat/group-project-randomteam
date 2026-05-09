import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Plane } from "lucide-react";
import { useEffect, useState } from "react";

function getSessionEmail() {
  if (typeof window === "undefined") {
    return "";
  }

  if (window.localStorage.getItem("guestMode") === "true") {
    return "guest@travelplanner.com";
  }

  if (window.localStorage.getItem("token")) {
    return window.localStorage.getItem("userEmail") || "user@travelplanner.com";
  }

  return "";
}

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") ?? "");
  const [sessionEmail, setSessionEmail] = useState(getSessionEmail);

  useEffect(() => {
    const syncSession = () => setSessionEmail(getSessionEmail());

    window.addEventListener("storage", syncSession);
    window.addEventListener("auth-changed", syncSession);

    return () => {
      window.removeEventListener("storage", syncSession);
      window.removeEventListener("auth-changed", syncSession);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("q", value);
    } else {
      params.delete("q");
    }

    const queryString = params.toString();
    navigate({
      pathname: "/home",
      search: queryString ? `?${queryString}` : "",
    });
  };

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("guestMode");
    window.localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  const linkClass = (path: string) =>
    `rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
      isActive(path)
        ? "bg-slate-950 text-white shadow-md shadow-slate-900/10"
        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/home" className="flex shrink-0 items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00d998] via-[#28e6ad] to-[#087a72] shadow-sm ring-1 ring-white">
              <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#ff5a5f] ring-2 ring-white" />
              <Plane className="h-5 w-5 -rotate-45 text-white" />
            </div>
            <span className="hidden text-xl font-bold text-foreground sm:inline">Travel Planner</span>
          </Link>

          <div className="min-w-44 max-w-sm flex-1 md:max-w-md lg:max-w-lg">
            <input
              type="text"
              placeholder="Search by title or tag..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-full border border-border bg-input-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
            <Link to="/home" className={linkClass("/home")}>
              Home
            </Link>
            <Link to="/planning" className={linkClass("/planning")}>
              Plan Trip
            </Link>
            <Link to="/ai-assistant" className={linkClass("/ai-assistant")}>
              AI Assistant
            </Link>

            {sessionEmail && (
              <>
                <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 md:inline-flex">
                  {sessionEmail}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
