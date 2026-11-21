import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { FinanceCurrency } from "../finance";
import { extractArray, fetchAllPages, toQueryParams } from "./shared";

// --- Finance ---

export interface FeeStructure {
    id: number;
    name: string;
    amount: string;
    currency: FinanceCurrency;
    term: string;
    form: string;
    category?: string;
    boarding_type?: string;
    active: boolean;
}

export interface Invoice {
    id: number;
    invoice_no: string;
    student: number;
    student_name: string;
    student_id_display?: string;
    class_name: string;
    term: string;
    amount: string;
    currency: FinanceCurrency;
    paid: string;
    status: "paid" | "partial" | "unpaid";
    date: string;
}

export interface Payment {
    id: number;
    receipt_no: string;
    invoice: number;
    invoice_no: string;
    student_name: string;
    amount: string;
    currency: FinanceCurrency;
    method: string;
    reference?: string;
    date: string;
    recorded_by_name?: string;
}

export interface StudentBalance {
    id: number;
    student_id: string;
    student: string;
    class_name: string;
    currency: FinanceCurrency;
    totalBilled: number;
    totalPaid: number;
    balance: number;
    lastPayment: string;
    status: "cleared" | "overpaid" | "owing";
}

export interface Discount {
    id: number;
    student: number;
    student_name: string;
    discount_type: string;
    amount: string;
    currency: FinanceCurrency;
    percentage: string;
    reason: string;
    status: "approved" | "pending" | "rejected";
    date: string;
}

export interface OnlinePayment {
    id: number;
    invoice: number;
    invoice_no: string;
    student_name: string;
    provider: "ecocash" | "zimswitch" | "paynow" | "bank_transfer";
    status: "pending" | "paid" | "failed" | "cancelled";
    amount: string;
    currency: FinanceCurrency;
    client_reference: string;
    provider_reference: string;
    created_at: string;
    updated_at: string;
    message?: string;
    checkout_id?: string;
    widget_url?: string;
    brands?: string;
    shopper_result_url?: string;
    redirect_url?: string;
}

export interface BankAccountDetails {
    account_name: string;
    account_number: string;
    bank: string;
    branch: string;
}

export interface OnlinePaymentConfig {
    currencies: FinanceCurrency[];
    providers: {
        ecocash: { enabled: boolean; currencies: FinanceCurrency[] };
        paynow?: { enabled: boolean; currencies: FinanceCurrency[]; methods: Array<"web" | "ecocash" | "onemoney"> };
        zimswitch: {
            enabled: boolean;
            currencies: FinanceCurrency[];
            widget_url: string;
            brands: string;
        };
        bank_transfer?: {
            enabled: boolean;
            currencies: FinanceCurrency[];
        };
    };
    bank_account?: BankAccountDetails;
}

export const useFeeStructures = () => {
    return useQuery({
        queryKey: ["fee-structures"],
        queryFn: async () => {
            const response = await api.get<unknown>("/finance/fee-structures/");
            return extractArray<FeeStructure>(response);
        },
    });
};

