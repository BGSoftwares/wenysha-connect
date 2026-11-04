import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { DeveloperSignature } from "@/components/layout/DeveloperSignature";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    ArrowRight,
    User,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/able-god-college-logo.png";
import campusPhoto from "@/assets/slides/slide-6252.jpeg";
import { login, signup, getErrorMessage, clearAuth } from "@/lib/api";
import { toast } from "sonner";
import { dashboardPathForRole } from "@/lib/portalRoles";

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Form states
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"student" | "parent" | "teacher" | "accounts">("student");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isLogin) {
                const data = await login(email, password);
                toast.success(`Welcome back, ${data.user.full_name || data.user.username}`);

                const dashboard = dashboardPathForRole(data.user.role);
                if (!dashboard) {
                    clearAuth();
                    toast.error("Your account does not have a portal role yet. Please contact the school administrator.");
                    return;
                }
                navigate(dashboard, { replace: true });
            } else {
                if (password !== confirmPassword) {
                    toast.error("Passwords do not match");
                    setIsLoading(false);
                    return;
                }
                const res = await signup({
                    full_name: fullName,
                    email,
                    password,
                    confirm_password: confirmPassword,
                    role
                });
                toast.success("Registration request submitted! Please wait for admin approval.");
                setIsLogin(true);
            }
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-background px-4 pb-12 pt-28">
                <div className="pointer-events-none absolute -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />

                <div className="relative z-10 w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="overflow-hidden rounded-2xl border border-pink-100 bg-card shadow-xl shadow-primary/10 lg:grid lg:grid-cols-[0.8fr_1.2fr]">
                        <div className="relative hidden min-h-[480px] lg:block">
                            <img src={campusPhoto} alt="Students at school assembly" className="absolute inset-0 h-full w-full object-cover object-center" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/45 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-primary-foreground">
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Able God College</span>
                                <h2 className="mt-3 font-heading text-2xl font-semibold leading-tight">Learning, results and school life — together.</h2>
                                <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80">
                                    Secure access for students, parents, teachers and school staff.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 sm:p-7 lg:p-8">
                            <div className="mb-5 text-center">
                                <img
                                    src={logo}
                                    alt="Able God College Logo"
                                    className="mx-auto mb-3 h-16 w-16 rounded-xl border border-pink-100 bg-white p-1.5 object-contain"
                                />
                                <h1 className="font-heading text-2xl font-semibold text-foreground">
                                    {isLogin ? "Portal Sign In" : "Join Able God College"}
                                </h1>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {isLogin ? "Sign in to continue to your school portal." : "Send a request and the school will approve your account."}
                                </p>
                            </div>

                            <div className="mb-5 grid grid-cols-2 rounded-xl bg-muted/70 p-1">
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(true)}
                                    className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(false)}
                                    className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Request access
                                </button>
                            </div>

                            <form className="space-y-3.5" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-primary">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                                <input
                                                    required
                                                    type="text"
                                                    autoComplete="name"
                                                    placeholder="Enter your full name"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full rounded-xl border border-slate-200 bg-blue-50 py-2.5 pl-12 pr-4 text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-primary">Identify As</label>
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as typeof role)}
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-blue-50 px-4 py-2.5 text-foreground focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                                            >
                                                <option value="student">Student</option>
                                                <option value="parent">Parent / Guardian</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="accounts">Accounts / Admin Staff</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-primary">
                                        {isLogin ? "Email Address or Username" : "Email Address"}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            required
                                            type={isLogin ? "text" : "email"}
                                            autoComplete={isLogin ? "username" : "email"}
                                            placeholder={isLogin ? "Enter your school email or username" : "you@example.com"}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-blue-50 py-2.5 pl-12 pr-4 text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-sm font-bold text-primary">Password</label>
                                        {isLogin && (
                                            <Link to="/contact" className="text-sm font-semibold text-primary hover:text-accent hover:underline">
                                                Need help?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            autoComplete={isLogin ? "current-password" : "new-password"}
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full rounded-xl border border-slate-200 bg-blue-50 py-2.5 pl-12 pr-12 text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded text-slate-500 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-primary">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                autoComplete="new-password"
                                                placeholder="Confirm your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full rounded-xl border border-slate-200 bg-blue-50 py-2.5 pl-12 pr-4 text-foreground placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button type="submit" disabled={isLoading} variant="gold" className="h-11 w-full rounded-xl text-base font-bold shadow-lg shadow-accent/20">
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? "Sign In" : "Submit Request"}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="mt-5 text-center text-xs text-muted-foreground">
                                By continuing, you agree to our{" "}
                                <Link to="/terms" className="underline hover:text-primary">Security Policy</Link>.
                                {" "} <Link to="/" className="font-medium text-primary hover:underline">Back to website</Link>
                            </p>
                            <DeveloperSignature className="mt-4 border-t border-pink-100 pt-4 text-center text-xs text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Auth;
