import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getStoredUser } from "./api";
import type { FinanceCurrency } from "./finance";

// --- Types ---

export interface Student {
    id: number;
    user?: number;
    account_email?: string | null;
    next_of_kin?: Array<{ id: number; name: string; phone: string; email: string }>;
    student_id: string;
    name: string;
    school_class: number;
    class_name: string; // Read-only from serializer
    gender: string;
    status: "Active" | "Inactive";
    date_of_birth?: string;
    address?: string;
}

export interface Teacher {
    id: number;
    user?: number;
    name: string;
    department: string;
    phone: string;
    employee_id?: string;
    allocations?: Allocation[];
}

export interface Allocation {
    id: number;
    teacher: number;
    teacher_name: string;
    subject: number;
    subject_name: string;
    school_class: number;
    class_name: string;
    periods: number;
    room: string;
    scheduled_periods?: Array<{ day_of_week: string; period_start: string; period_end: string; room: string }>;
}

export interface SchoolClass {
    id: number;
    name: string;
    capacity: number;
    enrolled: number;
    class_teacher: number | null;
    class_teacher_name?: string;
    parents_whatsapp_group?: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    department: string;
    description?: string;
}

// --- Hooks ---

// Helper function to extract array from paginated or non-paginated response
function extractArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
        return response as T[];
    }
    if (typeof response === "object" && response !== null && "results" in response) {
        const results = response.results;
        if (Array.isArray(results)) return results as T[];
    }
    return [];
}

export async function fetchAllPages<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    const results: T[] = [];
    let page = 1;

    while (true) {
        const response = await api.get<unknown>(path, { ...params, page: String(page) });
        if (Array.isArray(response)) return [...results, ...response as T[]];
        if (typeof response !== "object" || response === null || !("results" in response)) {
            return results;
        }

        const pageResults = response.results;
        if (Array.isArray(pageResults)) results.push(...pageResults as T[]);
        if (!("next" in response) || !response.next) return results;
        page += 1;
    }
}

export interface TimetableEntry {
    id: number;
    school_class: number;
    class_name: string;
    day_of_week: string;
    period_start: string;
    period_end: string;
    subject?: number;
    subject_name: string;
    room: string;
    teacher?: number | null;
    teacher_name: string;
}

function toQueryParams(params?: Record<string, string | number | undefined>): Record<string, string> | undefined {
    if (!params) return undefined;
    return Object.fromEntries(
        Object.entries(params)
            .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
            .map(([key, value]) => [key, String(value)]),
    );
}

// Students
export const useStudents = () => {
    return useQuery({
        queryKey: ["students"],
        queryFn: () => fetchAllPages<Student>("/school/students/"),
        refetchInterval: 15000,
    });
};

export const useCreateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newStudent: Partial<Student>) => {
            return await api.post<Student>("/school/students/", newStudent);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            queryClient.invalidateQueries({ queryKey: ["exam-ranking"] });
            queryClient.invalidateQueries({ queryKey: ["student-profile"] });
        },
    });
};

