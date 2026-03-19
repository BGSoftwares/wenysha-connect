import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import {
    Calendar,
    FileText,
    MessageSquare,
    CreditCard,
    Activity,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useParentProfile,
    useStudentParentLinks,
    useStudents,
    useGrades,
    useAttendanceRecords,
    useStudentFees,
    useInvoices
} from "@/lib/hooks";
import { calculateGrade } from "@/lib/grading";
import { getStoredUser } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const ParentPortal = () => {
    const { data: parentProfile, isLoading: isLoadingParent } = useParentProfile();
    const isParent = !!parentProfile; // A user is a parent if parentProfile exists

    const { data: parentLinks } = useStudentParentLinks(
        parentProfile ? { parent: parentProfile.id } : undefined
    );

    const studentIds = useMemo(() => parentLinks?.map(link => link.student) || [], [parentLinks]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

    // Initial set of selected child
    useEffect(() => {
        if (studentIds.length > 0 && selectedChildId === null) {
            setSelectedChildId(studentIds[0]);
        }
    }, [studentIds, selectedChildId]);

    // Data for selected child
    const { data: grades = [] } = useGrades(
        selectedChildId ? { student: selectedChildId } : undefined
    );
    const { data: attendance = [] } = useAttendanceRecords(
        selectedChildId ? { student: selectedChildId } : undefined
    );
    const { data: fees = [] } = useStudentFees(
        selectedChildId ? { student: selectedChildId } : undefined
    );

    const selectedChild = useMemo(() =>
        parentLinks?.find(link => link.student === selectedChildId),
        [parentLinks, selectedChildId]);

    // Summary calculations
    const averageScore = useMemo(() => {
        if (!grades || grades.length === 0) return 0;
        return grades.reduce((acc, g) => acc + Number(g.score), 0) / grades.length;
    }, [grades]);

    const attendanceRate = useMemo(() => {
        if (!attendance || attendance.length === 0) return 0;
        const present = attendance.filter(a => a.status === 'present').length;
        return (present / attendance.length) * 100;
    }, [attendance]);

    const pendingFees = useMemo(() => {
        if (!fees) return 0;
        return fees.filter(f => f.status !== 'Paid').reduce((acc, f) => acc + (f.amount_due - f.amount_paid), 0);
    }, [fees]);

    if (!isParent) {
        return (
            <Layout>
                <div className="min-h-[60vh] flex items-center justify-center p-4">
                    <Card className="max-w-md w-full text-center p-8 border-dashed border-2">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <CardTitle className="mb-2">Parent Access Required</CardTitle>
                        <CardDescription className="mb-6">
                            This portal is exclusively for registered parents and guardians. Please log in with a parent account to continue.
                        </CardDescription>
                        <Button variant="gold" className="w-full rounded-xl" onClick={() => window.location.href = '/portal'}>
                            Go to Portal Login
                        </Button>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="py-12 bg-forest relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-10" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <Badge variant="outline" className="text-accent border-accent/30 mb-6 bg-accent/10 px-4 py-1">
                            PARENT COMMAND CENTER
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4">
                            Welcome back, <span className="text-accent">{parentProfile?.name?.split(' ')[0] || "Parent"}.</span>
                        </h1>
                        <p className="text-lg text-white/70 mb-0 font-light">
                            Monitoring the academic growth and well-being of your children.
                        </p>
                    </div>
                </div>
            </section>

            <section className="py-8 bg-secondary/10 min-h-screen">
                <div className="container mx-auto px-4">
                    {isLoadingParent ? (
                        <div className="space-y-4">
                            <div className="h-40 bg-card animate-pulse rounded-3xl" />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="h-32 bg-card animate-pulse rounded-2xl" />
                                <div className="h-32 bg-card animate-pulse rounded-2xl" />
                                <div className="h-32 bg-card animate-pulse rounded-2xl" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Children Selector */}
                            <div className="bg-card border border-border rounded-3xl p-6 shadow-elegant">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                                        <Activity className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back, {parentProfile.name.split(' ')[0]}</h1>
                                        <p className="text-muted-foreground">You are viewing information for {parentLinks?.length || 0} registered {parentLinks?.length === 1 ? 'child' : 'children'}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {parentLinks?.map(link => (
                                        <button
                                            key={link.student}
                                            onClick={() => setSelectedChildId(link.student)}
                                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${selectedChildId === link.student
                                                ? 'bg-accent border-accent text-accent-foreground shadow-lg shadow-accent/30 font-bold scale-105'
                                                : 'bg-background border-border text-foreground hover:border-accent hover:bg-accent/5'}`}
                                        >
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedChildId === link.student ? 'bg-white/20' : 'bg-secondary'}`}>
                                                <User className="h-5 w-5" />
                                            </div>
                                            {link.student_name}
                                        </button>
                                    ))}
                                    {(!parentLinks || parentLinks.length === 0) && (
                                        <div className="p-10 text-center w-full bg-secondary/20 rounded-2xl border-dashed border-2 border-border">
                                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-muted-foreground">No students linked to your account yet. Please contact the administration.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedChildId && (
                                <div className="animate-in fade-in slide-in-from-bottom duration-500">
                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <Card className="bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                                        <TrendingUp className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Top 15%</Badge>
                                                </div>
                                                <h3 className="text-muted-foreground text-sm font-medium">Academic Average</h3>
                                                <p className="text-3xl font-black text-foreground mt-1">{averageScore.toFixed(1)}%</p>
                                                <Progress value={averageScore} className="h-2 mt-4 bg-blue-100" />
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                    </div>
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Consistent</Badge>
                                                </div>
                                                <h3 className="text-muted-foreground text-sm font-medium">Attendance Rate</h3>
                                                <p className="text-3xl font-black text-foreground mt-1">{attendanceRate.toFixed(0)}%</p>
                                                <Progress value={attendanceRate} className="h-2 mt-4 bg-green-100" />
                                            </CardContent>
                                        </Card>

                                        <Card className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20">
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                                        <CreditCard className="h-6 w-6 text-amber-600" />
                                                    </div>
                                                    <Badge variant={pendingFees > 0 ? "destructive" : "default"} className={pendingFees === 0 ? "bg-green-100 text-green-700" : ""}>
                                                        {pendingFees === 0 ? "Cleared" : "Attention"}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-muted-foreground text-sm font-medium">Outstanding Balance</h3>
                                                <p className="text-3xl font-black text-foreground mt-1">${pendingFees.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground mt-2">Term 1 2024</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detailed Sections */}
                                    <Tabs defaultValue="academics" className="space-y-6">
                                        <TabsList className="bg-secondary/40 p-1 rounded-2xl h-14">
                                            <TabsTrigger value="academics" className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Recent Grades
                                            </TabsTrigger>
                                            <TabsTrigger value="attendance" className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Attendance Log
                                            </TabsTrigger>
                                            <TabsTrigger value="fees" className="rounded-xl px-8 h-12 data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Financials
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="academics">
                                            <Card className="rounded-3xl border-border shadow-md overflow-hidden">
                                                <CardHeader className="bg-secondary/20">
                                                    <CardTitle>Academic Records</CardTitle>
                                                    <CardDescription>Performance in recent assessments and exams</CardDescription>
                                                </CardHeader>
                                                <CardContent className="p-0">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead className="bg-secondary/30">
                                                                <tr className="text-left border-b border-border">
                                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Subject</th>
                                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Assessment</th>
                                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Score</th>
                                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Date</th>
                                                                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider">Remarks</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {grades?.map(g => (
                                                                    <tr key={g.id} className="hover:bg-accent/5 transition-colors">
                                                                        <td className="px-6 py-4 font-bold text-foreground">{g.subject_name}</td>
                                                                        <td className="px-6 py-4 text-sm text-muted-foreground">{g.assessment_name}</td>
                                                                        <td className="px-6 py-4">
                                                                            <Badge className={Number(g.score) >= 75 ? "bg-green-100 text-green-700" : Number(g.score) >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                                                                                {g.score}%
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(g.date_recorded).toLocaleDateString()}</td>
                                                                        <td className="px-6 py-4 text-sm text-muted-foreground italic">"{g.remarks || "-"}"</td>
                                                                    </tr>
                                                                ))}
                                                                {(!grades || grades.length === 0) && (
                                                                    <tr>
                                                                        <td colSpan={5} className="p-12 text-center text-muted-foreground">No recent grades available.</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="attendance">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <Card className="rounded-3xl border-border shadow-md">
                                                    <CardHeader>
                                                        <CardTitle>Attendance History</CardTitle>
                                                        <CardDescription>Daily school presence records</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            {attendance?.slice(0, 10).map(a => (
                                                                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-accent/30 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${a.status === 'present' ? 'bg-green-100 text-green-600' :
                                                                            a.status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                                                            }`}>
                                                                            {a.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : a.status === 'absent' ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-foreground">{new Date(a.date).toLocaleDateString()}</p>
                                                                            <p className="text-xs text-muted-foreground">{"No remarks"}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className={
                                                                        a.status === 'present' ? 'text-green-600 border-green-200' :
                                                                            a.status === 'absent' ? 'text-red-600 border-red-200' : 'text-amber-600 border-amber-200'
                                                                    }>
                                                                        {a.status}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardContent>
                                                </Card>

                                                <Card className="rounded-3xl border-border shadow-md bg-accent/5">
                                                    <CardHeader>
                                                        <CardTitle className="flex items-center gap-2">
                                                            <MessageSquare className="h-5 w-5 text-accent" />
                                                            Contact Administration
                                                        </CardTitle>
                                                        <CardDescription>Message the class teacher regarding attendance or performance</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-4">
                                                        <textarea
                                                            placeholder="Type your message here..."
                                                            className="w-full h-32 p-4 rounded-2xl border border-border bg-background outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                                                        />
                                                        <Button variant="gold" className="w-full rounded-xl">Send Message</Button>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="fees">
                                            <Card className="rounded-3xl border-border shadow-md">
                                                <CardHeader>
                                                    <CardTitle>Student Fees & Financials</CardTitle>
                                                    <CardDescription>Track payments and outstanding balances</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-6">
                                                        {fees?.map(f => (
                                                            <div key={f.id} className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-all">
                                                                <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                                                                    <div>
                                                                        <h4 className="font-bold text-lg text-foreground">{f.fee_name}</h4>
                                                                        <div className="flex items-center gap-3 mt-1">
                                                                            <Badge variant={f.status === 'Paid' ? 'default' : f.status === 'Partial' ? 'secondary' : 'destructive'} className={f.status === 'Paid' ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                                                                                {f.status}
                                                                            </Badge>
                                                                            <span className="text-sm text-muted-foreground">Due Date: Mar 15, 2024</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right w-full md:w-auto">
                                                                        <div className="flex justify-between md:justify-end gap-8 mb-2">
                                                                            <div className="text-left md:text-right">
                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount Due</p>
                                                                                <p className="font-bold text-foreground text-lg">${Number(f.amount_due).toFixed(2)}</p>
                                                                            </div>
                                                                            <div className="hidden sm:block text-right">
                                                                                <p className="text-sm font-medium text-foreground">{parentProfile.name}</p>
                                                                                <p className="text-xs text-muted-foreground">Parent Account</p>
                                                                            </div>
                                                                            <div className="text-left md:text-right">
                                                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Paid</p>
                                                                                <p className="font-bold text-green-600 text-lg">${Number(f.amount_paid).toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                        {f.status !== 'Paid' && (
                                                                            <Button variant="gold" className="w-full md:w-auto h-12 px-8 rounded-xl">
                                                                                Pay Outstanding (${(f.amount_due - f.amount_paid).toFixed(2)})
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {f.status === 'Partial' && (
                                                                    <div className="mt-6">
                                                                        <div className="flex justify-between text-xs font-medium mb-1.5 px-1">
                                                                            <span>Payment Progress</span>
                                                                            <span>{((f.amount_paid / f.amount_due) * 100).toFixed(0)}%</span>
                                                                        </div>
                                                                        <Progress value={(f.amount_paid / f.amount_due) * 100} className="h-3 bg-secondary" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {(!fees || fees.length === 0) && (
                                                            <div className="py-12 text-center text-muted-foreground">No fee records found.</div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </Layout>
    );
};

export default ParentPortal;
