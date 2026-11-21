import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getStoredUser } from "../api";
import { POLL_REPORT_MS } from "./exams";
import type { Parent } from "./parents";
import { extractArray, fetchAllPages, toQueryParams } from "./shared";
import type { TimetableEntry } from "./shared";
import type { Allocation, SchoolClass, Student, Subject, Teacher } from "./types";

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
    refetchInterval: POLL_REPORT_MS,
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

export const useStudentProfile = (enabled = true) => {
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
        enabled: !!user && enabled,
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
