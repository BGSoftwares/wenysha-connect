import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import logo from "@/assets/wenyasha-logo.jpg";

const quickLinks = [
  { name: "About Us", path: "/about" },
  { name: "Academics", path: "/academics" },
  { name: "Gallery", path: "/gallery" },
  { name: "Announcements", path: "/announcements" },
  { name: "Contact", path: "/contact" },
];

const portalLinks = [
  { name: "Student Portal", path: "/portal" },
  { name: "Teacher Portal", path: "/portal" },
  { name: "Admin Portal", path: "/portal" },
];

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* School Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src={logo} 
                alt="Wenyasha International School" 
                className="h-16 w-16 object-contain bg-card rounded-lg p-1"
              />
              <div>
                <h3 className="font-heading text-xl font-bold">Wenyasha</h3>
                <p className="text-sm text-primary-foreground/70">International School</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Smart • Innovative • Infinite
            </p>
            <p className="text-primary-foreground/70 text-sm">
              Nurturing future leaders through excellence in education.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 text-accent">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Access */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 text-accent">Portal Access</h4>
            <ul className="space-y-2">
              {portalLinks.map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 text-accent">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 mt-0.5 text-accent shrink-0" />
                <span className="text-primary-foreground/80">
                  123 Education Drive, Harare, Zimbabwe
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <span className="text-primary-foreground/80">+263 242 123 456</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <span className="text-primary-foreground/80">info@wenyasha.edu.zw</span>
              </li>
            </ul>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="h-9 w-9 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <p>© 2026 Wenyasha International School. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-accent transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