export const useCreateFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<FeeStructure>) => {
            return await api.post<FeeStructure>("/finance/fee-structures/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useUpdateFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Partial<FeeStructure> }) => {
            return await api.patch<FeeStructure>(`/finance/fee-structures/${id}/`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useDeleteFeeStructure = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/finance/fee-structures/${id}/`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["fee-structures"] });
        },
    });
};

export const useInvoices = (params?: { student?: number; status?: string }, enabled = true) => {
    return useQuery({
        queryKey: ["invoices", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.student) cleanParams.student = String(params.student);
            if (params?.status) cleanParams.status = params.status;
            return fetchAllPages<Invoice>("/finance/invoices/", cleanParams);
        },
        enabled: enabled && (params?.student === undefined || !!params.student),
        refetchInterval: 15000,
    });
};

export const usePayments = (params?: { invoice?: number; student?: number }) => {
    return useQuery({
        queryKey: ["payments", params],
        queryFn: async () => {
            const cleanParams: Record<string, string> = {};
            if (params?.invoice) cleanParams.invoice = String(params.invoice);
            if (params?.student) cleanParams.invoice__student = String(params.student);
            return fetchAllPages<Payment>("/finance/payments/", cleanParams);
        },
        enabled: params?.student === undefined || !!params.student,
        refetchInterval: 15000,
    });
};

export const useStudentBalances = () => {
    return useQuery({
        queryKey: ["student-balances"],
        queryFn: async () => {
            const response = await api.get<unknown>("/finance/balances/");
            return extractArray<StudentBalance>(response);
        },
        refetchInterval: 15000,
    });
};

export const useDiscounts = (params?: { student?: number }) => {
    return useQuery({
        queryKey: ["discounts", params],
        queryFn: async () => {
            return fetchAllPages<Discount>("/finance/discounts/", toQueryParams(params));
        },
    });
};

export const useCreateDiscount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<Discount>) => {
            return await api.post<Discount>("/finance/discounts/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["discounts"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
            queryClient.invalidateQueries({ queryKey: ["student-fees"] });
        },
    });
};

export const useCreatePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { invoice: number; amount: number; method: string; reference?: string; date: string }) => {
            return await api.post<Payment>("/finance/payments/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { student: number; term: string; amount: number; currency: FinanceCurrency; date: string }) => {
            return await api.post<Invoice>("/finance/invoices/", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useOnlinePaymentConfig = () => useQuery({
    queryKey: ["online-payment-config"],
    queryFn: () => api.get<OnlinePaymentConfig>("/finance/online-payments/config/"),
});

export const useOnlinePayments = (
    params?: { invoice?: number; status?: OnlinePayment["status"] },
    enabled = true,
) => useQuery({
    queryKey: ["online-payments", params],
    queryFn: async () => {
        const cleanParams: Record<string, string> = {};
        if (params?.invoice) cleanParams.invoice = String(params.invoice);
        if (params?.status) cleanParams.status = params.status;
        return extractArray<OnlinePayment>(await api.get<unknown>("/finance/online-payments/", cleanParams));
    },
    enabled,
    // A single invoice is watched by its own status query; broader lists refresh on their own.
    refetchInterval: params?.invoice ? false : 15000,
});

export const useStartOnlinePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { invoice: number; amount: number; provider: OnlinePayment["provider"]; phone?: string; reference?: string; paynow_method?: "web" | "ecocash" | "onemoney" }) =>
            api.post<OnlinePayment>("/finance/online-payments/", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["online-payments"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useConfirmOnlinePayment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ clientReference, providerReference }: { clientReference: string; providerReference?: string }) =>
            api.post<OnlinePayment>(`/finance/online-payments/by-reference/${encodeURIComponent(clientReference)}/confirm/`, {
                provider_reference: providerReference,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["online-payments"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
            queryClient.invalidateQueries({ queryKey: ["invoices"] });
            queryClient.invalidateQueries({ queryKey: ["student-balances"] });
        },
    });
};

export const useRefreshOnlinePayment = (reference: string, enabled = true) => {
    const queryClient = useQueryClient();
    return useQuery({
        queryKey: ["online-payment", reference],
        queryFn: async () => {
            const payment = await api.get<OnlinePayment>(`/finance/online-payments/by-reference/${encodeURIComponent(reference)}/`);
            if (payment.status !== "pending") {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ["online-payments"] }),
                    queryClient.invalidateQueries({ queryKey: ["payments"] }),
                    queryClient.invalidateQueries({ queryKey: ["invoices"] }),
                    queryClient.invalidateQueries({ queryKey: ["student-balances"] }),
                ]);
            }
            return payment;
        },
        enabled: enabled && !!reference,
        refetchInterval: (query) => query.state.data?.status === "pending" ? 8000 : false,
    });
};

export interface BankDeposit {
    id: number;
    bank_txn_id: string;
    amount: string;
    currency: FinanceCurrency;
    value_date: string;
    reference: string;
    payer_name: string;
    source: "webhook" | "csv";
    status: "matched" | "unmatched" | "ignored";
    note: string;
    invoice: number | null;
    invoice_no: string;
    student_name: string;
    receipt_no: string;
    created_at: string;
}

export interface BankImportSummary {
    created: number;
    duplicates: number;
    matched: number;
    needs_review: number;
    skipped: number;
    errors: string[];
}

export const invalidateMoney = (queryClient: ReturnType<typeof useQueryClient>) => {
    for (const key of ["bank-deposits", "online-payments", "payments", "invoices", "student-balances"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
    }
};

export const useBankDeposits = (status?: BankDeposit["status"]) => useQuery({
    queryKey: ["bank-deposits", status ?? "all"],
    queryFn: async () => extractArray<BankDeposit>(await api.get<unknown>("/finance/bank-deposits/", status ? { status } : undefined)),
    refetchInterval: 20000,
});

export const useImportBankStatement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ file, currency }: { file: File; currency: FinanceCurrency }) => {
            const form = new FormData();
            form.append("file", file);
            form.append("currency", currency);
            return api.postForm<BankImportSummary>("/finance/bank-deposits/import/", form);
        },
        onSuccess: () => invalidateMoney(queryClient),
    });
};

export const useAssignBankDeposit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, invoice }: { id: number; invoice: number }) =>
            api.post<BankDeposit>(`/finance/bank-deposits/${id}/assign/`, { invoice }),
        onSuccess: () => invalidateMoney(queryClient),
    });
};

export const useIgnoreBankDeposit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => api.post<BankDeposit>(`/finance/bank-deposits/${id}/ignore/`),
        onSuccess: () => invalidateMoney(queryClient),
    });
};

export interface Notice {
    id: number;
    title: string;
    content: string;
    author: string;
    date: string;
    audience: string;
    priority: string;
    pinned: boolean;
    recipient_type: "all_students" | "all_parents" | "staff" | "class" | "individual";
    recipient_class: number | null;
    recipient_class_name?: string;
    recipient_student: number | null;
    recipient_student_name?: string;
    created_by: number | null;
    status: "pending" | "approved" | "rejected";
    approved_by: number | null;
    approved_at: string | null;
    review_note: string;
    views: number;
}

export const useNotices = () => useQuery({
    queryKey: ["notices"],
    queryFn: () => fetchAllPages<Notice>("/notices/notices/"),
    refetchInterval: 15000,
});

export interface LearningMaterial {
    id: number;
    title: string;
    subject_name: string;
    class_name: string;
    file_url: string;
    file_name?: string;
    file_type: string;
    uploaded_by: string;
    uploaded_by_user: number | null;
    visibility: "class" | "staff";
    created_at: string;
}

export interface LearningMaterialInput {
    title: string;
    subject_name: string;
    class_name: string;
    uploaded_by?: string;
    visibility?: "class" | "staff";
    file?: File;
}

export function toLearningMaterialFormData(data: LearningMaterialInput): FormData {
    const form = new FormData();
    form.append("title", data.title);
    form.append("subject_name", data.subject_name);
    form.append("class_name", data.class_name);
    if (data.uploaded_by) form.append("uploaded_by", data.uploaded_by);
    if (data.visibility) form.append("visibility", data.visibility);
    if (data.file) form.append("file", data.file);
    return form;
}

export const useLearningMaterials = (params?: { subject_name?: string; class_name?: string; visibility?: "class" | "staff" }) => useQuery({
    queryKey: ["learning-materials", params],
    queryFn: async () => extractArray<LearningMaterial>(await api.get<unknown>("/content/materials/", toQueryParams(params))),
    refetchInterval: 15000,
});

export const useCreateLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: LearningMaterialInput) => api.postForm<LearningMaterial>("/content/materials/", toLearningMaterialFormData(data)),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export const useDeleteLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => { await api.delete(`/content/materials/${id}/`); },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export const useUpdateLearningMaterial = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: LearningMaterialInput }) => {
            return await api.patchForm<LearningMaterial>(`/content/materials/${id}/`, toLearningMaterialFormData(data));
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learning-materials"] }),
    });
};

export interface LearningAssignment {
    id: number;
    title: string;
    instructions: string;
    school_class: number;
    class_name: string;
    subject: number;
    subject_name: string;
    teacher: number;
    teacher_name: string;
    due_at: string | null;
    attachment_url: string;
    attachment_name: string;
    is_published: boolean;
    submission_count: number;
    created_at: string;
    updated_at: string;
}

export interface LearningAssignmentInput {
    title: string;
    instructions: string;
    school_class: number;
    subject: number;
    due_at?: string;
    attachment?: File;
    is_published?: boolean;
    teacher?: number;
}

export interface LearningSubmission {
    id: number;
    assignment: number;
    assignment_title: string;
    class_name: string;
    subject_name: string;
    student: number;
    student_name: string;
    answer: string;
    attachment_url: string;
    attachment_name: string;
    submitted_at: string;
    teacher_feedback: string;
    score: string | null;
    reviewed_at: string | null;
}

export interface LearningSubmissionInput {
    assignment: number;
    answer: string;
    attachment?: File;
}

export interface LearningSubmissionReviewInput {
    teacher_feedback: string;
    score?: number | null;
}

export function toLearningAssignmentFormData(data: LearningAssignmentInput): FormData {
    const form = new FormData();
    form.append("title", data.title);
    form.append("instructions", data.instructions);
    form.append("school_class", String(data.school_class));
    form.append("subject", String(data.subject));
    if (data.due_at) form.append("due_at", data.due_at);
    if (data.attachment) form.append("attachment", data.attachment);
    if (data.is_published !== undefined) form.append("is_published", String(data.is_published));
    if (data.teacher !== undefined) form.append("teacher", String(data.teacher));
    return form;
}

export function toLearningSubmissionFormData(data: LearningSubmissionInput): FormData {
    const form = new FormData();
    form.append("assignment", String(data.assignment));
    form.append("answer", data.answer);
    if (data.attachment) form.append("attachment", data.attachment);
    return form;
}

export const useLearningAssignments = () => useQuery({
    queryKey: ["learning-assignments"],
    queryFn: () => fetchAllPages<LearningAssignment>("/content/assignments/"),
    refetchInterval: 15000,
});

export const useCreateLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: LearningAssignmentInput) => api.postForm<LearningAssignment>(
            "/content/assignments/", toLearningAssignmentFormData(data),
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-materials"] });
        },
    });
};

export const useUpdateLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: LearningAssignmentInput }) => api.patchForm<LearningAssignment>(
            `/content/assignments/${id}/`, toLearningAssignmentFormData(data),
        ),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] }),
    });
};

export const useDeleteLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => { await api.delete(`/content/assignments/${id}/`); },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-submissions"] });
        },
    });
};

export const useLearningSubmissions = (assignment?: number) => useQuery({
    queryKey: ["learning-submissions", assignment],
    queryFn: () => fetchAllPages<LearningSubmission>(
        "/content/submissions/", assignment ? { assignment: String(assignment) } : undefined,
    ),
    refetchInterval: 15000,
});

export const useSubmitLearningAssignment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id?: number; data: LearningSubmissionInput }) => id
            ? api.patchForm<LearningSubmission>(`/content/submissions/${id}/`, toLearningSubmissionFormData(data))
            : api.postForm<LearningSubmission>("/content/submissions/", toLearningSubmissionFormData(data)),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-submissions"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
        },
    });
};

export const useReviewLearningSubmission = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: LearningSubmissionReviewInput }) =>
            api.post<LearningSubmission>(`/content/submissions/${id}/review/`, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["learning-submissions"] });
            void queryClient.invalidateQueries({ queryKey: ["learning-assignments"] });
            void queryClient.invalidateQueries({ queryKey: ["grades"] });
        },
    });
};
