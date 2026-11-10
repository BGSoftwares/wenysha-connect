import { Layout } from "@/components/layout/Layout";
import {
  Phone,
  MapPin,
  Send,
  ArrowRight,
  Clock,
  Mail,
  Sparkles,
  MessageCircle,
  Building,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { schoolContact } from "@/lib/schoolContact";
import { schoolIdentity } from "@/lib/schoolInformation";
import { api, getErrorMessage } from "@/lib/api";
import heroImg from "@/assets/slides/slide-6264.jpeg";

const officeHours = [
  { day: "Monday – Thursday", hours: "07:30 – 16:30" },
  { day: "Friday", hours: "07:30 – 15:30" },
  { day: "Saturday", hours: "08:30 – 12:30 (Admissions Desk)" },
  { day: "Sunday & Public Holidays", hours: "Closed" },
];

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Admissions & Enrolment Enquiry",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/content/contact-messages/", formData);
      toast({
        title: "Message Sent Successfully",
        description: "Thank you for contacting Able God College. Our admissions team will respond promptly.",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "Admissions & Enrolment Enquiry",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Could not send message",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout>
      {/* Collegiate Hero Banner */}
      <section className="relative min-h-[460px] w-full flex items-center justify-center overflow-hidden bg-[#10264f]">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Able God College community"
            className="w-full h-full object-cover object-center"
            style={{ objectPosition: "center 30%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#10264f]/92 via-[#10264f]/85 to-[#0b1c3b]/95" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 bg-accent/90 text-accent-foreground text-xs font-bold tracking-widest uppercase px-5 py-2 rounded-full shadow-lg">
              <Sparkles className="h-3.5 w-3.5" />
              We Welcome You
            </span>

            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              Contact &amp; <span className="italic font-serif text-accent">Visit Us</span>
            </h1>

            <div className="w-16 h-1 bg-accent mx-auto rounded-full" />

            <p className="text-white/85 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto">
              We would love to hear from you. Reach out for admissions enquiries, campus visits, or academic
              program information.
            </p>
          </div>
        </div>
      </section>

      {/* Top 3 Quick Contact Cards */}
      <section className="py-12 bg-background border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6 -mt-20 relative z-20">
            {/* Address Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Campus Location</p>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">Our Masvingo Campus</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{schoolContact.address}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolContact.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-accent transition-colors"
                >
                  Open in Google Maps <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* Phone Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-accent" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Call &amp; WhatsApp</p>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">Direct Telephone</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {schoolContact.phones.map((phone) => (
                    <p key={phone.href}>
                      <a href={phone.href} className="hover:text-primary font-medium transition-colors">
                        {phone.label}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <a
                  href="https://wa.me/263784654328?text=Hello%20Able%20God%20College,%20I%20would%20like%20to%20enquire%20about%20admissions."
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#c51f67]/10 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-[#c51f67]" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Admissions Desk</p>
                <h3 className="font-heading text-lg font-bold text-foreground mb-2">Email Inquiries</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:admissions@ablegodcollege.edu" className="hover:text-primary transition-colors">
                    admissions@ablegodcollege.edu
                  </a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tuition: <span className="font-bold text-foreground">US$ 200 per term</span>
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border">
                <span className="text-xs font-semibold text-muted-foreground">Response time: within 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Form & Office Hours Section */}
      <section className="py-20 bg-muted/40">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
            {/* Contact Form */}
            <div className="rounded-3xl border border-border bg-card p-8 sm:p-10 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-accent">Direct Contact</span>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mt-1 mb-2">
                Send Us a Message
              </h2>
              <p className="text-sm text-muted-foreground mb-8">
                Fill in the form below and an admissions officer will assist you.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Tendai Moyo"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+263 77..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                      Inquiry Topic
                    </label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    >
                      <option value="Admissions & Enrolment Enquiry">Admissions &amp; Enrolment (US$ 200/term)</option>
                      <option value="Form 1 Standard Entry">Form 1 Standard Entry</option>
                      <option value="Midstream / Transfer Application">Midstream / Transfer Application</option>
                      <option value="A-Level Academic Streams">A-Level Academic Streams</option>
                      <option value="Campus Tour Request">Book a Campus Tour</option>
                      <option value="Accounts & Fee Payment">Accounts &amp; Fee Payment</option>
                      <option value="General Information">General Information</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about the learner, current grade, or your specific questions..."
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-12 text-base rounded-xl shadow-lg shadow-accent/20 gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Submit Message"}
                </Button>
              </form>
            </div>

            {/* Right Column: Office Hours & Visit Card */}
            <div className="space-y-6">
              {/* Office Hours */}
              <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <Clock className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Office Hours</h3>
                    <p className="text-xs text-muted-foreground">Masvingo campus front desk</p>
                  </div>
                </div>

                <div className="divide-y divide-border">
                  {officeHours.map((row, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3.5 text-sm">
                      <span className="font-medium text-foreground">{row.day}</span>
                      <span className={row.hours === "Closed" ? "text-accent font-semibold" : "text-muted-foreground"}>
                        {row.hours}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Campus Experience Card */}
              <div className="rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-[#10264f] to-[#1a3a75] p-8 text-white shadow-xl space-y-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent">
                    <Building className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="font-heading text-lg font-bold">Experience the Campus</h3>
                    <p className="text-xs text-accent font-semibold uppercase tracking-wider">{schoolIdentity.name}</p>
                  </div>
                </div>

                <p className="text-sm text-white/85 leading-relaxed">
                  The best way to understand what makes Able God College special is to see it for yourself.
                  Come visit our facilities, meet the teaching staff, and explore our learning environment.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold h-11"
                  >
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(schoolContact.address)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Get Directions <ArrowRight className="h-4 w-4 ml-1.5" />
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-[#10264f] font-semibold h-11"
                  >
                    <a href="tel:+263779381415">Call Front Desk</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
