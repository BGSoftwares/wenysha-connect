import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { extractArray, toQueryParams } from "./shared";

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
        refetchInterval: 15000,
    });
};
