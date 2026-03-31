import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getStoredUser } from "./api";

// --- Types ---

export interface Student {
    id: number;
    user?: number;
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
}

export interface SchoolClass {
    id: number;
    name: string;
    capacity: number;
    enrolled: number;
    class_teacher: number | null;
    class_teacher_name?: string;
}

export interface Subject {
    id: number;
    name: string;
    code: string;
    department: string;
    description?: string;
}

// --- Hooks ---

// Students
export const useStudents = () => {
    return useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            return await api.get<Student[]>("/school/students/");
        },
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
        },
    });
};

// Classes
export const useClasses = () => {
    return useQuery({
        queryKey: ["classes"],
        queryFn: async () => {
            return await api.get<SchoolClass[]>("/school/classes/");
        },
    });
};

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
            return await api.get<Teacher[]>("/school/teachers/");
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
            return await api.get<Allocation[]>("/school/allocations/", params as any);
        },
    });
};

export const useTeacherProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["teacher-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const teachers = await api.get<Teacher[]>("/school/teachers/");
            return teachers.find(t => t.user === user.id) || null;
        },
        enabled: !!user
    });
};

export const useStudentProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["student-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const students = await api.get<Student[]>("/school/students/");
            return students.find(s => s.user === user.id) || null;
        },
        enabled: !!user
    });
};

export const useParentProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["parent-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const parents = await api.get<Parent[]>("/parents/parents/");
            return parents.find(p => p.user === user.id) || null;
        },
        enabled: !!user
    });
};

// Subjects
export const useSubjects = () => {
    return useQuery({
        queryKey: ["subjects"],
        queryFn: async () => {
            return await api.get<Subject[]>("/school/subjects/");
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
            return await api.get<Book[]>("/library/books/", cleanParams);
        },
    });
};

export const useBorrowBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newBorrowing: Partial<Borrowing>) => {
            return await api.post<Borrowing>("/library/borrowing/", newBorrowing);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["borrowings"] });
            queryClient.invalidateQueries({ queryKey: ["books"] });
        },
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
            return await api.get<Parent[]>("/parents/parents/");
        },
    });
};

export const useStudentParentLinks = (params?: { parent?: number; student?: number }) => {
    return useQuery({
        queryKey: ["student-parents", params],
        queryFn: async () => {
            return await api.get<StudentParent[]>("/parents/student-parents/", params as any);
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

export interface Exam {
    id: number;
    name: string;
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
            return await api.get<Grade[]>("/school/grades/", params as any);
        },
        enabled: !!params?.student,
    });
};

// Exam Hooks
export const useExams = (params?: { term?: string; year?: string; status?: string }) => {
    return useQuery({
        queryKey: ["exams", params],
        queryFn: async () => {
            return await api.get<Exam[]>("/exams/exams/", params as any);
        },
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

export const useExamSchedules = (params?: { exam?: number; subject?: number; school_class?: number }) => {
    return useQuery({
        queryKey: ["exam-schedules", params],
        queryFn: async () => {
            return await api.get<ExamSchedule[]>("/exams/schedules/", params as any);
        },
    });
};

export const useExamMarks = (params?: { exam?: number; student?: number; subject?: number }) => {
    return useQuery({
        queryKey: ["exam-marks", params],
        queryFn: async () => {
            return await api.get<ExamMark[]>("/exams/marks/", params as any);
        },
    });
};

export const useUpdateExamMark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<ExamMark> }) => {
            return await api.patch<ExamMark>(`/exams/marks/${id}/`, data);
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
            return await api.get<AttendanceRecord[]>("/attendance/attendance/", params as any);
        },
        enabled: !params?.student ? true : !!params.student,
    });
};

export const useUpdateAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<AttendanceRecord> & { student: number; date: string }) => {
            // Check if record exists or create new
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
            return await api.get<AdmissionApplication[]>("/admissions/applications/");
        },
    });
};

export const useStudentFees = (params?: { student?: number; status?: string }) => {
    return useQuery({
        queryKey: ["student-fees", params],
        queryFn: async () => {
            return await api.get<StudentFee[]>("/school/student-fees/", params as any);
        },
    });
};

// --- Finance ---

export interface FeeStructure {
    id: number;
    name: string;
    amount: string;
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
    class_name: string;
    term: string;
    amount: string;
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
    percentage: string;
    reason: string;
    status: "approved" | "pending" | "rejected";
    date: string;
}

export const useFeeStructures = () => {
    return useQuery({
        queryKey: ["fee-structures"],
        queryFn: async () => {
            return await api.get<FeeStructure[]>("/finance/fee-structures/");
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
            return await api.get<Invoice[]>("/finance/invoices/", cleanParams);
        },
    });
};

export const usePayments = (params?: { invoice?: number }) => {
    return useQuery({
        queryKey: ["payments", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.invoice) cleanParams.invoice = String(params.invoice);
            return await api.get<Payment[]>("/finance/payments/", cleanParams);
        },
    });
};

export const useStudentBalances = () => {
    return useQuery({
        queryKey: ["student-balances"],
        queryFn: async () => {
            return await api.get<StudentBalance[]>("/finance/balances/");
        },
    });
};

export const useDiscounts = (params?: { student?: number }) => {
    return useQuery({
        queryKey: ["discounts", params],
        queryFn: async () => {
            return await api.get<Discount[]>("/finance/discounts/", params as any);
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
        mutationFn: async (data: { student: number; term: string; amount: number; date: string }) => {
            return await api.post<Invoice>("/finance/invoices/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};