export const useUpdateStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Student> }) => {
            return await api.patch<Student>(`/school/students/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            queryClient.invalidateQueries({ queryKey: ["exam-ranking"] });
            queryClient.invalidateQueries({ queryKey: ["exam-marks"] });
            queryClient.invalidateQueries({ queryKey: ["student-profile"] });
        },
    });
};

export const useDeleteStudent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/school/students/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["students"] });
            queryClient.invalidateQueries({ queryKey: ["classes"] });
            queryClient.invalidateQueries({ queryKey: ["exam-ranking"] });
            queryClient.invalidateQueries({ queryKey: ["exam-marks"] });
            queryClient.invalidateQueries({ queryKey: ["student-profile"] });
        },
    });
};

// Classes
export const useClasses = () => {
    return useQuery({
        queryKey: ["classes"],
        queryFn: async () => {
            const response = await api.get<unknown>("/school/classes/");
            return extractArray<SchoolClass>(response);
        },
    });
};

export const useTimetable = (schoolClass?: number, extra?: { teacher?: number; allClasses?: boolean }) => useQuery({
    queryKey: ["timetable", schoolClass, extra],
    queryFn: async () => fetchAllPages<TimetableEntry>("/school/timetable/", toQueryParams({
        school_class: schoolClass,
        teacher: extra?.teacher,
    })),
    enabled: schoolClass !== undefined || extra?.teacher !== undefined || extra?.allClasses === true,
    refetchInterval: 5000,
});

export const useCreateClass = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newClass: Partial<SchoolClass>) => {
            return await api.post<SchoolClass>("/school/classes/", newClass);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["classes"] });
        },
    });
};

// Teachers
export const useTeachers = () => {
    return useQuery({
        queryKey: ["teachers"],
        queryFn: async () => {
            const response = await api.get<unknown>("/school/teachers/");
            return extractArray<Teacher>(response);
        },
    });
};

export const useCreateTeacher = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newTeacher: Partial<Teacher>) => {
            return await api.post<Teacher>("/school/teachers/", newTeacher);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
        },
    });
};

export const useAllocations = (params?: { teacher?: number; subject?: number; school_class?: number }) => {
    return useQuery({
        queryKey: ["allocations", params],
        queryFn: async () => {
            return await fetchAllPages<Allocation>("/school/allocations/", toQueryParams(params));
        },
    });
};

export const useCreateAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { teacher: number; subject: number; school_class: number; periods?: number; room: string }) => {
            return await api.post<Allocation>("/school/allocations/", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["allocations"] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            queryClient.invalidateQueries({ queryKey: ["timetable"] });
        },
    });
};

export const useDeleteAllocation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (allocationId: number) => {
            return await api.delete(`/school/allocations/${allocationId}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["allocations"] });
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            queryClient.invalidateQueries({ queryKey: ["timetable"] });
        },
    });
};

export const useTeacherProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["teacher-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const response = await api.get<unknown>("/school/teachers/");
            const teachers = extractArray<Teacher>(response);
            return teachers.find(t => t.user === user.id) || null;
        },
        enabled: !!user,
        refetchInterval: 15000,
    });
};

export const useStudentProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["student-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            try {
                const response = await api.get<unknown>("/school/students/");
                const students = extractArray<Student>(response);
                
                // Find student - handle both number and string comparison
                const found = students.find(s => {
                    return s.user === user.id || String(s.user) === String(user.id);
                });
                
                return found || null;
            } catch (error) {
                console.error("Error fetching student profile:", error);
                return null;
            }
        },
        enabled: !!user,
        refetchInterval: 15000,
    });
};

export const useParentProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["parent-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const response = await api.get<unknown>("/parents/parents/");
            const parents = extractArray<Parent>(response);
            return parents.find(p => p.user === user.id) || null;
        },
        enabled: !!user,
        refetchInterval: 15000,
    });
};

// Subjects
export const useSubjects = () => {
    return useQuery({
        queryKey: ["subjects"],
        queryFn: async () => {
            const response = await api.get<unknown>("/school/subjects/");
            return extractArray<Subject>(response);
        },
    });
};

export const useCreateSubject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newSubject: Partial<Subject>) => {
            return await api.post<Subject>("/school/subjects/", newSubject);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["subjects"] });
        },
    });
};

// --- Library ---

export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    copies: number;
    available: number;
}

export interface Borrowing {
    id: number;
    book: number;
    book_title: string;
    student: number;
    student_name: string;
    class_name: string;
    borrow_date: string;
    due_date: string;
    return_date?: string;
    status: "Borrowed" | "Returned" | "Overdue";
}

export const useBooks = (params?: { category?: string; search?: string }) => {
    return useQuery({
        queryKey: ["books", params],
        queryFn: async () => {
            // Filter out undefined values for api.get
            const cleanParams: Record<string, string> = {};
            if (params?.category) cleanParams.category = params.category;
            if (params?.search) cleanParams.search = params.search;
            const response = await api.get<unknown>("/library/books/", cleanParams);
            return extractArray<Book>(response);
        },
    });
};

