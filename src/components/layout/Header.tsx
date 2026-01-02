import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wenyasha-logo.jpg";

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
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                  isActive(link.path)
                    ? "text-accent border-accent"
                    : "text-white/90 border-transparent hover:text-accent hover:border-accent/50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Portal Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-accent text-accent hover:bg-accent hover:text-accent-foreground font-semibold"
              asChild
            >
              <Link to="/portal">Student Portal</Link>
            </Button>
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
          <div className="lg:hidden py-4 border-t border-white/20 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? "bg-accent/20 text-accent"
                      : "text-white/90 hover:text-accent hover:bg-white/5"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-white/20">
                <Button 
                  variant="outline" 
                  className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground" 
                  asChild
                >
                  <Link to="/portal" onClick={() => setIsOpen(false)}>
                    Student Portal
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
      {/* Gradient line at bottom */}
      <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
    </header>
  );
};
