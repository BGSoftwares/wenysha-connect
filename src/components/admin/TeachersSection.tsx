import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Users, Edit, Trash2, Plus, School, BookOpen, Layers, Link2, Search, Phone } from "lucide-react";

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join("");
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import {
    fetchAllPages,
    useSubjects,
    useAllocations,
    useCreateAllocation,
    useDeleteAllocation,
    type SchoolClass,
    type Teacher,
    type Subject,
    type Allocation
} from "@/lib/hooks";

type PortalAccount = {
    id: number;
    username: string;
    email: string;
    full_name: string;
    role_name: string;
    is_active: boolean;
};

interface TeachersSectionProps {
    teachers: Teacher[] | undefined;
    classes: SchoolClass[] | undefined;
    subjects?: Subject[] | undefined;
    allocations?: Allocation[] | undefined;
    isLoading: boolean;
    onAddTeacher: () => void;
    onEditTeacher: (teacher: Teacher) => void;
    onDeleteTeacher: (teacher: Teacher) => void;
    onAssignClassTeacher: (schoolClassId: number, teacherId: number | null) => void;
    onAssignSubjectAllocation?: (teacherId: number, subjectId: number, classId: number, periods?: number, room?: string) => Promise<void>;
    onRemoveSubjectAllocation?: (allocationId: number) => Promise<void>;
}

