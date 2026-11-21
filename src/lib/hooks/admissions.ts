import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { Grade, StudentFee } from "./academics";
import { POLL_REPORT_MS } from "./exams";
import { extractArray, fetchAllPages, toQueryParams } from "./shared";

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

export const useGrades = (
    params?: { student?: number; assessment?: number },
    refetchIntervalMs: number | false = 60000,
) => {
    return useQuery({
        queryKey: ["grades", params],
        queryFn: () => fetchAllPages<Grade>("/school/grades/", toQueryParams(params)),
        enabled: !!params?.student,
        refetchInterval: refetchIntervalMs,
        refetchIntervalInBackground: false,
    });
};

export interface StudentPerformanceSummary {
    class_position: number | null;
    class_total: number;
    current_average: number | null;
    improvement: number | null;
    improvement_period: string | null;
    previous_period: string | null;
}

export const useStudentPerformanceSummary = (
    student?: number,
    term?: number,
    refetchIntervalMs: number | false = POLL_REPORT_MS,
) => useQuery({
    queryKey: ["student-performance-summary", student, term],
    queryFn: () => api.get<StudentPerformanceSummary>(
        "/school/student-performance-summary/",
        toQueryParams({ student, term }),
    ),
    enabled: !!student,
    refetchInterval: refetchIntervalMs,
    refetchIntervalInBackground: false,
});

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
        refetchInterval: 15000,
    });
};
