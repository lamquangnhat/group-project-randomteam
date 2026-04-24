import { Link, useLocation } from "react-router";
import { Search, Menu, User, MapPin } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <MapPin className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold text-foreground">Travel Planner</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search destinations, hotels, activities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/home"
              className={`hover:text-primary transition-colors ${isActive('/home') ? 'text-primary' : 'text-foreground'}`}
            >
              Explore
            </Link>
            <Link
              to="/planning"
              className={`hover:text-primary transition-colors ${isActive('/planning') ? 'text-primary' : 'text-foreground'}`}
            >
              Plan Trip
            </Link>
            <Link
              to="/ai-assistant"
              className={`hover:text-primary transition-colors ${isActive('/ai-assistant') ? 'text-primary' : 'text-foreground'}`}
            >
              AI Assistant
            </Link>
            <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
