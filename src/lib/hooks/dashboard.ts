import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { FinanceCurrency } from "../finance";
import { extractArray } from "./shared";

// --- Admin dashboard summary (real attendance, marks and upcoming events) ---

export interface DashboardSummary {
    attendance_trend: Array<{ month: string; rate: number | null }>;
    marks_by_subject: Array<{ subject: string; average: number }>;
    events: Array<{ date: string; title: string; kind: string }>;
}

export const useDashboardSummary = () =>
    useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: () => api.get<DashboardSummary>("/auth/dashboard/summary/"),
        staleTime: 60_000,
    });

/** The same charts for the signed-in user (teacher, student, parent...), limited to what their role may see. */
export const useMyDashboard = () =>
    useQuery({
        queryKey: ["dashboard-mine"],
        queryFn: () => api.get<DashboardSummary>("/auth/dashboard/mine/"),
        staleTime: 60_000,
    });


export type ExpenseCategory = "salaries" | "utilities" | "supplies" | "maintenance" | "transport" | "food" | "events" | "other";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
    { value: "salaries", label: "Salaries and wages" },
    { value: "utilities", label: "Utilities" },
    { value: "supplies", label: "Teaching supplies" },
    { value: "maintenance", label: "Repairs and maintenance" },
    { value: "transport", label: "Transport and fuel" },
    { value: "food", label: "Kitchen and food" },
    { value: "events", label: "Events and activities" },
    { value: "other", label: "Other" },
];

export interface Expense {
    id: number;
    date: string;
    category: ExpenseCategory;
    category_label: string;
    description: string;
    paid_to: string;
    amount: string;
    currency: FinanceCurrency;
    method: string;
    reference: string;
    recorded_by: string;
}

export interface IncomeExpenseSummary {
    year: number;
    totals: Partial<Record<FinanceCurrency, { income: string; expenses: string; net: string }>>;
    months: { month: string; currencies: Partial<Record<FinanceCurrency, { income: string; expenses: string; net: string }>> }[];
    categories: { category: ExpenseCategory; label: string; totals: Partial<Record<FinanceCurrency, string>> }[];
}

export const useExpenses = () => useQuery({
    queryKey: ["expenses"],
    queryFn: async () => extractArray<Expense>(await api.get<unknown>("/finance/expenses/")),
});

export const useIncomeExpenseSummary = (year: number) => useQuery({
    queryKey: ["expenses", "summary", year],
    queryFn: () => api.get<IncomeExpenseSummary>("/finance/expenses/summary/", { year: String(year) }),
});

export const useCreateExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (body: { date: string; category: ExpenseCategory; description: string; paid_to?: string; amount: string; currency: FinanceCurrency; method?: string; reference?: string }) =>
            api.post<Expense>("/finance/expenses/", body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    });
};

export const useDeleteExpense = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.delete<void>(`/finance/expenses/${id}/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["expenses"] }),
    });
};
