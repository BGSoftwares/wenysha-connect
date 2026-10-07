import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { GraduationCap, Users, Shield, Eye, EyeOff, Mail, Lock, ArrowLeft, Wallet, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import { schoolContact } from "@/lib/schoolContact";
import { login, getErrorMessage, clearAuth } from "@/lib/api";
import { dashboardPathForRole, normalizePortalRole } from "@/lib/portalRoles";
import { toast } from "sonner";

type PortalType = "student" | "teacher" | "admin" | "accounts" | "parent" | null;

const Portal = () => {
  const [selectedPortal, setSelectedPortal] = useState<PortalType>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    {
      type: "parent" as PortalType,
      icon: UsersRound,
      title: "Parent Portal",
      description: "Follow your child’s progress and school updates"
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      const actualRole = normalizePortalRole(result.user.role);
      if (!actualRole) {
        clearAuth();
        toast.error("Your account does not have a portal role yet. Please contact the school administrator.");
        return;
      }
      if (actualRole !== selectedPortal) {
        toast.error(`This account belongs to the ${actualRole} portal.`);
        navigate(dashboardPathForRole(actualRole)!, { replace: true });
        return;
      }
      navigate(dashboardPathForRole(actualRole)!, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedPortal) {
    const portal = portals.find(p => p.type === selectedPortal)!;
    return (
      <Layout>
        <section className="portal-access-shell min-h-[80vh] flex items-center justify-center py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <button
                onClick={() => setSelectedPortal(null)}
                className="flex items-center gap-2 text-primary font-semibold hover:text-accent mb-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to portal selection
              </button>

              <div className="portal-access-card bg-card rounded-3xl border p-8 md:p-10 shadow-elegant">
                <div className="text-center mb-8">
                  <img
                    src={logo}
                    alt="Able God College Logo"
                    className="h-20 w-20 object-contain mx-auto mb-4 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-pink-100"
                  />
                  <h1 className="font-heading text-2xl font-bold text-foreground">
                    {portal.title}
                  </h1>
                  <p className="text-muted-foreground text-sm">{portal.description}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type="text"
                        autoComplete="username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all"
                        placeholder="Enter your school email or username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-white text-primary placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-md"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-[hsl(var(--accent))] focus-visible:ring-2 focus-visible:ring-accent" />
                      <span className="text-slate-600 font-medium">Remember me</span>
                    </label>
                    <Link to="/contact" className="text-primary font-semibold hover:text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm">Forgot password?</Link>
                  </div>

                  <Button type="submit" variant="gold" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>

                <div className="mt-7 pt-6 border-t border-pink-100 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-primary hover:underline font-medium">
                      Sign Up
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Need help? Contact{" "}
                    <a href={schoolContact.phones[0].href} className="text-primary hover:underline">
                      {schoolContact.phones[0].label}
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
      <section className="portal-access-shell min-h-[80vh] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <img
              src={logo}
              alt="Able God College Logo"
              className="h-24 w-24 object-contain mx-auto mb-6"
            />
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              Welcome to the Portal
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Select your portal to access your personalized dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {portals.map((portal) => (
              <button
                key={portal.type}
                onClick={() => setSelectedPortal(portal.type)}
                className="portal-access-card group p-8 rounded-2xl bg-card border hover:border-accent/60 hover:shadow-elegant transition-all text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              >
                <div className="h-16 w-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-110 transition-all">
                  <portal.icon className="h-8 w-8 text-accent group-hover:text-accent-foreground transition-colors" />
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
