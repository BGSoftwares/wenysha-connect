import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  // Reveal public page sections as they enter the viewport.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".site-starlink main section");
    sections.forEach((s) => s.classList.add("sl-reveal"));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("sl-visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [location.pathname]);

  return (
    <div className="site-starlink min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};