const TeachersSection = ({
    teachers,
    classes,
    subjects: propSubjects,
    allocations: propAllocations,
    isLoading,
    onAddTeacher,
    onEditTeacher,
    onDeleteTeacher,
    onAssignClassTeacher,
    onAssignSubjectAllocation,
    onRemoveSubjectAllocation
}: TeachersSectionProps) => {
    // Class Teacher (Homeroom) state
    const [selectedClasses, setSelectedClasses] = useState<Record<number, string>>({});

    // Subject & Classroom Teaching Assignments state
    const [selectedSubjects, setSelectedSubjects] = useState<Record<number, string>>({});
    const [selectedClassesForSubject, setSelectedClassesForSubject] = useState<Record<number, string>>({});
    const [periodsMap, setPeriodsMap] = useState<Record<number, number>>({});
    const [roomsMap, setRoomsMap] = useState<Record<number, string>>({});
    const [isSubmitting, setIsSubmitting] = useState<Record<number, boolean>>({});
    const [selectedAccounts, setSelectedAccounts] = useState<Record<number, string>>({});
    const [linkingAccounts, setLinkingAccounts] = useState<Record<number, boolean>>({});

    const queryClient = useQueryClient();
    const accountsQuery = useQuery({
        queryKey: ["admin-teacher-accounts"],
        queryFn: () => fetchAllPages<PortalAccount>("/auth/accounts/", { portal_role: "teacher" }),
    });

    // Fallbacks if not passed as props
    const { data: fallbackSubjects } = useSubjects();
    const { data: fallbackAllocations } = useAllocations();

    const subjectsList = propSubjects ?? fallbackSubjects ?? [];
    const allocationsList = propAllocations ?? fallbackAllocations ?? [];

    const [search, setSearch] = useState("");
    const term = search.trim().toLowerCase();
    const filteredTeachers = (teachers ?? []).filter(t => !term || [t.name, t.employee_id, t.department, t.phone]
        .some(value => String(value ?? "").toLowerCase().includes(term)));
    const totalTeachers = teachers?.length ?? 0;
    const homeroomCount = new Set((classes ?? []).map(c => c.class_teacher).filter(Boolean)).size;
    const linkedCount = (teachers ?? []).filter(t => t.user != null).length;

    const createAllocationMutation = useCreateAllocation();
    const deleteAllocationMutation = useDeleteAllocation();

    const handleLinkAccount = async (teacher: Teacher, accountValue: string) => {
        const accountId = accountValue ? Number(accountValue) : null;
        setLinkingAccounts(previous => ({ ...previous, [teacher.id]: true }));
        try {
            await api.patch(`/school/teachers/${teacher.id}/`, { user: accountId });
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["teachers"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-accounts"] }),
                queryClient.invalidateQueries({ queryKey: ["admin-teacher-accounts"] }),
                queryClient.invalidateQueries({ queryKey: ["teacher-profile"] }),
                queryClient.invalidateQueries({ queryKey: ["allocations"] }),
                queryClient.invalidateQueries({ queryKey: ["timetable"] }),
            ]);
            setSelectedAccounts(previous => {
                const next = { ...previous };
                delete next[teacher.id];
                return next;
            });
            toast.success(accountId
                ? "Teacher account linked. Their assigned classes and subjects will appear in the teacher portal."
                : "Teacher account unlinked.");
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setLinkingAccounts(previous => ({ ...previous, [teacher.id]: false }));
        }
    };

    const handleAssignSubject = async (teacherId: number, teacherName: string) => {
        const subjectId = Number(selectedSubjects[teacherId]);
        const classId = Number(selectedClassesForSubject[teacherId]);
        const periods = periodsMap[teacherId] ?? 5;
        const room = roomsMap[teacherId]?.trim() ?? "";

        if (!subjectId || !classId) {
            toast.error("Please select both a subject and a classroom");
            return;
        }

        if (!Number.isInteger(periods) || periods < 1 || periods > 35) {
            toast.error("Periods per week must be between 1 and 35");
            return;
        }
        if (!room) {
            toast.error("Choose a room so the master timetable can avoid room clashes");
            return;
        }

        // Check for duplicate assignment
        const existing = allocationsList.find(
            a => a.teacher === teacherId && a.subject === subjectId && a.school_class === classId
        );
        if (existing) {
            toast.warning(`${teacherName} is already assigned to teach ${existing.subject_name} in ${existing.class_name}`);
            return;
        }

        setIsSubmitting(prev => ({ ...prev, [teacherId]: true }));
        try {
            if (onAssignSubjectAllocation) {
                await onAssignSubjectAllocation(teacherId, subjectId, classId, periods, room);
            } else {
                await createAllocationMutation.mutateAsync({
                    teacher: teacherId,
                    subject: subjectId,
                    school_class: classId,
                    periods,
                    room,
                });
            }

            const subjectObj = subjectsList.find(s => s.id === subjectId);
            const classObj = classes?.find(c => c.id === classId);
            toast.success(`Assigned ${subjectObj?.name || "Subject"} (${classObj?.name || "Class"}) to ${teacherName}`);

            // Reset inputs for this teacher card
            setSelectedSubjects(prev => ({ ...prev, [teacherId]: "" }));
            setSelectedClassesForSubject(prev => ({ ...prev, [teacherId]: "" }));
            setPeriodsMap(prev => ({ ...prev, [teacherId]: 5 }));
            setRoomsMap(prev => ({ ...prev, [teacherId]: "" }));
        } catch (error) {
            toast.error(getErrorMessage(error));
        } finally {
            setIsSubmitting(prev => ({ ...prev, [teacherId]: false }));
        }
    };

    const handleRemoveSubjectAllocation = async (alloc: Allocation, teacherName: string) => {
        if (!window.confirm(`Remove ${alloc.subject_name} in ${alloc.class_name} from ${teacherName}?`)) {
            return;
        }

        try {
            if (onRemoveSubjectAllocation) {
                await onRemoveSubjectAllocation(alloc.id);
            } else {
                await deleteAllocationMutation.mutateAsync(alloc.id);
            }
            toast.success(`Removed ${alloc.subject_name} (${alloc.class_name}) from ${teacherName}`);
        } catch (error) {
            toast.error(getErrorMessage(error));
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="teacher-hero relative overflow-hidden rounded-2xl p-6 sm:p-8 text-primary-foreground">
                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">Staff Directory</p>
                        <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-1">Teacher Management</h2>
                        <p className="text-sm opacity-80 mt-1 max-w-xl">
                            Manage teachers, class teacher assignments, and teaching subjects across classrooms
                        </p>
                    </div>
                    <Button onClick={onAddTeacher} variant="gold" className="self-start lg:self-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Teacher
                    </Button>
                </div>
                <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Teachers", value: totalTeachers, icon: Users },
                        { label: "Class teachers", value: homeroomCount, icon: School },
                        { label: "Lessons assigned", value: allocationsList.length, icon: BookOpen },
                        { label: "Portal linked", value: linkedCount, icon: Link2 },
                    ].map(stat => (
                        <div key={stat.label} className="teacher-stat rounded-xl p-3 sm:p-4">
                            <stat.icon className="h-4 w-4 text-accent" />
                            <div className="mt-2 text-2xl font-bold leading-none">{stat.value}</div>
                            <div className="text-[11px] uppercase tracking-wider opacity-75 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search by name, staff ID, department or phone"
                    aria-label="Search teachers"
                    className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2.5 text-sm text-foreground shadow-sm"
                />
            </div>

            {isLoading ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span>Loading teachers...</span>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => {
                        const teacherIdNum = Number(teacher.id);
                        const currentAccountId = teacher.user == null ? "" : String(teacher.user);
                        const selectedAccountId = selectedAccounts[teacherIdNum] ?? currentAccountId;
                        const linkedAccount = accountsQuery.data?.find(account => account.id === teacher.user);
                        const availableAccounts = (accountsQuery.data ?? []).filter(account => {
                            const linkedToAnotherTeacher = teachers?.some(other => other.id !== teacher.id && other.user === account.id);
                            return !linkedToAnotherTeacher;
                        });
                        const accountSelectionChanged = selectedAccountId !== currentAccountId;

                        // Find all allocations for this teacher (either from teacher.allocations or global allocations)
                        const teacherAllocations = allocationsList.filter(a => a.teacher === teacherIdNum);
                        const uniqueClassIds = new Set(teacherAllocations.map(a => a.school_class));
                        const uniqueSubjectIds = new Set(teacherAllocations.map(a => a.subject));

                        const assignedClasses = classes?.filter(cls => cls.class_teacher === teacherIdNum) || [];

                        return (
                            <div key={teacher.id} className="teacher-card-3d group flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
                                <div className="teacher-card-banner relative px-6 pt-6 pb-10 text-primary-foreground">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md teacher-chip">
                                            {teacher.employee_id || `AbleGodStaff${String(teacher.id).padStart(3, "0")}`}
                                        </span>
                                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${teacher.user ? "bg-accent text-accent-foreground" : "teacher-chip"}`}>
                                            {teacher.user ? "Portal active" : "No portal"}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-6 -mt-8 relative">
                                    <div className="flex items-end gap-4">
                                        <div className="teacher-avatar-3d h-16 w-16 shrink-0 rounded-2xl flex items-center justify-center font-heading text-xl font-bold text-primary-foreground">
                                            {initialsOf(teacher.name) || <User className="h-7 w-7" />}
                                        </div>
                                        <div className="min-w-0 pb-1">
                                            <h3 className="font-heading font-bold text-foreground leading-tight text-lg truncate">{teacher.name}</h3>
                                            <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">{teacher.department || "General"} Department</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Phone className="h-3.5 w-3.5" />
                                        {teacher.phone || "No contact"}
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                                        {[
                                            { label: "Classes", value: uniqueClassIds.size },
                                            { label: "Subjects", value: uniqueSubjectIds.size },
                                            { label: "Homeroom", value: assignedClasses.length },
                                        ].map(metric => (
                                            <div key={metric.label} className="rounded-xl border border-border bg-secondary/40 py-2">
                                                <div className="text-lg font-bold text-primary leading-none">{metric.value}</div>
                                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{metric.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="px-6 pb-6">
                                <div>

                                    {/* Edit / Delete Buttons */}
                                    <div className="flex gap-2 mt-5">
                                        <Button variant="outline" size="sm" onClick={() => onEditTeacher(teacher)} className="flex-1 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-colors">
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm" aria-label={`Delete ${teacher.name}`} onClick={() => onDeleteTeacher(teacher)} className="rounded-lg hover:border-destructive/50 hover:bg-destructive/5 transition-colors group/del">
                                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover/del:text-destructive" />
                                        </Button>
                                    </div>

                                    <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4">
                                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                            <Link2 className="h-4 w-4 text-primary" />
                                            Teacher Portal Account
                                        </div>
                                        <p className="mb-3 text-xs text-muted-foreground">
                                            {teacher.user
                                                ? `Linked to ${linkedAccount?.full_name || linkedAccount?.username || `account #${teacher.user}`}${linkedAccount?.email ? ` · ${linkedAccount.email}` : ""}`
                                                : "No portal account linked. Create a Teacher or Class Teacher account under Users & Roles, then link it here."}
                                        </p>
                                        {accountsQuery.error
                                            ? <p className="mb-3 text-xs text-destructive">Could not load accounts: {getErrorMessage(accountsQuery.error)}</p>
                                            : <div className="flex flex-col gap-2 sm:flex-row">
                                                <select
                                                    aria-label={`Select portal account for ${teacher.name}`}
                                                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-2 text-xs text-foreground"
                                                    value={selectedAccountId}
                                                    disabled={accountsQuery.isLoading || linkingAccounts[teacherIdNum]}
                                                    onChange={event => setSelectedAccounts(previous => ({ ...previous, [teacherIdNum]: event.target.value }))}
                                                >
                                                    <option value="">No account linked</option>
                                                    {availableAccounts.map(account => (
                                                        <option key={account.id} value={account.id} disabled={!account.is_active}>
                                                            {account.full_name || account.username} · {account.email || account.username} · {account.role_name}{!account.is_active ? " · inactive" : account.id === teacher.user ? " · currently linked" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 text-xs"
                                                    disabled={!accountSelectionChanged || accountsQuery.isLoading || linkingAccounts[teacherIdNum]}
                                                    onClick={() => void handleLinkAccount(teacher, selectedAccountId)}
                                                >
                                                    {linkingAccounts[teacherIdNum] ? "Saving…" : "Save link"}
                                                </Button>
                                            </div>}
                                        {!accountsQuery.isLoading && !accountsQuery.error && availableAccounts.length === 0 && (
                                            <p className="mt-2 text-xs text-muted-foreground">No teacher-role accounts are in the account database yet. Create one under Users &amp; Roles.</p>
                                        )}
                                        {availableAccounts.length > 0 && !availableAccounts.some(account => account.is_active) && (
                                            <p className="mt-2 text-xs text-muted-foreground">Teacher accounts are listed, but they must be activated under Users &amp; Roles before they can be linked.</p>
                                        )}
                                    </div>

                                    {/* 1. Class Teacher Assignment (Homeroom) */}
                                    <div className="mt-5 rounded-xl border border-border bg-secondary/20 p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <School className="h-4 w-4 text-primary" />
                                                Class Teacher Assignment
                                            </div>
                                            {assignedClasses.length > 0 && (
                                                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    Homeroom
                                                </span>
                                            )}
                                        </div>

                                        <p className="mb-3 text-xs text-muted-foreground">
                                            Assigned class{assignedClasses.length === 1 ? "" : "es"}:{" "}
                                            {assignedClasses.length > 0
                                                ? assignedClasses.map(cls => (
                                                    <span key={cls.id} className="mr-1 inline-flex items-center gap-1 font-medium text-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                                                        {cls.name}
                                                        <button
                                                            type="button"
                                                            className="text-destructive hover:underline text-[11px] font-normal"
                                                            onClick={() => onAssignClassTeacher(cls.id, null)}
                                                            aria-label={`Remove ${teacher.name} as class teacher of ${cls.name}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))
                                                : <span className="italic">None</span>}
                                        </p>

                                        <div className="flex gap-2">
                                            <select
                                                aria-label={`Choose a class for ${teacher.name}`}
                                                className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                                                value={selectedClasses[teacherIdNum] ?? ""}
                                                onChange={event => setSelectedClasses(previous => ({
                                                    ...previous,
                                                    [teacherIdNum]: event.target.value,
                                                }))}
                                            >
                                                <option value="">Select class to assign</option>
                                                {classes?.map(schoolClass => (
                                                    <option key={schoolClass.id} value={schoolClass.id}>
                                                        {schoolClass.name}{schoolClass.class_teacher && schoolClass.class_teacher !== teacherIdNum ? ` · ${schoolClass.class_teacher_name || "Assigned"}` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs"
                                                disabled={!selectedClasses[teacherIdNum]}
                                                onClick={() => {
                                                    const classId = Number(selectedClasses[teacherIdNum]);
                                                    if (classId) onAssignClassTeacher(classId, teacherIdNum);
                                                }}
                                            >
                                                Assign
                                            </Button>
                                        </div>
                                    </div>

                                    {/* 2. Subject & Class Teaching Assignment (Multiple classrooms & multiple subjects) */}
                                    <div className="mt-4 rounded-xl border border-border bg-secondary/20 p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <BookOpen className="h-4 w-4 text-accent" />
                                                Subject & Classroom Teaching
                                            </div>
                                            {teacherAllocations.length > 0 && (
                                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                                                    {teacherAllocations.length} assigned
                                                </span>
                                            )}
                                        </div>

                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Subjects and classrooms this teacher teaches:
                                        </p>

                                        {/* Counter summary */}
                                        {teacherAllocations.length > 0 && (
                                            <div className="mb-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                                                <span className="inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-border">
                                                    <Layers className="h-3 w-3 text-primary" />
                                                    {uniqueClassIds.size} classroom{uniqueClassIds.size === 1 ? "" : "s"}
                                                </span>
                                                <span className="inline-flex items-center gap-1 bg-background px-2 py-0.5 rounded border border-border">
                                                    <BookOpen className="h-3 w-3 text-accent" />
                                                    {uniqueSubjectIds.size} subject{uniqueSubjectIds.size === 1 ? "" : "s"}
                                                </span>
                                            </div>
                                        )}

                                        {/* Assigned Subjects & Classes List */}
                                        {teacherAllocations.length === 0 ? (
                                            <div className="mb-3 text-xs text-muted-foreground italic bg-background/50 rounded-lg p-3 border border-dashed border-border/80 text-center">
                                                No teaching subjects assigned yet.
                                            </div>
                                        ) : (
                                            <div className="mb-3 max-h-48 overflow-y-auto space-y-1.5 pr-1">
                                                {teacherAllocations.map(alloc => (
                                                    <div
                                                        key={alloc.id}
                                                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-background border border-border/70 hover:border-primary/40 transition-all text-xs"
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                                                            <span className="font-semibold text-foreground truncate">{alloc.subject_name}</span>
                                                            <span className="text-muted-foreground text-[10px]">in</span>
                                                            <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded text-[11px]">
                                                                {alloc.class_name}
                                                            </span>
                                                            {alloc.periods > 0 && (
                                                                <span className="text-muted-foreground text-[10px] bg-secondary px-1.5 py-0.5 rounded">
                                                                    {alloc.periods} p/wk
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveSubjectAllocation(alloc, teacher.name)}
                                                            className="text-muted-foreground hover:text-destructive p-1 rounded hover:bg-destructive/10 transition-colors"
                                                            title={`Remove ${alloc.subject_name} in ${alloc.class_name} from ${teacher.name}`}
                                                            aria-label={`Remove ${alloc.subject_name} in ${alloc.class_name} from ${teacher.name}`}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Form to Assign Subject & Classroom to this Teacher */}
                                        <div className="space-y-2 pt-2 border-t border-border/60">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Subject</label>
                                                    <select
                                                        aria-label={`Choose subject for ${teacher.name}`}
                                                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                                                        value={selectedSubjects[teacherIdNum] ?? ""}
                                                        onChange={e => setSelectedSubjects(prev => ({
                                                            ...prev,
                                                            [teacherIdNum]: e.target.value
                                                        }))}
                                                    >
                                                        <option value="">Select subject</option>
                                                        {subjectsList.map(s => (
                                                            <option key={s.id} value={s.id}>
                                                                {s.name} {s.code ? `(${s.code})` : ""}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Classroom</label>
                                                    <select
                                                        aria-label={`Choose class for ${teacher.name} to teach subject`}
                                                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                                                        value={selectedClassesForSubject[teacherIdNum] ?? ""}
                                                        onChange={e => setSelectedClassesForSubject(prev => ({
                                                            ...prev,
                                                            [teacherIdNum]: e.target.value
                                                        }))}
                                                    >
                                                        <option value="">Select class</option>
                                                        {classes?.map(c => (
                                                            <option key={c.id} value={c.id}>
                                                                {c.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <div className="flex items-center gap-1.5 flex-1">
                                                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">Periods/wk:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="35"
                                                        placeholder="5"
                                                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                                                        value={periodsMap[teacherIdNum] ?? 5}
                                                        onChange={e => setPeriodsMap(prev => ({
                                                            ...prev,
                                                            [teacherIdNum]: Number(e.target.value) || 5
                                                        }))}
                                                    />
                                                </div>
                                                <input
                                                    type="text"
                                                    aria-label={`Room for ${teacher.name}'s timetable allocation`}
                                                    placeholder="Room / venue"
                                                    className="min-w-28 flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground"
                                                    value={roomsMap[teacherIdNum] ?? ""}
                                                    onChange={event => setRoomsMap(prev => ({ ...prev, [teacherIdNum]: event.target.value }))}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="gold"
                                                    className="h-8 text-xs font-semibold px-3 shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                    disabled={
                                                        !selectedSubjects[teacherIdNum] ||
                                                        !selectedClassesForSubject[teacherIdNum] ||
                                                        !roomsMap[teacherIdNum]?.trim() ||
                                                        isSubmitting[teacherIdNum]
                                                    }
                                                    onClick={() => handleAssignSubject(teacherIdNum, teacher.name)}
                                                >
                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                    {isSubmitting[teacherIdNum] ? "Assigning..." : "Assign Subject"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredTeachers.length === 0 && (
                        <div className="col-span-full p-12 text-center border-2 border-dashed border-border rounded-xl text-muted-foreground">
                            {teachers?.length ? "No teachers match your search." : "No teachers registered in the system."}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TeachersSection;
