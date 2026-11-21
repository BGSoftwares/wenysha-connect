import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { extractArray } from "./shared";

// --- Library ---

export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    category?: string;
    copies: number;
    available: number;
    digital_file_url?: string | null;
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
            const response = await api.get<unknown>("/library/books/", cleanParams);
            return extractArray<Book>(response);
        },
    });
};

export const invalidateLibrary = (qc: ReturnType<typeof useQueryClient>) => {
    qc.invalidateQueries({ queryKey: ["borrowings"] });
    qc.invalidateQueries({ queryKey: ["books"] });
};

export const useBorrowBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (bookId: number) => api.post<Borrowing>(`/library/books/${bookId}/borrow/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useSaveBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (book: Partial<Book> & { digital_file?: File | null }) => {
            const fields = { ...book };
            const digital_file = fields.digital_file;
            delete fields.digital_file;
            delete fields.digital_file_url;
            if (digital_file) {
                const formData = new FormData();
                Object.entries(fields).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) formData.append(key, String(value));
                });
                formData.append("digital_file", digital_file);
                return book.id
                    ? api.patchForm<Book>(`/library/books/${book.id}/`, formData)
                    : api.postForm<Book>("/library/books/", formData);
            }
            return book.id
                ? api.patch<Book>(`/library/books/${book.id}/`, fields)
                : api.post<Book>("/library/books/", fields);
        },
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useDeleteBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.delete(`/library/books/${id}/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useBorrowings = (params?: { status?: string }) => {
    return useQuery({
        queryKey: ["borrowings", "all", params],
        queryFn: async () => {
            const p: Record<string, string> = {};
            if (params?.status) p.status = params.status;
            return extractArray<Borrowing>(await api.get<unknown>("/library/borrowings/", p));
        },
    });
};

export const useMyBorrowings = () => {
    return useQuery({
        queryKey: ["borrowings", "mine"],
        queryFn: async () => extractArray<Borrowing>(await api.get<unknown>("/library/borrowings/mine/")),
    });
};

export const useReturnBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.post<Borrowing>(`/library/borrowings/${id}/return_book/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};

export const useRenewBook = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => api.post<Borrowing>(`/library/borrowings/${id}/renew/`),
        onSuccess: () => invalidateLibrary(qc),
    });
};
