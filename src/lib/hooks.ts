import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// --- Types ---

export interface Student {
    id: number;
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
    name: string;
    department: string;
    phone: string;
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
