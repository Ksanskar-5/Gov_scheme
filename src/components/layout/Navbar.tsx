import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Menu, X, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Add scroll listener for enhanced shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${isScrolled
          ? 'border-border/50 bg-card/80 backdrop-blur-xl shadow-md'
          : 'border-border/30 bg-card/95 backdrop-blur-md'
        }`}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="container-gov">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">जन</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-foreground">JanScheme</span>
              <span className="text-xs block text-muted-foreground">Government Scheme Advisor</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search schemes in simple words..."
                className="pl-10 pr-4 w-full bg-secondary border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search government schemes"
              />
            </div>
          </form>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              Home
            </Link>
            <Link
              to="/search"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/search")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              Browse Schemes
            </Link>
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive("/dashboard")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              Dashboard
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2">
            {!isAuthenticated ? (
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" asChild>
                <Link to="/login">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            ) : (
              <>
                <div className="hidden md:flex flex-col items-end mr-2">
                  <span className="text-sm font-medium">{user?.name || user?.email}</span>
                  <span className="text-xs text-muted-foreground">User</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex"
                  onClick={logout}
                >
                  Logout
                </Button>
                <Button size="sm" className="hidden sm:flex gap-2 bg-accent hover:bg-accent/90" asChild>
                  <Link to="/profile">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search schemes..."
                  className="pl-10 pr-4 w-full bg-secondary border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search government schemes"
                />
              </div>
            </form>

            <nav className="flex flex-col gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/search") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Schemes
              </Link>
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/dashboard") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/my-schemes"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive("/my-schemes") ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                My Schemes
              </Link>
              <hr className="my-2 border-border" />
              <Link
                to="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/profile"
                className="px-3 py-2 rounded-md text-sm font-medium text-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
