import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { extractArray } from "./shared";

// School projects
export type ProjectStatus = "planned" | "active" | "on_hold" | "completed";
export interface ProjectItem { id: number; project: number; kind: "activity" | "resource"; title: string; notes: string; due_date: string | null; cost: string; done: boolean }
export interface SchoolProject {
    id: number; name: string; description: string; status: ProjectStatus; start_date: string | null; end_date: string | null;
    lead: number | null; lead_name: string; budget: string | null; currency: "USD" | "ZWG"; items: ProjectItem[];
    spent: string; progress: { done: number; total: number };
}
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
    { value: "planned", label: "Planned" }, { value: "active", label: "Active" },
    { value: "on_hold", label: "On hold" }, { value: "completed", label: "Completed" },
];

export const useProjects = () => useQuery({
    queryKey: ["projects"],
    queryFn: async () => extractArray<SchoolProject>(await api.get<unknown>("/school/projects/")),
});

export const useSaveProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }: Partial<Omit<SchoolProject, "items">> & { id?: number }) =>
            id ? api.patch<SchoolProject>(`/school/projects/${id}/`, body) : api.post<SchoolProject>("/school/projects/", body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    });
};

export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete<void>(`/school/projects/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    });
};

export const useSaveProjectItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...body }: Partial<ProjectItem> & { id?: number }) =>
            id ? api.patch<ProjectItem>(`/school/project-items/${id}/`, body) : api.post<ProjectItem>("/school/project-items/", body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    });
};

export const useDeleteProjectItem = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete<void>(`/school/project-items/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    });
};
