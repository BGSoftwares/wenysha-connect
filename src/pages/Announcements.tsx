import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Bell, Calendar, BookOpen, Award, Users, Filter } from "lucide-react";

const categories = ["All", "Academic", "Events", "Sports", "Administrative"];

const announcements = [
  {
    id: 1,
    category: "Academic",
    title: "Mid-Term Examinations Schedule Released",
    content: "The mid-term examination timetable for all grades has been released. Please check the portal for detailed schedules and examination venues.",
    date: "Dec 28, 2025",
    important: true,
  },
  {
    id: 2,
    category: "Events",
    title: "Annual Prize Giving Day - Save the Date",
    content: "Our Annual Prize Giving Ceremony will be held on January 30th, 2026. All parents and guardians are cordially invited to attend.",
    date: "Dec 25, 2025",
    important: true,
  },
  {
    id: 3,
    category: "Sports",
    title: "Inter-School Sports Day Results",
    content: "Congratulations to all our athletes who participated in the Inter-School Sports Day. We secured 2nd place overall!",
    date: "Dec 20, 2025",
    important: false,
  },
  {
    id: 4,
    category: "Administrative",
    title: "Holiday Closure Notice",
    content: "The school office will be closed from December 23rd to January 2nd for the holiday break. Emergency contacts are available.",
    date: "Dec 18, 2025",
    important: false,
  },
  {
    id: 5,
    category: "Academic",
    title: "New Computer Lab Now Open",
    content: "We are pleased to announce that our new state-of-the-art computer laboratory is now fully operational with 50 workstations.",
    date: "Dec 15, 2025",
    important: false,
  },
  {
    id: 6,
    category: "Events",
    title: "Parent-Teacher Conference Scheduled",
    content: "The next Parent-Teacher Conference will be held on January 22nd, 2026. Please book your appointment through the portal.",
    date: "Dec 12, 2025",
    important: true,
  },
];

const upcomingEvents = [
  { date: "Jan 6", title: "New Term Begins", type: "Academic" },
  { date: "Jan 15", title: "Grade 7 Orientation", type: "Academic" },
  { date: "Jan 22", title: "Parent-Teacher Meeting", type: "Meeting" },
  { date: "Jan 30", title: "Prize Giving Day", type: "Event" },
  { date: "Feb 5", title: "Inter-School Sports Day", type: "Sports" },
  { date: "Feb 14", title: "Science Fair", type: "Academic" },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Academic": return BookOpen;
    case "Events": return Calendar;
    case "Sports": return Award;
    case "Administrative": return Users;
    default: return Bell;
  }
};

const Announcements = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredAnnouncements = activeCategory === "All"
    ? announcements
    : announcements.filter(a => a.category === activeCategory);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Announcements
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Stay updated with the latest news, events, and important notices from Wenyasha.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Announcements List */}
            <div className="lg:col-span-2">
              {/* Filter */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Filter className="h-5 w-5 text-muted-foreground" />
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      activeCategory === category
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Announcements */}
              <div className="space-y-6">
                {filteredAnnouncements.map((announcement) => {
                  const Icon = getCategoryIcon(announcement.category);
                  return (
                    <article
                      key={announcement.id}
                      className={`p-6 rounded-xl border transition-all hover:shadow-elegant ${
                        announcement.important 
                          ? "bg-accent/5 border-accent/30" 
                          : "bg-card border-border"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
                          announcement.important ? "bg-accent/20" : "bg-primary/10"
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            announcement.important ? "text-accent" : "text-primary"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                              announcement.important 
                                ? "bg-accent text-accent-foreground" 
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {announcement.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {announcement.date}
                            </span>
                            {announcement.important && (
                              <span className="text-xs font-semibold text-destructive">
                                Important
                              </span>
                            )}
                          </div>
                          <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                            {announcement.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {announcement.content}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Upcoming Events */}
            <div>
              <div className="sticky top-28">
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Upcoming Events
                  </h3>
                  <div className="space-y-4">
                    {upcomingEvents.map((event, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div className="h-12 w-12 rounded-lg bg-accent flex flex-col items-center justify-center text-accent-foreground shrink-0">
                          <span className="text-xs font-medium">{event.date.split(" ")[0]}</span>
                          <span className="text-lg font-bold">{event.date.split(" ")[1]}</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground text-sm">{event.title}</p>
                          <span className="text-xs text-muted-foreground">{event.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subscribe Box */}
                <div className="mt-6 bg-primary rounded-xl p-6 text-primary-foreground">
                  <Bell className="h-8 w-8 text-accent mb-3" />
                  <h3 className="font-heading font-semibold mb-2">Stay Notified</h3>
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Login to the portal to receive instant notifications for important announcements.
                  </p>
                  <a 
                    href="/portal"
                    className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium text-sm hover:bg-gold-dark transition-colors"
                  >
                    Login to Portal
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Announcements;