const invalidateLibrary = (qc: ReturnType<typeof useQueryClient>) => {
    qc.invalidateQueries({ queryKey: ["borrowings"] });
    qc.invalidateQueries({ queryKey: ["books"] });
};

export const useBorrowBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (bookId: number) => api.post<Borrowing>(`/library/books/${bookId}/borrow/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useSaveBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (book: Partial<Book>) =>
            book.id ? api.patch<Book>(`/library/books/${book.id}/`, book) : api.post<Book>("/library/books/", book),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useDeleteBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.delete(`/library/books/${id}/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useBorrowings = (params?: { status?: string }) => {
    return useQuery({
        queryKey: ["borrowings", "all", params],
        queryFn: async () => {
            const p: Record<string, string> = {};
            if (params?.status) p.status = params.status;
            return extractArray<Borrowing>(await api.get<unknown>("/library/borrowings/", p));
        },
    });
};

export const useMyBorrowings = () => {
    return useQuery({
        queryKey: ["borrowings", "mine"],
        queryFn: async () => extractArray<Borrowing>(await api.get<unknown>("/library/borrowings/mine/")),
    });
};

export const useReturnBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.post<Borrowing>(`/library/borrowings/${id}/return_book/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useRenewBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.post<Borrowing>(`/library/borrowings/${id}/renew/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

// --- Parents ---

export interface Parent {
    id: number;
    user?: number;
    name: string;
    phone: string;
    email: string;
    address?: string;
    status: string;
    children: string[]; // These are strings (names) from the serializer
}

export interface StudentParent {
    id: number;
    student: number;
    student_name: string;
    parent: number;
    parent_name: string;
}

export const useParents = () => {
    return useQuery({
        queryKey: ["parents"],
        queryFn: async () => {
            const response = await api.get<unknown>("/parents/parents/");
            return extractArray<Parent>(response);
        },
    });
};

export const useStudentParentLinks = (params?: { parent?: number; student?: number }) => {
    return useQuery({
        queryKey: ["student-parents", params],
        queryFn: async () => {
            const response = await api.get<unknown>("/parents/student-parents/", toQueryParams(params));
            return extractArray<StudentParent>(response);
        },
    });
};

// --- Academic Logic (Grades, Attendance, Fees) ---

export interface Grade {
    id: number;
    student: number;
    student_name: string;
    assessment: number;
    assessment_name: string;
    subject_name: string;
    score: number;
    remarks: string;
    date_recorded: string;
}

export interface Attendance {
    id: number;
    student: number;
    student_name: string;
    date: string;
    status: "Present" | "Absent" | "Late" | "Excused";
    remarks: string;
}

export interface StudentFee {
    id: number;
    student: number;
    student_name: string;
    fee_structure: number;
    fee_name: string;
    amount_due: number;
    amount_paid: number;
    status: "Pending" | "Partial" | "Paid";
}

// --- Exams ---

export const EXAM_REPORT_TYPES = [
    { value: "fortnightly_tests", label: "Fortnightly Tests" },
    { value: "monthly_report_card", label: "Monthly Report Card" },
    { value: "end_of_1st_term", label: "End of 1st Term" },
    { value: "end_of_2nd_term", label: "End of 2nd Term" },
    { value: "end_of_3rd_term", label: "End of 3rd Term" },
] as const;

export type ExamReportType = typeof EXAM_REPORT_TYPES[number]["value"];

export interface Exam {
    id: number;
    name: string;
    report_type: ExamReportType;
    results_published: boolean;
    term: string;
    year: string;
    start_date: string;
    end_date: string;
    status: "scheduled" | "ongoing" | "completed" | "grading";
    classes: number[];
    subjects: number[];
}

export interface ExamSchedule {
    id: number;
    exam: number;
    exam_name: string;
    subject: number;
    subject_name: string;
    school_class: number;
    class_name: string;
    date: string;
    start_time: string;
    end_time: string;
    venue: string;
    invigilator: string;
}

export interface ExamMark {
    id: number;
    exam: number;
    student: number;
    student_name: string;
    subject: number;
    subject_name: string;
    total_marks: number;
    scored: number;
    comment?: string;
}

export interface ExamRanking {
    class_position: number | null;
    class_total: number;
    level_position: number | null;
    level_total: number | null;
    level_name: string | null;
}

// --- Attendance (New App) ---

export interface AttendanceRecord {
    id: number;
    student: number;
    student_name: string;
    class_name: string;
    date: string;
    status: "present" | "absent" | "late";
}

// --- Admissions ---

export interface AdmissionApplication {
    id: number;
    student_name: string;
    applied_class: string;
    guardian_name: string;
    email: string;
    phone: string;
    status: "Pending" | "Approved" | "Rejected";
    submission_date: string;
}

export const useGrades = (params?: { student?: number; assessment?: number }) => {
    return useQuery({
        queryKey: ["grades", params],
        queryFn: async () => {
            const response = await api.get<unknown>("/school/grades/", toQueryParams(params));
            return extractArray<Grade>(response);
        },
        enabled: !!params?.student,
    });
};

// Exam Hooks
export const useExams = (params?: { term?: string; year?: string; status?: string }) => {
    return useQuery({
        queryKey: ["exams", params],
        queryFn: () => fetchAllPages<Exam>("/exams/exams/", toQueryParams(params)),
    });
};

export const useCreateExam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Exam>) => {
            return await api.post<Exam>("/exams/exams/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exams"] });
        },
    });
};

