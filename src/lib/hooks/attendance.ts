import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { POLL_REPORT_MS } from "./exams";
import { extractArray, fetchAllPages, toQueryParams } from "./shared";

// --- Attendance (New App) ---

export interface AttendanceRecord {
    id: number;
    student: number;
    student_name: string;
    class_name: string;
    date: string;
    school_class: number | null;
    term: number | null;
    session: "morning" | "afternoon" | "evening";
    status: "present" | "absent" | "late" | "excused" | "sick_bay" | "suspended";
    late_minutes: number;
    excuse_reason: string;
    excuse_note: string;
    marked_by: number | null;
    marked_at: string;
    last_edited_by: number | null;
    last_edited_at: string | null;
}

export interface AttendanceReportSnapshot {
    id: number;
    exam: number;
    student: number;
    term: number | null;
    through_date: string;
    summary: {
        term_summary_id: number | null;
        total_school_days: number;
        marked_days: number;
        days_present: number;
        days_absent: number;
        days_late: number;
        days_excused: number;
        days_sick_bay: number;
        days_suspended: number;
        attendance_percentage: number;
        absent_dates: string[];
        through_date: string;
        is_finalized: boolean;
        is_out_of_date: boolean;
    };
    is_out_of_date: boolean;
    generated_at: string;
}

export interface AttendanceExcuse {
    id: number;
    student: number;
    student_name: string;
    date: string;
    reason: string;
    note: string;
    attachment_url?: string;
    status: "pending" | "approved" | "rejected";
    submitted_at: string;
    reviewed_at: string | null;
}

export interface SchoolCalendarDay {
    id: number;
    date: string;
    day_type: "school_day" | "holiday" | "closed";
    note: string;
    term: number | null;
    updated_at: string;
}

export interface AttendanceSettings {
    id: number;
    edit_cutoff_hours: number;
    at_risk_percentage: number;
    consecutive_absence_threshold: number;
    sessions_enabled: boolean;
    lesson_attendance_enabled: boolean;
}

export interface AttendanceTermSummary {
    id: number;
    student: number;
    term: number;
    term_name: string;
    academic_year: string;
    total_school_days: number;
    days_present: number;
    days_absent: number;
    days_late: number;
    days_excused: number;
    days_sick_bay: number;
    days_suspended: number;
    attendance_percentage: number;
    is_finalized: boolean;
    is_out_of_date: boolean;
}

export interface AttendanceAuditEntry {
    id: number;
    attendance_record: number | null;
    student: number | null;
    actor: number | null;
    action: "created" | "updated" | "deleted";
    old_value: Record<string, unknown> | null;
    new_value: Record<string, unknown> | null;
    reason: string;
    created_at: string;
}

export interface AttendanceNotification {
    id: number;
    student: number;
    student_name: string;
    term: number | null;
    term_name: string | null;
    kind: "absent" | "late" | "low_attendance";
    message: string;
    created_at: string;
    read_at: string | null;
}

export interface AcademicYear {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    is_current: boolean;
}

export interface SchoolTerm {
    id: number;
    name: string;
    academic_year: number;
    academic_year_name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

// Attendance Hooks (Pointed to new /attendance/ API)
export const useAttendanceRecords = (params?: {
    student?: number;
    date?: string;
    status?: string;
    term?: number;
    school_class?: number;
    session?: string;
}, enabled = true) => {
    return useQuery({
        queryKey: ["attendance-records", params],
        queryFn: () => fetchAllPages<AttendanceRecord>("/attendance/attendance/", toQueryParams(params)),
        enabled: enabled && (params?.student === undefined || !!params.student),
        refetchInterval: 60000,
    });
};

export const useUpdateAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<AttendanceRecord> & { student: number; date: string; reason?: string }) => {
            return await api.post<AttendanceRecord>("/attendance/attendance/", data);
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["attendance-records"] }),
                queryClient.invalidateQueries({ queryKey: ["attendance-report-snapshots"] }),
                queryClient.invalidateQueries({ queryKey: ["attendance-summaries"] }),
            ]);
        },
    });
};

export const useBulkUpdateAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (records: Array<Pick<AttendanceRecord, "student" | "date" | "status" | "session"> & { reason?: string }>) =>
            api.post<AttendanceRecord[]>("/attendance/attendance/bulk/", records),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["attendance-records"] }),
                queryClient.invalidateQueries({ queryKey: ["attendance-report-snapshots"] }),
                queryClient.invalidateQueries({ queryKey: ["attendance-summaries"] }),
            ]);
        },
    });
};

export const useAttendanceReportSnapshot = (exam?: number, student?: number, enabled = true) => useQuery({
    queryKey: ["attendance-report-snapshots", exam, student],
    queryFn: async () => {
        const response = await api.get<unknown>("/attendance/report-snapshots/", {
            exam: String(exam),
            student: String(student),
        });
        return extractArray<AttendanceReportSnapshot>(response)[0] ?? null;
    },
    enabled: !!exam && !!student && enabled,
    refetchInterval: exam && student ? POLL_REPORT_MS : false,
});

