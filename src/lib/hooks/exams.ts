import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { extractArray, fetchAllPages, toQueryParams } from "./shared";

// --- Exams ---

export const EXAM_REPORT_TYPES = [
    { value: "monthly_report_card", label: "End of Month" },
    { value: "fortnightly_tests", label: "Fortnightly Test" },
    { value: "end_of_1st_term", label: "End of Term 1" },
    { value: "end_of_2nd_term", label: "End of Term 2" },
    { value: "end_of_3rd_term", label: "End of Term 3" },
] as const;

export type ExamReportType = typeof EXAM_REPORT_TYPES[number]["value"];

export interface Exam {
    id: number;
    name: string;
    report_type: ExamReportType;
    results_published: boolean;
    results_published_at: string | null;
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

/** How often open report card screens re-check the server. Focus and reconnect also refresh, so this can be slow. */
export const POLL_REPORT_MS = 60000;

export interface ExamMark {
    id: number;
    exam: number;
    student: number;
    student_name: string;
    subject: number;
    subject_name: string;
    total_marks: number;
    scored: number;
    absent?: boolean;
    comment?: string;
}

export interface MarkSubmission {
    id: number;
    exam: number;
    exam_name: string;
    subject: number;
    subject_name: string;
    school_class: number;
    class_name: string;
    teacher_name: string;
    note: string;
    submitted_at: string;
}

export interface ReportCardReview {
    id: number;
    exam: number;
    student: number;
    student_name: string;
    school_class: number;
    class_name: string;
    class_teacher_comment: string;
    principal_comment: string;
    class_teacher_submitted_at: string | null;
    class_teacher_submitted_by: number | null;
    class_teacher_name: string | null;
    principal_reviewed_at: string | null;
    principal_reviewed_by: number | null;
    principal_name: string | null;
    /** Day the next term opens, entered by the class teacher. */
    next_term_begins: string | null;
    class_teacher_signature_url: string | null;
    principal_signature_url: string | null;
}

export interface ExamRanking {
    class_position: number | null;
    class_total: number;
    level_position: number | null;
    level_total: number | null;
    level_name: string | null;
    /** Every class ranked together at this level, e.g. ["3B1", "3B2"]; one entry means the class stands alone. */
    level_classes?: string[];
}

// Exam Hooks
export const useExams = (
    params?: { term?: string; year?: string; status?: string },
    options?: { refetchInterval?: number | false; enabled?: boolean },
) => {
    return useQuery({
        queryKey: ["exams", params],
        queryFn: () => fetchAllPages<Exam>("/exams/exams/", toQueryParams(params)),
        refetchInterval: options?.refetchInterval,
        enabled: options?.enabled,
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
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["exams"] }),
                queryClient.invalidateQueries({ queryKey: ["exam-marks"] }),
                queryClient.invalidateQueries({ queryKey: ["exam-ranking"] }),
            ]);
        },
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

export const useExamMarks = (
    params?: { exam?: number; student?: number; subject?: number; school_class?: number },
    enabled = true,
    refetchIntervalMs: number | false = params?.student ? POLL_REPORT_MS : false,
) => {
    return useQuery({
        queryKey: ["exam-marks", params],
        queryFn: () => fetchAllPages<ExamMark>("/exams/exam-marks/", toQueryParams(params)),
        enabled: (!!params?.student || !!params?.exam) && enabled,
        refetchInterval: refetchIntervalMs,
    });
};

export const useMarkSubmissions = (
    params?: { exam?: number; school_class?: number },
    enabled = true,
    refetchIntervalMs: number | false = false,
) => useQuery({
    queryKey: ["mark-submissions", params],
    queryFn: () => fetchAllPages<MarkSubmission>("/exams/mark-submissions/", toQueryParams(params)),
    enabled: enabled && (!!params?.exam || !!params?.school_class),
    refetchInterval: refetchIntervalMs,
});

export const useExamRanking = (exam?: number, student?: number) => {
    return useQuery({
        queryKey: ["exam-ranking", exam, student],
        queryFn: async () => api.get<ExamRanking>("/exams/exam-rankings/", {
            exam: String(exam),
            student: String(student),
        }),
        enabled: !!exam && !!student,
        refetchInterval: exam && student ? POLL_REPORT_MS : false,
    });
};

export const useSaveExamMark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { exam: number; student: number; subject: number; total_marks: number; scored: number; absent?: boolean; comment?: string }) => {
            const existing = await api.get<unknown>("/exams/exam-marks/", {
                exam: String(data.exam),
                student: String(data.student),
                subject: String(data.subject),
            });
            const marks = extractArray<ExamMark>(existing);
            if (marks[0]) return api.patch<ExamMark>(`/exams/exam-marks/${marks[0].id}/`, data);
            return api.post<ExamMark>("/exams/exam-marks/", data);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["exam-marks"] }),
                queryClient.invalidateQueries({ queryKey: ["exam-ranking"] }),
            ]);
        },
    });
};

export const useSaveExamMarkSheet = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: {
            exam: number;
            school_class: number;
            subject: number;
            marks: Array<{ student: number; total_marks: number; scored: number; absent?: boolean; comment: string }>;
        }) => api.post<ExamMark[]>('/exams/mark-sheets/', data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['exam-marks'] }),
                queryClient.invalidateQueries({ queryKey: ['exam-ranking'] }),
            ]);
        },
    });
};

export const useUpdateExamMark = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<ExamMark> }) => {
            return await api.patch<ExamMark>(`/exams/exam-marks/${id}/`, data);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["exam-marks"] }),
                queryClient.invalidateQueries({ queryKey: ["exam-ranking"] }),
            ]);
        },
    });
};

export const useReportCardReviews = (
    exam?: number,
    student?: number,
    enabled = true,
    refetchIntervalMs: number | false = student ? POLL_REPORT_MS : false,
) => useQuery({
    queryKey: ["report-card-reviews", exam, student],
    queryFn: () => fetchAllPages<ReportCardReview>("/exams/report-card-reviews/", toQueryParams({
        exam,
        student,
    })),
    enabled: !!exam && enabled,
    refetchInterval: refetchIntervalMs,
});

export const useSaveClassReportComments = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            exam: number;
            school_class: number;
            next_term_begins?: string;
            comments: Array<{ student: number; comment: string }>;
        }) => api.post<ReportCardReview[]>("/exams/report-card-reviews/save-class-comments/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["report-card-reviews"] });
        },
    });
};

export const useSubmitClassReports = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { exam: number; school_class: number }) =>
            api.post<ReportCardReview[]>("/exams/report-card-reviews/submit-class/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["report-card-reviews"] });
        },
    });
};

export const useUpdateReportCardReview = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { exam: number; student: number; principal_comment: string }) =>
            api.post<ReportCardReview>("/exams/report-card-reviews/save-principal-comment/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["report-card-reviews"] });
        },
    });
};
