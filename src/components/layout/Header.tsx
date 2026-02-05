import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wenyasha-logo.jpg";
import { getStoredUser, clearAuth } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Academics", path: "/academics" },
  { name: "Gallery", path: "/gallery" },
  { name: "Announcements", path: "/announcements" },
  { name: "Contact", path: "/contact" },
];

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check user on mount and location change
    setUser(getStoredUser());
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 w-full bg-gradient-to-b from-forest-dark/95 to-forest-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Wenyasha International School"
              className="h-14 w-14 object-contain rounded-lg border-2 border-accent/30 transition-transform group-hover:scale-105"
            />
            <div className="hidden sm:block">
              <h1 className="font-heading text-xl font-bold text-white leading-tight drop-shadow-md">
                Wenyasha
              </h1>
              <p className="text-xs text-accent font-medium">International School</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${isActive(link.path)
                  ? "text-accent border-accent"
                  : "text-white/90 border-transparent hover:text-accent hover:border-accent/50"
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Portal Button / User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                  <UserIcon className="h-4 w-4 text-accent" />
                  <span className="text-white text-sm font-medium">{user.full_name || user.username}</span>
                  {user.role === 'admin' && <Shield className="h-3 w-3 text-red-400" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white/70 hover:text-red-400 gap-2 hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  asChild
                  className="rounded-full px-6 shadow-lg shadow-accent/20"
                >
                  <Link to={`/${user.role === 'admin' ? 'admin' : user.role === 'parent' ? 'parent-portal' : 'portal'}`}>
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold rounded-full px-8"
                asChild
              >
                <Link to="/auth">Secure Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-white/20 animate-fade-in bg-forest-dark/95 absolute top-20 left-0 right-0 px-4 rounded-b-2xl shadow-2xl">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(link.path)
                    ? "bg-accent/20 text-accent"
                    : "text-white/90 hover:text-accent hover:bg-white/5"
                    }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/20 flex flex-col gap-3">
                {user ? (
                  <>
                    <div className="px-4 py-3 bg-white/5 rounded-xl flex items-center justify-between">
                      <span className="text-white text-sm font-bold">{user.full_name || user.username}</span>
                      <Badge variant="outline" className="text-accent border-accent/30 lowercase">{user.role}</Badge>
                    </div>
                    <Button
                      variant="gold"
                      className="w-full"
                      asChild
                    >
                      <Link to={`/${user.role === 'admin' ? 'admin' : user.role === 'parent' ? 'parent-portal' : 'portal'}`} onClick={() => setIsOpen(false)}>
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-white/70 hover:text-red-400"
                      onClick={handleLogout}
                    >
                      Log Out
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                    asChild
                  >
                    <Link to="/auth" onClick={() => setIsOpen(false)}>
                      Secure Login
                    </Link>
                  </Button>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
      {/* Gradient line at bottom */}
      <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent opacity-50" />
    </header>
  );
};