export const useUpdateExam = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<Exam> }) => {
            return await api.patch<Exam>(`/exams/exams/${id}/`, data);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exams"] }),
    });
};

export const useExamSchedules = (params?: { exam?: number; subject?: number; school_class?: number }) => {
    return useQuery({
        queryKey: ["exam-schedules", params],
        queryFn: async () => {
            const response = await api.get<unknown>("/exams/exam-schedules/", toQueryParams(params));
            return extractArray<ExamSchedule>(response);
        },
    });
};

export const useExamMarks = (params?: { exam?: number; student?: number; subject?: number }) => {
    return useQuery({
        queryKey: ["exam-marks", params],
        queryFn: () => fetchAllPages<ExamMark>("/exams/exam-marks/", toQueryParams(params)),
        enabled: !!params?.student || !!params?.exam,
    });
};

export const useExamRanking = (exam?: number, student?: number) => {
    return useQuery({
        queryKey: ["exam-ranking", exam, student],
        queryFn: async () => api.get<ExamRanking>("/exams/exam-rankings/", {
            exam: String(exam),
            student: String(student),
        }),
        enabled: !!exam && !!student,
    });
};

export const useSaveExamMark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { exam: number; student: number; subject: number; total_marks: number; scored: number; comment?: string }) => {
            const existing = await api.get<unknown>("/exams/exam-marks/", {
                exam: String(data.exam),
                student: String(data.student),
                subject: String(data.subject),
            });
            const marks = extractArray<ExamMark>(existing);
            if (marks[0]) return api.patch<ExamMark>(`/exams/exam-marks/${marks[0].id}/`, data);
            return api.post<ExamMark>("/exams/exam-marks/", data);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["exam-marks"] }),
    });
};

