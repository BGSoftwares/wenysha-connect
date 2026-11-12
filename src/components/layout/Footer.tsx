import { Link } from "react-router-dom";
import { Phone, MapPin } from "lucide-react";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";
import { DeveloperSignature } from "./DeveloperSignature";

const quickLinks = [
  { name: "About Us", path: "/about" },
  { name: "Academics", path: "/academics" },
  { name: "Departments", path: "/departments" },
  { name: "Admissions", path: "/admissions" },
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
                alt="Able God College"
                className="h-16 w-16 object-contain bg-card rounded-lg p-1"
              />
              <div>
                <h3 className="font-heading text-xl font-bold">Able God College</h3>
                <p className="text-sm text-primary-foreground/70">B'Ezrat Hesham</p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Honour God • Respect Others • Excel in All You Do
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
                  {schoolContact.address}
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <span className="text-primary-foreground/80">
                  {schoolContact.phones.map((phone, index) => (
                    <span key={phone.href}>
                      {index > 0 && <br />}
                      <a href={phone.href} className="hover:text-white">{phone.label}</a>
                    </span>
                  ))}
                </span>
              </li>
            </ul>

          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center text-sm text-primary-foreground/60 md:flex-row md:text-left">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-4">
              <p>© 2026 Able God College. All rights reserved.</p>
              <span className="hidden text-primary-foreground/30 sm:inline" aria-hidden="true">|</span>
              <DeveloperSignature />
            </div>
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
