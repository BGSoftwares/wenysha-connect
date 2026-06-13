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

// Helper function to extract array from paginated or non-paginated response
function extractArray<T>(response: any): T[] {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && Array.isArray(response.results)) {
        return response.results;
    }
    return [];
}

// Students
export const useStudents = () => {
    return useQuery({
        queryKey: ["students"],
        queryFn: async () => {
            const response = await api.get<any>("/school/students/");
            return extractArray<Student>(response);
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
            const response = await api.get<any>("/school/classes/");
            return extractArray<SchoolClass>(response);
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
            const response = await api.get<any>("/school/teachers/");
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
            const response = await api.get<any>("/school/allocations/", params as any);
            return extractArray<Allocation>(response);
        },
    });
};

export const useTeacherProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["teacher-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const response = await api.get<any>("/school/teachers/");
            const teachers = extractArray<Teacher>(response);
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
            try {
                const response = await api.get<any>("/school/students/");
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
        enabled: !!user
    });
};

export const useParentProfile = () => {
    const user = getStoredUser();
    return useQuery({
        queryKey: ["parent-profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const response = await api.get<any>("/parents/parents/");
            const parents = extractArray<Parent>(response);
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
            const response = await api.get<any>("/school/subjects/");
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
            const response = await api.get<any>("/library/books/", cleanParams);
            return extractArray<Book>(response);
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
            const response = await api.get<any>("/parents/parents/");
            return extractArray<Parent>(response);
        },
    });
};

export const useStudentParentLinks = (params?: { parent?: number; student?: number }) => {
    return useQuery({
        queryKey: ["student-parents", params],
        queryFn: async () => {
            const response = await api.get<any>("/parents/student-parents/", params as any);
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
            const response = await api.get<any>("/school/grades/", params as any);
            return extractArray<Grade>(response);
        },
        enabled: !!params?.student,
    });
};

// Exam Hooks
export const useExams = (params?: { term?: string; year?: string; status?: string }) => {
    return useQuery({
        queryKey: ["exams", params],
        queryFn: async () => {
            const response = await api.get<any>("/exams/exams/", params as any);
            return extractArray<Exam>(response);
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
            const response = await api.get<any>("/exams/schedules/", params as any);
            return extractArray<ExamSchedule>(response);
        },
    });
};

export const useExamMarks = (params?: { exam?: number; student?: number; subject?: number }) => {
    return useQuery({
        queryKey: ["exam-marks", params],
        queryFn: async () => {
            const response = await api.get<any>("/exams/marks/", params as any);
            return extractArray<ExamMark>(response);
        },
        enabled: !!params?.student || !!params?.exam,
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
            const response = await api.get<any>("/attendance/attendance/", params as any);
            return extractArray<AttendanceRecord>(response);
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
            const response = await api.get<any>("/admissions/applications/");
            return extractArray<AdmissionApplication>(response);
        },
    });
};

export const useStudentFees = (params?: { student?: number; status?: string }) => {
    return useQuery({
        queryKey: ["student-fees", params],
        queryFn: async () => {
            const response = await api.get<any>("/school/student-fees/", params as any);
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
            const response = await api.get<any>("/finance/fee-structures/");
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
            const response = await api.get<any>("/finance/invoices/", cleanParams);
            return extractArray<Invoice>(response);
        },
    });
};

export const usePayments = (params?: { invoice?: number }) => {
    return useQuery({
        queryKey: ["payments", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.invoice) cleanParams.invoice = String(params.invoice);
            const response = await api.get<any>("/finance/payments/", cleanParams);
            return extractArray<Payment>(response);
        },
    });
};

export const useStudentBalances = () => {
    return useQuery({
        queryKey: ["student-balances"],
        queryFn: async () => {
            const response = await api.get<any>("/finance/balances/");
            return extractArray<StudentBalance>(response);
        },
    });
};

export const useDiscounts = (params?: { student?: number }) => {
    return useQuery({
        queryKey: ["discounts", params],
        queryFn: async () => {
            const response = await api.get<any>("/finance/discounts/", params as any);
            return extractArray<Discount>(response);
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
