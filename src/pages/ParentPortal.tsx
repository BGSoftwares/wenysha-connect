import { useState, useMemo, useEffect, type FormEvent } from "react";
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
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    useParentProfile,
    useStudentParentLinks,
    useStudents,
    useGrades,
    useAttendanceRecords,
    useAttendanceExcuses,
    useAttendanceTermSummaries,
    useSubmitAttendanceExcuse,
    useAttendanceNotifications,
    useMarkAttendanceNotificationRead,
    useAttendanceSettings,
    useInvoices,
    usePayments,
} from "@/lib/hooks";
import { getStoredUser } from "@/lib/api";
import { api, getErrorMessage } from "@/lib/api";
import { formatMoney, formatSchoolDate } from "@/lib/finance";
import { calculatePercentageFromScore } from "@/lib/grading";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import NotificationsFeed from "@/components/dashboard/NotificationsFeed";
import ProfileSection from "@/components/admin/ProfileSection";
import ParentELearningSection from "@/components/parent/ParentELearningSection";
import { formatLocalDateKey } from "@/lib/zimbabweSchoolCalendar";

const ParentPortal = () => {
    const { data: parentProfile, isLoading: isLoadingParent, error: parentProfileError, refetch: refetchParentProfile } = useParentProfile();
    const isParent = !!parentProfile; // A user is a parent if parentProfile exists

    const { data: parentLinks } = useStudentParentLinks(
        parentProfile ? { parent: parentProfile.id } : undefined
    );
    const { data: linkedStudents = [] } = useStudents();

    const studentIds = useMemo(() => parentLinks?.map(link => link.student) || [], [parentLinks]);
    const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
    const [message, setMessage] = useState("");
    const [sendingMessage, setSendingMessage] = useState(false);
    const [excuseDate, setExcuseDate] = useState(formatLocalDateKey(new Date()));
    const [excuseReason, setExcuseReason] = useState("sick");
    const [excuseNote, setExcuseNote] = useState("");
    const [excuseAttachment, setExcuseAttachment] = useState<File | undefined>();
    const user = getStoredUser();

    const sendMessage = async () => {
        if (!message.trim() || !user?.email) {
            toast.error(user?.email ? "Please enter a message first." : "Your account needs an email address to send a message.");
            return;
        }
        setSendingMessage(true);
        try {
            await api.post("/content/contact-messages/", {
                name: parentProfile?.name || user.full_name || user.username,
                email: user.email,
                subject: `Parent enquiry${selectedChild?.student_name ? `: ${selectedChild.student_name}` : ""}`,
                message: message.trim(),
            });
            setMessage("");
            toast.success("Your message has been sent to the school.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setSendingMessage(false);
        }
    };

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
    const { data: attendance = [] } = useAttendanceRecords({ student: selectedChildId ?? 0 });
    const { data: attendanceExcuses = [] } = useAttendanceExcuses({ student: selectedChildId ?? 0 });
    const { data: attendanceSummaries = [] } = useAttendanceTermSummaries({ student: selectedChildId ?? undefined });
    const submitAttendanceExcuse = useSubmitAttendanceExcuse();
    const { data: attendanceNotifications = [] } = useAttendanceNotifications();
    const markAttendanceNotificationRead = useMarkAttendanceNotificationRead();
    const { data: attendanceSettings } = useAttendanceSettings();
    const { data: invoices = [] } = useInvoices(
        { student: selectedChildId || 0 }
    );
    const { data: payments = [] } = usePayments(
        { student: selectedChildId || 0 }
    );

    const selectedChild = useMemo(() =>
        parentLinks?.find(link => link.student === selectedChildId),
        [parentLinks, selectedChildId]);
    const selectedStudent = useMemo(() =>
        linkedStudents.find(student => student.id === selectedChildId),
        [linkedStudents, selectedChildId]);

    // Summary calculations
    const averageScore = useMemo(() => {
        if (!grades || grades.length === 0) return 0;
        return grades.reduce((acc, grade) => acc + calculatePercentageFromScore(grade.score, grade.assessment_total_marks), 0) / grades.length;
    }, [grades]);

    const attendanceRate = useMemo(() => {
        const scheduledDays = attendanceSummaries.reduce((total, summary) => total + summary.total_school_days, 0);
        const attendedDays = attendanceSummaries.reduce((total, summary) => total + summary.days_present + summary.days_late, 0);
        if (scheduledDays > 0) return (attendedDays / scheduledDays) * 100;
        const dayStatuses = new Map<string, string[]>();
        attendance.forEach(record => {
            const statuses = dayStatuses.get(record.date) ?? [];
            statuses.push(record.status);
            dayStatuses.set(record.date, statuses);
        });
        if (!dayStatuses.size) return 0;
        const daysAttended = Array.from(dayStatuses.values()).filter(statuses => statuses.some(status => status === "present" || status === "late")).length;
        return (daysAttended / dayStatuses.size) * 100;
    }, [attendance, attendanceSummaries]);
    const todayDate = formatLocalDateKey(new Date());
    const todayAttendanceAlerts = attendance.filter(record =>
        record.date === todayDate && (record.status === "absent" || record.status === "late"),
    );

    const submitExcuse = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedChildId) {
            toast.error("Select a child before submitting an absence excuse.");
            return;
        }
        try {
            await submitAttendanceExcuse.mutateAsync({
                student: selectedChildId,
                date: excuseDate,
                reason: excuseReason,
                note: excuseNote.trim(),
                attachment: excuseAttachment,
            });
            setExcuseNote("");
            setExcuseAttachment(undefined);
            toast.success("Absence excuse submitted to the school for review.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    const pendingBalances = useMemo(() => invoices.reduce<Record<string, number>>((totals, invoice) => {
        totals[invoice.currency] = (totals[invoice.currency] || 0) + Math.max(0, Number(invoice.amount) - Number(invoice.paid));
        return totals;
    }, {}), [invoices]);
    const hasPendingFees = Object.values(pendingBalances).some(amount => amount > 0);

    if (isLoadingParent) {
        return <Layout><div className="min-h-[60vh] flex items-center justify-center text-muted-foreground" aria-live="polite">Loading parent portal…</div></Layout>;
    }
    if (!parentProfile && parentProfileError) {
        return <Layout><div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-4 text-center"><p className="text-destructive">Could not load your parent profile: {getErrorMessage(parentProfileError)}</p><Button variant="gold" onClick={() => void refetchParentProfile()}>Try again</Button></div></Layout>;
    }
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
            <div className="portal-dashboard portal-parent-dashboard">
            <section className="portal-parent-hero py-12 bg-forest relative overflow-hidden">
                <div className="absolute inset-0 bg-noise opacity-10" />
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        <Badge variant="outline" className="text-accent border-accent/30 mb-6 bg-accent/10 px-4 py-1">
                            PARENT COMMAND CENTER
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 drop-shadow-sm">
                            Welcome back, <span className="text-accent">{parentProfile?.name?.split(' ')[0] || "Parent"}.</span>
                        </h1>
                        <p className="text-lg text-white/90 mb-0 font-normal">
                            Monitoring the academic growth and well-being of your children.
                        </p>
                    </div>
                </div>
            </section>

            <section className="portal-parent-content py-8 bg-secondary/10 min-h-screen">
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

                            <NotificationsFeed title="School notifications" />

                            {selectedChildId && (
                                <div className="animate-in fade-in slide-in-from-bottom duration-500">
                                    {/* Quick Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <Card className="bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                                            <CardContent className="pt-6">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="h-12 w-12 rounded-xl bg-accent/15 flex items-center justify-center">
                                                        <TrendingUp className="h-6 w-6 text-accent" />
                                                    </div>
                                                    <Badge className="bg-accent/10 text-accent hover:bg-accent/10">Top 15%</Badge>
                                                </div>
                                                <h3 className="text-muted-foreground text-sm font-medium">Academic Average</h3>
                                                <p className="text-3xl font-black text-foreground mt-1">{averageScore.toFixed(1)}%</p>
                                                <Progress value={averageScore} className="h-2 mt-4 bg-accent/10" />
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
                                                    <Badge variant={hasPendingFees ? "destructive" : "default"} className={!hasPendingFees ? "bg-green-100 text-green-700" : ""}>
                                                        {hasPendingFees ? "Attention" : "Cleared"}
                                                    </Badge>
                                                </div>
                                                <h3 className="text-muted-foreground text-sm font-medium">Outstanding Balance</h3>
                                                {Object.entries(pendingBalances).length > 0
                                                    ? Object.entries(pendingBalances).map(([currency, amount]) => <p key={currency} className="text-xl font-black text-foreground mt-1">{formatMoney(amount, currency as "USD" | "ZWG")}</p>)
                                                    : <p className="text-3xl font-black text-foreground mt-1">{formatMoney(0)}</p>}
                                                <p className="text-xs text-muted-foreground mt-2">Live Accounts balance</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Detailed Sections */}
                                    <Tabs defaultValue="academics" className="space-y-6">
                                    <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-secondary/40 p-1 sm:grid-cols-3 xl:grid-cols-5">
                                            <TabsTrigger value="academics" className="h-11 rounded-xl px-2 text-xs sm:px-5 sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <FileText className="h-4 w-4 mr-2" />
                                                Recent Grades
                                            </TabsTrigger>
                                            <TabsTrigger value="attendance" className="h-11 rounded-xl px-2 text-xs sm:px-5 sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                Attendance Log
                                            </TabsTrigger>
                                            <TabsTrigger value="fees" className="h-11 rounded-xl px-2 text-xs sm:px-5 sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                Financials
                                            </TabsTrigger>
                                            <TabsTrigger value="elearning" className="h-11 rounded-xl px-2 text-xs sm:px-5 sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <FileText className="h-4 w-4 mr-2" />
                                                E-Learning
                                            </TabsTrigger>
                                            <TabsTrigger value="profile" className="h-11 rounded-xl px-2 text-xs sm:px-5 sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-card shadow-sm">
                                                <User className="h-4 w-4 mr-2" />
                                                My Account
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
                                                                            <Badge className={calculatePercentageFromScore(g.score, g.assessment_total_marks) >= 70 ? "bg-green-100 text-green-700" : calculatePercentageFromScore(g.score, g.assessment_total_marks) >= 50 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}>
                                                                                {calculatePercentageFromScore(g.score, g.assessment_total_marks).toFixed(1)}%
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
                                            {attendanceNotifications.length > 0 && (
                                                <Card className="mb-5 border-primary/20">
                                                    <CardHeader>
                                                        <CardTitle>Attendance notifications</CardTitle>
                                                        <CardDescription>Same-day register updates and term attendance follow-ups</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2">
                                                        {attendanceNotifications.slice(0, 10).map(notification => (
                                                            <article key={notification.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${notification.read_at ? "border-border bg-background" : "border-primary/30 bg-primary/5"}`}>
                                                                <div>
                                                                    <p className="text-sm font-medium">{notification.message}</p>
                                                                    <p className="mt-1 text-xs text-muted-foreground">{new Date(notification.created_at).toLocaleString()}</p>
                                                                </div>
                                                                {!notification.read_at && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        disabled={markAttendanceNotificationRead.isPending}
                                                                        onClick={() => markAttendanceNotificationRead.mutate(notification.id)}
                                                                    >
                                                                        Mark read
                                                                    </Button>
                                                                )}
                                                            </article>
                                                        ))}
                                                    </CardContent>
                                                </Card>
                                            )}
                                            {todayAttendanceAlerts.length > 0 && (
                                                <Card role="status" className="mb-5 border-amber-300 bg-amber-50">
                                                    <CardContent className="p-4">
                                                        <p className="font-semibold text-amber-900">Attendance update for {selectedChild?.student_name ?? "your child"}</p>
                                                        {todayAttendanceAlerts.map(record => <p key={record.id} className="mt-1 text-sm text-amber-800">{record.session}: marked {record.status}</p>)}
                                                    </CardContent>
                                                </Card>
                                            )}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <Card className="rounded-3xl border-border shadow-md">
                                                    <CardHeader>
                                                        <CardTitle>Attendance History</CardTitle>
                                                        <CardDescription>Daily school presence records</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-4">
                                                            {attendance?.slice(0, 50).map(a => (
                                                                <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-accent/30 transition-all">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${a.status === 'present' ? 'bg-green-100 text-green-600' :
                                                                            a.status === 'absent' ? 'bg-red-100 text-red-600' : a.status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-secondary text-muted-foreground'
                                                                            }`}>
                                                                            {a.status === 'present' ? <CheckCircle2 className="h-5 w-5" /> : a.status === 'absent' ? <AlertCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-bold text-foreground">{new Date(a.date).toLocaleDateString()}</p>
                                                                            <p className="text-xs text-muted-foreground">{a.session} session{a.excuse_reason ? ` · ${a.excuse_reason.replaceAll("_", " ")}` : ""}{a.excuse_note ? ` · ${a.excuse_note}` : ""}</p>
                                                                        </div>
                                                                    </div>
                                                                    <Badge variant="outline" className={
                                                                        a.status === 'present' ? 'text-green-600 border-green-200' :
                                                                            a.status === 'absent' ? 'text-red-600 border-red-200' : a.status === 'late' ? 'text-amber-600 border-amber-200' : ''
                                                                    }>
                                                                        {a.status}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                            {attendance.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No attendance records have been marked yet.</p>}
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
                                                            value={message}
                                                            onChange={event => setMessage(event.target.value)}
                                                            placeholder="Type your message here..."
                                                            className="w-full h-32 p-4 rounded-2xl border border-border bg-background outline-none focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                                                        />
                                                        <Button variant="gold" className="w-full rounded-xl" onClick={sendMessage} disabled={sendingMessage || !message.trim()}>{sendingMessage ? "Sending…" : "Send Message"}</Button>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                                                <Card className="rounded-3xl border-border shadow-md">
                                                    <CardHeader>
                                                        <CardTitle>Attendance by term</CardTitle>
                                                        <CardDescription>Official term summaries from the school register</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        {attendanceSummaries.map(summary => (
                                                            <div key={summary.id} className="rounded-xl border border-border p-3">
                                                                <div className="flex justify-between gap-3 text-sm">
                                                                    <strong>{summary.academic_year} · {summary.term_name}</strong>
                                                                    <span>{Number(summary.attendance_percentage).toFixed(1)}%</span>
                                                                </div>
                                                                <Progress value={Number(summary.attendance_percentage)} className="mt-2 h-2" />
                                                                <p className="mt-2 text-xs text-muted-foreground">
                                                                    {summary.days_present} present · {summary.days_absent} absent · {summary.days_excused} excused · {summary.days_late} late of {summary.total_school_days} scheduled days
                                                                </p>
                                                                {Number(summary.attendance_percentage) < Number(attendanceSettings?.at_risk_percentage ?? 85) && <p className="mt-1 text-xs font-semibold text-amber-700">Attendance is below the school follow-up threshold.</p>}
                                                            </div>
                                                        ))}
                                                        {attendanceSummaries.length === 0 && <p className="text-sm text-muted-foreground">Term summaries will appear as register data is recorded.</p>}
                                                    </CardContent>
                                                </Card>
                                                <Card className="rounded-3xl border-border shadow-md">
                                                    <CardHeader>
                                                        <CardTitle>Submit an absence excuse</CardTitle>
                                                        <CardDescription>Optional supporting document: JPEG, PNG, or PDF up to 8 MB.</CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <form className="space-y-3" onSubmit={submitExcuse}>
                                                            <label className="grid gap-1 text-sm font-medium">
                                                                Child
                                                                <select value={selectedChildId ?? ""} onChange={event => setSelectedChildId(Number(event.target.value))} className="rounded-lg border border-border bg-background px-3 py-2">
                                                                    {parentLinks?.map(link => <option key={link.student} value={link.student}>{link.student_name}</option>)}
                                                                </select>
                                                            </label>
                                                            <label className="grid gap-1 text-sm font-medium">
                                                                Absence date
                                                                <input required type="date" value={excuseDate} max={formatLocalDateKey(new Date())} onChange={event => setExcuseDate(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2" />
                                                            </label>
                                                            <label className="grid gap-1 text-sm font-medium">
                                                                Reason
                                                                <select value={excuseReason} onChange={event => setExcuseReason(event.target.value)} className="rounded-lg border border-border bg-background px-3 py-2">
                                                                    <option value="sick">Sick</option>
                                                                    <option value="funeral">Funeral</option>
                                                                    <option value="family_emergency">Family emergency</option>
                                                                    <option value="school_trip">School trip or sports</option>
                                                                    <option value="fees_related">Fees-related</option>
                                                                    <option value="other">Other</option>
                                                                </select>
                                                            </label>
                                                            <textarea value={excuseNote} onChange={event => setExcuseNote(event.target.value)} maxLength={1000} placeholder="Details for the school (optional)" className="min-h-20 w-full rounded-lg border border-border bg-background p-3 text-sm" />
                                                            <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={event => setExcuseAttachment(event.target.files?.[0])} className="w-full text-sm" aria-label="Optional supporting document" />
                                                            <Button type="submit" variant="gold" disabled={submitAttendanceExcuse.isPending || !selectedChildId} className="w-full">
                                                                {submitAttendanceExcuse.isPending ? "Submitting…" : "Submit excuse"}
                                                            </Button>
                                                        </form>
                                                        <div className="mt-5 space-y-2 border-t border-border pt-4">
                                                            <p className="text-sm font-semibold">Submitted excuses</p>
                                                            {attendanceExcuses.slice(0, 8).map(excuse => (
                                                                <div key={excuse.id} className="flex flex-wrap justify-between gap-2 text-xs">
                                                                    <span>{excuse.date} · {excuse.reason.replaceAll("_", " ")}</span>
                                                                    <Badge variant="outline">{excuse.status}</Badge>
                                                                </div>
                                                            ))}
                                                            {attendanceExcuses.length === 0 && <p className="text-xs text-muted-foreground">No excuses submitted.</p>}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="fees">
                                            <Card className="rounded-3xl border-border shadow-md">
                                                <CardHeader>
                                                    <CardTitle>Student Fees & Financials</CardTitle>
                                                    <CardDescription>Live invoices and recorded payments from the school Accounts portal</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-6">
                                                        {invoices.map(invoice => {
                                                            const balance = Math.max(0, Number(invoice.amount) - Number(invoice.paid));
                                                            const progress = Number(invoice.amount) > 0 ? Math.min(100, Number(invoice.paid) / Number(invoice.amount) * 100) : 0;
                                                            return <div key={invoice.id} className="space-y-4 rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                                                                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                                                                    <div>
                                                                        <h4 className="text-lg font-bold text-foreground">{invoice.invoice_no}</h4>
                                                                        <div className="mt-1 flex flex-wrap items-center gap-3">
                                                                            <Badge variant="outline" className={invoice.status === "paid" ? "border-green-200 bg-green-100 text-green-700" : invoice.status === "partial" ? "border-amber-200 bg-amber-100 text-amber-700" : "border-red-200 bg-red-100 text-red-700"}>{invoice.status}</Badge>
                                                                            <span className="text-sm text-muted-foreground">{invoice.term} · Issued {formatSchoolDate(invoice.date)}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-3 gap-4 text-right">
                                                                        <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Billed</p><p className="font-semibold">{formatMoney(invoice.amount, invoice.currency)}</p></div>
                                                                        <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Paid</p><p className="font-semibold text-green-700">{formatMoney(invoice.paid, invoice.currency)}</p></div>
                                                                        <div><p className="text-xs uppercase tracking-wider text-muted-foreground">Balance</p><p className="font-semibold">{formatMoney(balance, invoice.currency)}</p></div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3"><Progress value={progress} className="h-2 bg-secondary" /><span className="w-12 text-right text-xs text-muted-foreground">{progress.toFixed(0)}%</span></div>
                                                            </div>;
                                                        })}
                                                        {!invoices.length && <div className="py-8 text-center text-muted-foreground">No Accounts invoices found for this student.</div>}
                                                        <div className="border-t border-border pt-5">
                                                            <h4 className="mb-3 font-semibold">Recorded payments</h4>
                                                            <div className="divide-y divide-border rounded-xl border border-border">
                                                                {payments.map(payment => <div key={payment.id} className="flex flex-wrap items-center gap-3 p-4">
                                                                    <div className="min-w-0 flex-1"><p className="font-medium">{payment.method} · {payment.invoice_no}</p><p className="text-xs text-muted-foreground">{formatSchoolDate(payment.date)} · Receipt {payment.receipt_no}{payment.recorded_by_name ? ` · Recorded by ${payment.recorded_by_name}` : ""}</p></div>
                                                                    <p className="font-semibold text-green-700">{formatMoney(payment.amount, payment.currency)}</p>
                                                                </div>)}
                                                                {!payments.length && <div className="p-5 text-center text-sm text-muted-foreground">No recorded payments yet.</div>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="elearning">
                                            {selectedStudent?.class_name
                                                ? <ParentELearningSection studentId={selectedStudent.id} className={selectedStudent.class_name} />
                                                : <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Student class information is not available yet.</CardContent></Card>}
                                        </TabsContent>

                                        <TabsContent value="profile"><Card className="rounded-3xl border-border p-5 shadow-md sm:p-8"><ProfileSection /></Card></TabsContent>
                                    </Tabs>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
            </div>
        </Layout>
    );
};

export default ParentPortal;
