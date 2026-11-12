import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import { getStoredUser, clearAuth } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { dashboardPathForRole, normalizePortalRole } from "@/lib/portalRoles";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "About Us", path: "/about" },
  { name: "Academics", path: "/academics" },
<<<<<<< HEAD
  { name: "Departments", path: "/departments" },
=======
>>>>>>> 551f0b25b96788a1c8529fe96f2591c586561a1d
  { name: "Admissions", path: "/admissions" },
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

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) => location.pathname === path;
  const dashboardPath = dashboardPathForRole(user?.role);
  const isHomePage = location.pathname === "/";
<<<<<<< HEAD
  const useSolidHeader = scrolled || (!isHomePage && ["/about", "/academics", "/departments", "/admissions", "/announcements", "/portal", "/auth", "/signup"].includes(location.pathname));
=======
  const useSolidHeader = scrolled || (!isHomePage && ["/about", "/academics", "/admissions", "/announcements", "/portal", "/auth", "/signup"].includes(location.pathname));
>>>>>>> 551f0b25b96788a1c8529fe96f2591c586561a1d
  const headerSurface = useSolidHeader
    ? "bg-[#10264f]/95 backdrop-blur-md border-b border-white/10 shadow-lg"
    : "bg-transparent";

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full text-white transition-all duration-300 ${headerSurface}`}>
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex shrink-0 items-center gap-2">
            <span className="rounded bg-white/10 p-1.5 backdrop-blur-md transition-colors group-hover:bg-white/20">
              <img src={logo} alt="Able God College" className="h-12 w-12 object-contain" />
            </span>
            <span className="ml-1 hidden border-l border-white/30 pl-3 sm:block">
              <span className="block whitespace-nowrap text-base font-extrabold leading-tight tracking-tight text-white lg:text-lg">Able God</span>
              <span className="block whitespace-nowrap text-base font-extrabold leading-tight tracking-tight text-white lg:text-lg">College</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0 md:flex md:gap-1 lg:gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-bold tracking-wide transition-all duration-300 lg:px-2 lg:text-base ${isActive(link.path)
                  ? "border-[#f36b8e] text-[#f36b8e]"
                  : "border-transparent text-white/90 hover:text-[#f36b8e]"
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Portal Button / User Menu */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                  <UserIcon className="h-4 w-4 text-accent" />
                  <span className="text-white text-sm font-medium">{user.full_name || user.username}</span>
                  {normalizePortalRole(user.role) === 'admin' && <Shield className="h-3 w-3 text-red-400" />}
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
                  <Link to={dashboardPath || "/auth"}>
                    Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <Link to="/auth" className="inline-flex items-center justify-center rounded-md border border-[#d42d35] bg-[#d42d35] px-3 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:border-[#b51e27] hover:bg-[#b51e27] lg:px-5">Login</Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white transition-colors hover:text-[#f36b8e] md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-20 rounded-b-2xl border-t border-white/15 bg-[#10264f]/95 px-4 py-4 shadow-2xl backdrop-blur-md animate-fade-in md:hidden">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-base font-bold transition-all ${isActive(link.path)
                    ? "bg-white/10 text-[#f36b8e]"
                    : "text-white/90 hover:bg-white/5 hover:text-[#f36b8e]"
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
                      <Link to={dashboardPath || "/auth"} onClick={() => setIsOpen(false)}>
                        Go to Dashboard
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-white/70 hover:text-red-400"
                      onClick={handleLogout}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsOpen(false)} className="inline-flex w-full items-center justify-center rounded-md border border-[#d42d35] bg-[#d42d35] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#b51e27] hover:bg-[#b51e27]">
                    Secure Login
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