export const useUpdateExamMark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<ExamMark> }) => {
            return await api.patch<ExamMark>(`/exams/exam-marks/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["exam-marks"] });
        },
    });
};

// Attendance Hooks (Pointed to new /attendance/ API)
export const useAttendanceRecords = (params?: { student?: number; date?: string; status?: string }) => {
    return useQuery({
        queryKey: ["attendance-records", params],
        queryFn: async () => {
            const response = await api.get<unknown>("/attendance/attendance/", toQueryParams(params));
            return extractArray<AttendanceRecord>(response);
        },
        enabled: !params?.student ? true : !!params.student,
    });
};

export const useUpdateAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<AttendanceRecord> & { student: number; date: string }) => {
            const existing = await api.get<unknown>("/attendance/attendance/", { student: String(data.student), date: data.date });
            const records = extractArray<AttendanceRecord>(existing);
            if (records[0]) {
                return await api.patch<AttendanceRecord>(`/attendance/attendance/${records[0].id}/`, { status: data.status });
            }
            return await api.post<AttendanceRecord>("/attendance/attendance/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
        },
    });
};

// Admissions Hooks
export const useAdmissions = () => {
    return useQuery({
        queryKey: ["admissions"],
        queryFn: async () => {
            const response = await api.get<unknown>("/admissions/admissions/");
            return extractArray<AdmissionApplication>(response);
        },
    });
};

export const useStudentFees = (params?: { student?: number; status?: string }) => {
    return useQuery({
        queryKey: ["student-fees", params],
        queryFn: async () => {
            const response = await api.get<unknown>("/school/student-fees/", toQueryParams(params));
            return extractArray<StudentFee>(response);
        },
        enabled: !!params?.student,
    });
};

// --- Finance ---

export interface FeeStructure {
    id: number;
    name: string;
    amount: string;
    currency: FinanceCurrency;
    term: string;
    form: string;
    category?: string;
    boarding_type?: string;
    active: boolean;
}

export interface Invoice {
    id: number;
    invoice_no: string;
    student: number;
    student_name: string;
    student_id_display?: string;
    class_name: string;
    term: string;
    amount: string;
    currency: FinanceCurrency;
    paid: string;
    status: "paid" | "partial" | "unpaid";
    date: string;
}

export interface Payment {
    id: number;
    receipt_no: string;
    invoice: number;
    invoice_no: string;
    student_name: string;
    amount: string;
    currency: FinanceCurrency;
    method: string;
    reference?: string;
    date: string;
    recorded_by_name?: string;
}

export interface StudentBalance {
    id: number;
    student_id: string;
    student: string;
    class_name: string;
    currency: FinanceCurrency;
    totalBilled: number;
    totalPaid: number;
    balance: number;
    lastPayment: string;
    status: "cleared" | "overpaid" | "owing";
}

export interface Discount {
    id: number;
    student: number;
    student_name: string;
    discount_type: string;
    amount: string;
    currency: FinanceCurrency;
    percentage: string;
    reason: string;
    status: "approved" | "pending" | "rejected";
    date: string;
}

export interface OnlinePayment {
    id: number;
    invoice: number;
    invoice_no: string;
    student_name: string;
    provider: "ecocash" | "zimswitch";
    status: "pending" | "paid" | "failed" | "cancelled";
    amount: string;
    currency: FinanceCurrency;
    client_reference: string;
    provider_reference: string;
    created_at: string;
    updated_at: string;
    message?: string;
    checkout_id?: string;
    widget_url?: string;
    brands?: string;
    shopper_result_url?: string;
}

export interface OnlinePaymentConfig {
    currencies: FinanceCurrency[];
    providers: {
        ecocash: { enabled: boolean; currencies: FinanceCurrency[] };
        zimswitch: {
            enabled: boolean;
            currencies: FinanceCurrency[];
            widget_url: string;
            brands: string;
        };
    };
}

export const useFeeStructures = () => {
    return useQuery({
        queryKey: ["fee-structures"],
        queryFn: async () => {
            const response = await api.get<unknown>("/finance/fee-structures/");
            return extractArray<FeeStructure>(response);
        },
    });
};

export const useCreateFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<FeeStructure>) => {
            return await api.post<FeeStructure>("/finance/fee-structures/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useUpdateFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<FeeStructure> }) => {
            return await api.patch<FeeStructure>(`/finance/fee-structures/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useDeleteFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/finance/fee-structures/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useInvoices = (params?: { student?: number; status?: string }) => {
    return useQuery({
        queryKey: ["invoices", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.student) cleanParams.student = String(params.student);
            if (params?.status) cleanParams.status = params.status;
            return fetchAllPages<Invoice>("/finance/invoices/", cleanParams);
        },
    });
};

export const usePayments = (params?: { invoice?: number; student?: number }) => {
    return useQuery({
        queryKey: ["payments", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.invoice) cleanParams.invoice = String(params.invoice);
            if (params?.student) cleanParams.invoice__student = String(params.student);
            return fetchAllPages<Payment>("/finance/payments/", cleanParams);
        },
    });
};

