import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Image, Bell, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import logo from "@/assets/wenyasha-logo.jpg";
import HeroCarousel from "@/components/home/HeroCarousel";
import RemarksSection from "@/components/home/RemarksSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import AdmissionsSection from "@/components/home/AdmissionsSection";
import HighlightsSection from "@/components/home/HighlightsSection";
import DepartmentsSection from "@/components/home/DepartmentsSection";
import ClubsSection from "@/components/home/ClubsSection";

const quickLinks = [
  { icon: BookOpen, title: "Academics", description: "Explore our curriculum", path: "/academics" },
  { icon: Image, title: "Gallery", description: "View school memories", path: "/gallery" },
  { icon: Bell, title: "Announcements", description: "Latest updates", path: "/announcements" },
  { icon: Calendar, title: "Events", description: "Upcoming activities", path: "/announcements" },
];

const upcomingEvents = [
  { date: "Jan 15", title: "New Term Begins", type: "Academic" },
  { date: "Jan 22", title: "Parent-Teacher Meeting", type: "Meeting" },
  { date: "Feb 5", title: "Inter-School Sports Day", type: "Sports" },
  { date: "Feb 14", title: "Valentine Day", type: "Academic" },
];

const newsHighlights = [
  {
    title: "Students Excel in Chess competitions at NICAZ District level.",
    excerpt: "Our students secured top positions in the 2025 NICAZ District Competitions.",
    date: "Marc 20, 2026",
  },
  {
    title: "New Computer Lab Inaugurated",
    excerpt: "State-of-the-art computer laboratory with 50 workstations now open.",
    date: "Dec 15, 2026",
  },
  {
    title: "Annual Sports Day Success",
    excerpt: "Record participation and outstanding performances at this year's sports day.",
    date: "Dec 01, 2026",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero Section with Cinematic Carousel */}
      <section className="relative h-screen w-full">
        <HeroCarousel />

        {/* Simple bottom motto bar for professional balance */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-r from-forest-dark/95 via-forest/90 to-forest-dark/95 backdrop-blur-sm py-5 border-t border-white/10">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/90 text-lg md:text-xl font-heading font-medium tracking-wide animate-fade-in">
              "Equipping & enabling learners to develop their full potential."
            </p>
          </div>
        </div>
      </section>

      {/* Highlights Section - Green cards */}
      <HighlightsSection />

      {/* Departments Section */}
      <DepartmentsSection />

      {/* Clubs Section */}
      <ClubsSection />

      {/* Remarks Section */}
      <RemarksSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Admissions Section */}
      <AdmissionsSection />

      {/* Quick Links Section */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">
            Quick Access
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 perspective-1500">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                to={link.path}
                className="group p-6 rounded-xl bg-card border border-border card-3d shadow-3d"
              >
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4 icon-3d">
                  <link.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
                  {link.title}
                </h3>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* Events & News Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Upcoming Events
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/announcements">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-background border border-border hover:border-accent/30 transition-all"
                  >
                    <div className="h-14 w-14 rounded-lg bg-accent flex flex-col items-center justify-center text-accent-foreground shrink-0">
                      <span className="text-xs font-medium">{event.date.split(" ")[0]}</span>
                      <span className="text-lg font-bold">{event.date.split(" ")[1]}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{event.title}</h4>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {event.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News Highlights */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  News Highlights
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/announcements">
                    View All <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="space-y-4">
                {newsHighlights.map((news, index) => (
                  <div
                    key={index}
                    className="p-5 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <p className="text-xs text-accent font-medium mb-2">{news.date}</p>
                    <h4 className="font-semibold text-foreground mb-2">{news.title}</h4>
                    <p className="text-sm text-muted-foreground">{news.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Take the first step towards an exceptional education.
            Contact us today to learn more about admissions.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
            <Button variant="outline-light" size="lg" asChild>
              <Link to="/about">About Our School</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