export const useAttendanceReportSnapshots = (exam?: number) => useQuery({
    queryKey: ["attendance-report-snapshots", exam],
    queryFn: async () => {
        const response = await api.get<unknown>("/attendance/report-snapshots/", { exam: String(exam) });
        return extractArray<AttendanceReportSnapshot>(response);
    },
    enabled: !!exam,
    refetchInterval: exam ? 60000 : false,
});

export const useAttendanceTermSummaries = (
    params?: { student?: number; term?: number; year?: string; term_name?: string },
    enabled = true,
) => useQuery({
    queryKey: ["attendance-summaries", params],
    queryFn: async () => {
        const response = await api.get<unknown>("/attendance/summaries/", toQueryParams(params));
        return extractArray<AttendanceTermSummary>(response);
    },
    enabled,
});

export const useSchoolCalendarDays = (params?: { date?: string; day_type?: string; term?: number }) => useQuery({
    queryKey: ["attendance-calendar", params],
    queryFn: () => fetchAllPages<SchoolCalendarDay>("/attendance/calendar/", toQueryParams(params)),
});

export const useSaveSchoolCalendarDay = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<SchoolCalendarDay, "id" | "updated_at"> & { id?: number }) =>
            data.id
                ? api.patch<SchoolCalendarDay>(`/attendance/calendar/${data.id}/`, data)
                : api.post<SchoolCalendarDay>("/attendance/calendar/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-calendar"] });
        },
    });
};

export const useAttendanceSettings = () => useQuery({
    queryKey: ["attendance-settings"],
    queryFn: () => api.get<AttendanceSettings>("/attendance/settings/"),
});

export const useAcademicYears = (enabled = true) => useQuery({
    queryKey: ["academic-years"],
    queryFn: () => fetchAllPages<AcademicYear>("/school/academic-years/"),
    enabled,
});

export const useSchoolTerms = (params?: { academic_year?: number }, enabled = true) => useQuery({
    queryKey: ["school-terms", params],
    queryFn: () => fetchAllPages<SchoolTerm>("/school/terms/", toQueryParams(params)),
    enabled: !!params?.academic_year && enabled,
});

export const useSaveAcademicYear = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<AcademicYear, "id"> & { id?: number }) =>
            data.id
                ? api.patch<AcademicYear>(`/school/academic-years/${data.id}/`, data)
                : api.post<AcademicYear>("/school/academic-years/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["academic-years"] });
        },
    });
};

export const useSaveSchoolTerm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<SchoolTerm, "id" | "academic_year_name"> & { id?: number }) =>
            data.id
                ? api.patch<SchoolTerm>(`/school/terms/${data.id}/`, data)
                : api.post<SchoolTerm>("/school/terms/", data),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["school-terms"] }),
                queryClient.invalidateQueries({ queryKey: ["academic-years"] }),
            ]);
        },
    });
};

export const useSaveAttendanceSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<AttendanceSettings>) =>
            api.post<AttendanceSettings>("/attendance/settings/", data),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-settings"] });
        },
    });
};

export const useAttendanceExcuses = (params?: { student?: number; status?: string }) => useQuery({
    queryKey: ["attendance-excuses", params],
    queryFn: () => fetchAllPages<AttendanceExcuse>("/attendance/excuses/", toQueryParams(params)),
});

export const useReviewAttendanceExcuse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status, review_note }: { id: number; status: "approved" | "rejected"; review_note?: string }) =>
            api.post<AttendanceExcuse>(`/attendance/excuses/${id}/review/`, { status, review_note }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-excuses"] });
            await queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
            await queryClient.invalidateQueries({ queryKey: ["attendance-summaries"] });
        },
    });
};

export const useAttendanceAuditLog = (params?: { student?: number; actor?: number; action?: string }) => useQuery({
    queryKey: ["attendance-audit-log", params],
    queryFn: async () => {
        const response = await api.get<unknown>("/attendance/audit-log/", toQueryParams(params));
        return extractArray<AttendanceAuditEntry>(response);
    },
});

export const useAttendanceNotifications = () => useQuery({
    queryKey: ["attendance-notifications"],
    queryFn: async () => {
        const response = await api.get<unknown>("/attendance/notifications/");
        return extractArray<AttendanceNotification>(response);
    },
    refetchInterval: 60000,
});

export const useMarkAttendanceNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.post<AttendanceNotification>(`/attendance/notifications/${id}/mark_read/`, {}),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-notifications"] });
        },
    });
};

export const useSubmitAttendanceExcuse = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { student: number; date: string; reason: string; note: string; attachment?: File }) => {
            const form = new FormData();
            form.set("student", String(data.student));
            form.set("date", data.date);
            form.set("reason", data.reason);
            form.set("note", data.note);
            if (data.attachment) form.set("attachment", data.attachment);
            return api.postForm<AttendanceExcuse>("/attendance/excuses/", form);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-excuses"] });
        },
    });
};

export const useRegenerateAttendanceSnapshot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.post<AttendanceReportSnapshot>(`/attendance/report-snapshots/${id}/regenerate/`, {}),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["attendance-report-snapshots"] });
        },
    });
};