export const useStudentBalances = () => {
    return useQuery({
        queryKey: ["student-balances"],
        queryFn: async () => {
            const response = await api.get<unknown>("/finance/balances/");
            return extractArray<StudentBalance>(response);
        },
    });
};

export const useDiscounts = (params?: { student?: number }) => {
    return useQuery({
        queryKey: ["discounts", params],
        queryFn: async () => {
            return fetchAllPages<Discount>("/finance/discounts/", toQueryParams(params));
        },
    });
};

export const useCreateDiscount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Discount>) => {
            return await api.post<Discount>("/finance/discounts/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discounts"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { invoice: number; amount: number; method: string; reference?: string; date: string }) => {
            return await api.post<Payment>("/finance/payments/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { student: number; term: string; amount: number; currency: FinanceCurrency; date: string }) => {
            return await api.post<Invoice>("/finance/invoices/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useOnlinePaymentConfig = () => useQuery({
    queryKey: ["online-payment-config"],
    queryFn: () => api.get<OnlinePaymentConfig>("/finance/online-payments/config/"),
});

export const useOnlinePayments = () => useQuery({
    queryKey: ["online-payments"],
    queryFn: async () => extractArray<OnlinePayment>(await api.get<unknown>("/finance/online-payments/")),
  refetchInterval: 15000,
});

export const useStartOnlinePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { invoice: number; amount: number; provider: OnlinePayment["provider"]; phone?: string }) =>
            api.post<OnlinePayment>("/finance/online-payments/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["online-payments"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useRefreshOnlinePayment = (reference: string, enabled = true) => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ["online-payment", reference],
        queryFn: async () => {
            const payment = await api.get<OnlinePayment>(`/finance/online-payments/by-reference/${encodeURIComponent(reference)}/`);
            if (payment.status !== "pending") {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["online-payments"] }),
                    queryClient.invalidateQueries({ queryKey: ["payments"] }),
                    queryClient.invalidateQueries({ queryKey: ["invoices"] }),
                    queryClient.invalidateQueries({ queryKey: ["student-balances"] }),
                ]);
            }
            return payment;
        },
        enabled: enabled && !!reference,
        refetchInterval: (query) => query.state.data?.status === "pending" ? 8000 : false,
    });
};

export interface Notice {
    id: number;
    title: string;
    content: string;
    author: string;
    date: string;
    audience: string;
    priority: string;
    pinned: boolean;
    recipient_type: "all_students" | "all_parents" | "staff" | "class" | "individual";
    recipient_class: number | null;
    recipient_class_name?: string;
    recipient_student: number | null;
    recipient_student_name?: string;
    created_by: number | null;
    status: "pending" | "approved" | "rejected";
    approved_by: number | null;
    approved_at: string | null;
    review_note: string;
    views: number;
}

export const useNotices = () => useQuery({
    queryKey: ["notices"],
    queryFn: () => fetchAllPages<Notice>("/notices/notices/"),
    refetchInterval: 15000,
});

export interface LearningMaterial {
    id: number;
    title: string;
    subject_name: string;
    class_name: string;
    file_url: string;
    file_name?: string;
    file_type: string;
    uploaded_by: string;
    uploaded_by_user: number | null;
    visibility: "class" | "staff";
    created_at: string;
}

export interface LearningMaterialInput {
    title: string;
    subject_name: string;
    class_name: string;
    uploaded_by?: string;
    visibility?: "class" | "staff";
    file?: File;
}

function toLearningMaterialFormData(data: LearningMaterialInput): FormData {
    const form = new FormData();
    form.append("title", data.title);
    form.append("subject_name", data.subject_name);
    form.append("class_name", data.class_name);
    if (data.uploaded_by) form.append("uploaded_by", data.uploaded_by);
    if (data.visibility) form.append("visibility", data.visibility);
    if (data.file) form.append("file", data.file);
    return form;
}

