import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { GraduationCap, Users, Shield, Eye, EyeOff, Mail, Lock, ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wenyasha-logo.jpg";

type PortalType = "student" | "teacher" | "admin" | "accounts" | null;

const Portal = () => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const portals = [
    { 
      type: "student" as PortalType, 
      icon: GraduationCap, 
      title: "Student Portal", 
      description: "Access assignments, grades, and resources" 
    },
    { 
      type: "teacher" as PortalType, 
      icon: Users, 
      title: "Teacher Portal", 
      description: "Manage classes, enter marks, and attendance" 
    },
    { 
      type: "admin" as PortalType, 
      icon: Shield, 
      title: "Admin Portal", 
      description: "Manage school operations and data" 
    },
    { 
      type: "accounts" as PortalType, 
      icon: Wallet, 
      title: "Accounts Portal", 
      description: "Manage fees, payments and finances" 
    },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo: redirect based on portal type
    if (selectedPortal === "student") {
      navigate("/student-dashboard");
    } else if (selectedPortal === "teacher") {
      navigate("/teacher-dashboard");
    } else if (selectedPortal === "admin") {
      navigate("/admin-dashboard");
    } else if (selectedPortal === "accounts") {
      navigate("/accounts-dashboard");
    }
  };

  if (selectedPortal) {
    const portal = portals.find(p => p.type === selectedPortal)!;
    return (
      <Layout>
        <section className="min-h-[80vh] flex items-center justify-center py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setSelectedPortal(null)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to portal selection
              </button>

              <div className="bg-card rounded-2xl border border-border p-8 shadow-elegant">
                <div className="text-center mb-8">
                  <img 
                    src={logo} 
                    alt="Wenyasha Logo" 
                    className="h-20 w-20 object-contain mx-auto mb-4"
                  />
                  <h1 className="font-heading text-2xl font-bold text-foreground">
                    {portal.title}
                  </h1>
                  <p className="text-muted-foreground text-sm">{portal.description}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="you@wenyasha.edu.zw"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:underline">Forgot password?</a>
                  </div>

                  <Button type="submit" variant="gold" size="lg" className="w-full">
                    Sign In
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                      Sign Up
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Need help? Contact{" "}
                    <a href="mailto:support@wenyasha.edu.zw" className="text-primary hover:underline">
                      IT Support
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="min-h-[80vh] flex items-center justify-center py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <img 
              src={logo} 
              alt="Wenyasha Logo" 
              className="h-24 w-24 object-contain mx-auto mb-6"
            />
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome to the Portal
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select your portal to access your personalized dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {portals.map((portal) => (
              <button
                key={portal.type}
                onClick={() => setSelectedPortal(portal.type)}
                className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-elegant transition-all text-left"
              >
                <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all">
                  <portal.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {portal.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {portal.description}
                </p>
              </button>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/" className="text-primary hover:underline text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Portal;
