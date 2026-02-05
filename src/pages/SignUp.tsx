import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  GraduationCap,
  Users,
  Wallet,
  UserCheck,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/wenyasha-logo.jpg";
import { signup, getErrorMessage } from "@/lib/api";

type RoleType = "student" | "parent" | "teacher" | "accounts";

const roles = [
  { type: "student" as RoleType, icon: GraduationCap, label: "Student" },
  { type: "parent" as RoleType, icon: UserCheck, label: "Parent / Guardian" },
  { type: "teacher" as RoleType, icon: Users, label: "Teacher" },
  { type: "accounts" as RoleType, icon: Wallet, label: "Accounts Officer / Bursar" },
];

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select a role to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      await signup({
        full_name: fullName,
        email,
        password,
        confirm_password: confirmPassword,
        role: selectedRole,
      });
      setIsSubmitted(true);
    } catch (err) {
      toast({
        title: "Registration Failed",
        description: getErrorMessage(err),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="min-h-[80vh] flex items-center justify-center py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <div className="bg-card rounded-2xl border border-border p-8 shadow-elegant text-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-10 w-10 text-primary" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-foreground mb-4">
                  Registration Submitted
                </h1>
                <p className="text-muted-foreground mb-6">
                  Your account is pending administrator approval. You will receive an email notification once your account has been activated.
                </p>
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Account Status:</strong> Pending Approval
                  </p>
                </div>
                <Link to="/portal">
                  <Button variant="gold" className="w-full">
                    Back to Login
                  </Button>
                </Link>
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
          <div className="max-w-lg mx-auto">
            <Link
              to="/portal"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>

            <div className="bg-card rounded-2xl border border-border p-8 shadow-elegant">
              <div className="text-center mb-8">
                <img
                  src={logo}
                  alt="Wenyasha Logo"
                  className="h-20 w-20 object-contain mx-auto mb-4"
                />
                <h1 className="font-heading text-2xl font-bold text-foreground">
                  Create an Account
                </h1>
                <p className="text-muted-foreground text-sm">
                  Register to access the Wenyasha school portal
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Password */}
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
                      placeholder="Create a password"
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.type}
                        type="button"
                        onClick={() => setSelectedRole(role.type)}
                        className={`p-4 rounded-lg border text-left transition-all ${selectedRole === role.type
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                          }`}
                      >
                        <role.icon className={`h-5 w-5 mb-2 ${selectedRole === role.type ? "text-primary" : "text-muted-foreground"
                          }`} />
                        <span className={`text-sm font-medium ${selectedRole === role.type ? "text-primary" : "text-foreground"
                          }`}>
                          {role.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button type="submit" variant="gold" size="lg" className="w-full">
                  Create Account
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-border text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/portal" className="text-primary hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SignUp;
