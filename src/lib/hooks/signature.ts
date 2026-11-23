import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface MySignature {
    /** Address of the stored signature image, or null when none has been uploaded. */
    url: string | null;
}

const SIGNATURE_KEY = ["my-signature"] as const;

export const useMySignature = (enabled = true) =>
    useQuery({ queryKey: SIGNATURE_KEY, queryFn: () => api.get<MySignature>("/auth/signature/"), enabled });

export const useUploadSignature = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const form = new FormData();
            form.append("image", file);
            return api.postForm<MySignature>("/auth/signature/", form);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SIGNATURE_KEY });
            await queryClient.invalidateQueries({ queryKey: ["report-card-reviews"] });
        },
    });
};

export const useRemoveSignature = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => api.delete<void>("/auth/signature/"),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: SIGNATURE_KEY });
            await queryClient.invalidateQueries({ queryKey: ["report-card-reviews"] });
        },
    });
};
