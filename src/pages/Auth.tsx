import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    ArrowRight,
    ShieldCheck,
    UserCheck,
    User,
    UserPlus,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/wenyasha-logo.jpg";
import { login, signup, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

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

                // Redirect based on role (normalize casing)
                const role = (data.user.role || '').toString().toLowerCase();
                if (role === 'admin') navigate('/admin');
                else if (role === 'parent') navigate('/parent');
                else if (role === 'teacher') navigate('/teacher');
                else if (role === 'accounts') navigate('/accounts');
                else if (role === 'student') navigate('/student');
                else navigate('/portal');
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
            <section className="min-h-screen flex items-center justify-center py-20 bg-background relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#004d4020,transparent)]" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-md mx-auto">
                        <div className="bg-card rounded-3xl p-8 border border-border shadow-2xl shadow-forest/20 animate-in fade-in zoom-in duration-500">
                            <div className="text-center mb-8">
                                <Link to="/" className="inline-block mb-6 transition-transform hover:scale-110">
                                    <img src={logo} alt="Logo" className="h-20 w-20 mx-auto rounded-2xl shadow-xl border border-border p-1 bg-white" />
                                </Link>
                                <h1 className="text-3xl font-heading font-black text-foreground">
                                    {isLogin ? "Secure Entrance" : "Join Wenyasha"}
                                </h1>
                                <p className="text-muted-foreground text-sm mt-2">
                                    {isLogin ? "Access your academic sanctuary" : "Begin your journey to excellence"}
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <input
                                                    required
                                                    type="text"
                                                    placeholder="John Doe"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Identify As</label>
                                            <select
                                                value={role}
                                                onChange={(e) => setRole(e.target.value as any)}
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm appearance-none"
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
                                    <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            required
                                            type="email"
                                            placeholder="name@wenyasha.edu"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-[10px] font-bold text-accent uppercase tracking-widest">Password</label>
                                        {isLogin && <button type="button" className="text-[10px] text-muted-foreground hover:text-accent font-bold uppercase transition-colors">Forgot?</button>}
                                    </div>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-12 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
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
                                        <label className="text-[10px] font-bold text-accent uppercase tracking-widest ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full bg-secondary/50 border border-border rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all text-sm"
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

                            <div className="mt-8 text-center space-y-4">
                                <div className="relative">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-border" />
                                    <span className="relative z-10 bg-card px-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">or</span>
                                </div>
                                <p className="text-muted-foreground text-xs font-medium">
                                    {isLogin ? (
                                        <>Are you new? <button onClick={() => setIsLogin(false)} className="text-accent hover:underline font-bold">Request Access</button></>
                                    ) : (
                                        <>Already have an account? <button onClick={() => setIsLogin(true)} className="text-accent hover:underline font-bold">Sign In</button></>
                                    )}
                                </p>
                                <p className="text-[10px] text-muted-foreground/50">
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