export const useLearningMaterials = (params?: { subject_name?: string; class_name?: string; visibility?: "class" | "staff" }) => useQuery({
    queryKey: ["learning-materials", params],
    queryFn: async () => extractArray<LearningMaterial>(await api.get<unknown>("/content/materials/", toQueryParams(params))),
    refetchInterval: 15000,
});

export const useCreateLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: LearningMaterialInput) => api.postForm<LearningMaterial>("/content/materials/", toLearningMaterialFormData(data)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export const useDeleteLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => { await api.delete(`/content/materials/${id}/`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export const useUpdateLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: LearningMaterialInput }) => {
            return await api.patchForm<LearningMaterial>(`/content/materials/${id}/`, toLearningMaterialFormData(data));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export interface LearningAssignment {
    id: number;
    title: string;
    instructions: string;
    school_class: number;
    class_name: string;
    subject: number;
    subject_name: string;
    teacher: number;
    teacher_name: string;
    due_at: string | null;
    attachment_url: string;
    attachment_name: string;
    is_published: boolean;
    submission_count: number;
    created_at: string;
    updated_at: string;
}

export interface LearningAssignmentInput {
    title: string;
    instructions: string;
    school_class: number;
    subject: number;
    due_at?: string;
    attachment?: File;
    is_published?: boolean;
}

export interface LearningSubmission {
    id: number;
    assignment: number;
    assignment_title: string;
    class_name: string;
    subject_name: string;
    student: number;
    student_name: string;
    answer: string;
    attachment_url: string;
    attachment_name: string;
    submitted_at: string;
    teacher_feedback: string;
    score: string | null;
    reviewed_at: string | null;
}

export interface LearningSubmissionInput {
    assignment: number;
    answer: string;
    attachment?: File;
}

function toLearningAssignmentFormData(data: LearningAssignmentInput): FormData {
    const form = new FormData();
    form.append("title", data.title);
    form.append("instructions", data.instructions);
    form.append("school_class", String(data.school_class));
    form.append("subject", String(data.subject));
    if (data.due_at) form.append("due_at", data.due_at);
    if (data.attachment) form.append("attachment", data.attachment);
    if (data.is_published !== undefined) form.append("is_published", String(data.is_published));
    return form;
}

function toLearningSubmissionFormData(data: LearningSubmissionInput): FormData {
    const form = new FormData();
    form.append("assignment", String(data.assignment));
    form.append("answer", data.answer);
    if (data.attachment) form.append("attachment", data.attachment);
    return form;
}

export const useLearningAssignments = () => useQuery({
    queryKey: ["learning-assignments"],
    queryFn: () => fetchAllPages<LearningAssignment>("/content/assignments/"),
    refetchInterval: 15000,
});

export const useCreateLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: LearningAssignmentInput) => api.postForm<LearningAssignment>(
            "/content/assignments/", toLearningAssignmentFormData(data),
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
        },
    });
};

export const useUpdateLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: LearningAssignmentInput }) => api.patchForm<LearningAssignment>(
            `/content/assignments/${id}/`, toLearningAssignmentFormData(data),
        ),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] }),
    });
};

export const useDeleteLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => { await api.delete(`/content/assignments/${id}/`); },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-submissions"] });
        },
    });
};

export const useLearningSubmissions = (assignment?: number) => useQuery({
    queryKey: ["learning-submissions", assignment],
    queryFn: () => fetchAllPages<LearningSubmission>(
        "/content/submissions/", assignment ? { assignment: String(assignment) } : undefined,
    ),
    refetchInterval: 15000,
});

export const useSubmitLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number; data: LearningSubmissionInput }) => id
            ? api.patchForm<LearningSubmission>(`/content/submissions/${id}/`, toLearningSubmissionFormData(data))
            : api.postForm<LearningSubmission>("/content/submissions/", toLearningSubmissionFormData(data)),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-submissions"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
        },
    });
};

