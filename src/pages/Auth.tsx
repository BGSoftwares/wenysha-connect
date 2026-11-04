import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
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
            <section className="min-h-screen flex bg-background relative overflow-hidden">
                {/* Campus photo panel */}
                <div className="relative hidden lg:flex lg:w-1/2 xl:w-[55%] items-end">
                    <img
                        src={campusPhoto}
                        alt="Able God College learners gathered at assembly"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--forest-dark))] via-[hsl(var(--forest-dark))]/50 to-[hsl(var(--forest-dark))]/10" />
                    <div className="relative z-10 p-12 xl:p-16 max-w-xl">
                        <Link to="/" className="inline-flex items-center gap-4 mb-8 group">
                            <img
                                src={logo}
                                alt="Able God College crest"
                                className="h-16 w-16 rounded-2xl object-contain bg-card p-1 shadow-xl ring-4 ring-accent/70 transition-transform group-hover:scale-105"
                            />
                        </Link>
                        <h2 className="font-heading text-4xl xl:text-5xl font-bold text-white leading-tight">
                            Able God College
                        </h2>
                        <p className="mt-4 text-white/80 text-lg leading-relaxed">
                            Learning, leadership and service. Sign in to access your portal — timetables, results, report cards and school announcements, all in one place.
                        </p>
                        <p className="mt-8 text-xs uppercase tracking-[0.3em] text-accent font-semibold">
                            Est. 2024 · ZIMSEC &amp; HEXCO
                        </p>
                    </div>
                </div>

                {/* Form panel */}
                <div className="flex w-full lg:w-1/2 xl:w-[45%] items-center justify-center py-24 px-4 sm:px-8">
                    <div className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl pointer-events-none" />
                    <div className="w-full max-w-md rounded-[2rem] overflow-hidden border border-border/60 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                        <div className="p-8 sm:p-10">
                            <div className="mb-8">
                                <Link to="/" className="lg:hidden inline-flex items-center gap-3 mb-8 group">
                                    <img src={logo} alt="Logo" className="h-12 w-12 rounded-xl shadow-md border border-border p-0.5 bg-card transition-transform group-hover:scale-105" />
                                    <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Back to website</span>
                                </Link>
                                <div className="grid grid-cols-2 p-1 mb-8 rounded-xl bg-muted/70">
                                    <button type="button" onClick={() => setIsLogin(true)} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Sign in</button>
                                    <button type="button" onClick={() => setIsLogin(false)} className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Request access</button>
                                </div>
                                <h1 className="text-3xl font-heading font-semibold text-foreground">
                                    {isLogin ? "Welcome back" : "Join Able God College"}
                                </h1>
                                <p className="text-muted-foreground text-sm mt-2">
                                    {isLogin ? "Sign in to continue to your portal." : "Send a request and the school will approve your account."}
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-background border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-foreground/80 ml-1">Identify As</label>
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as typeof role)}
                                                className="w-full bg-background border border-border rounded-xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm appearance-none"
                                            >
                                                <option value="student">Student</option>
                                                <option value="parent">Parent / Guardian</option>
                                                <option value="teacher">Teacher</option>
                                                <option value="accounts">Accounts / Admin Staff</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground/80 ml-1">{isLogin ? "Email or Username" : "Email Address"}</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            required
                                            type={isLogin ? "text" : "email"}
                                            autoComplete={isLogin ? "username" : "email"}
                                            placeholder="name@ablegodcollege.edu or username"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-xs font-semibold text-foreground/80">Password</label>
                                        {isLogin && <button type="button" className="text-[10px] text-muted-foreground hover:text-accent font-bold uppercase transition-colors">Forgot?</button>}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            autoComplete={isLogin ? "current-password" : "new-password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-background border border-border rounded-xl py-3.5 pl-11 pr-12 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-accent transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                {!isLogin && (
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground/80 ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-background border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    variant="gold"
                                    className="w-full py-6 rounded-xl font-bold shadow-xl shadow-accent/20 group h-14"
                                >
                                    {isLoading ? (
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? "Enter Portal" : "Submit Request"}
                                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 text-center">
                                <p className="text-xs text-muted-foreground">
                                    Access is restricted to authorized personnel. By entering, you agree to our <Link to="/terms" className="underline">Security Policy</Link>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default Auth;
