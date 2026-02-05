import api from '@/lib/api';

export interface Payment {
  id: number;
  invoice: number;
  paid_at: string;
  amount: string;
  method?: string;
  reference?: string;
}

// Mock data for offline mode
const mockPayments: Payment[] = [
  { id: 1, invoice: 1, paid_at: "2024-01-25T10:30:00Z", amount: "450.00", method: "Cash", reference: "REC-001" },
  { id: 2, invoice: 2, paid_at: "2024-01-22T09:15:00Z", amount: "1200.00", method: "Bank Transfer", reference: "TRF-002" },
  { id: 3, invoice: 3, paid_at: "2024-01-20T14:00:00Z", amount: "600.00", method: "Mobile Money", reference: "MM-003" },
  { id: 4, invoice: 1, paid_at: "2024-01-28T11:00:00Z", amount: "750.00", method: "Cash", reference: "REC-004" },
];

export const paymentsService = {
  async getAll(useMockOnOffline = true) {
    const result = await api.get<Payment[]>('/api/payments/');
    if (result.isOffline && useMockOnOffline) {
      return { data: mockPayments, status: 200, isOffline: true };
    }
    return result;
  },

  async getById(id: number) {
    const result = await api.get<Payment>(`/api/payments/${id}/`);
    if (result.isOffline) {
      const mock = mockPayments.find(p => p.id === id);
      if (mock) return { data: mock, status: 200, isOffline: true };
    }
    return result;
  },

  async create(data: Partial<Payment>) {
    return api.post<Payment>('/api/payments/', data);
  },

  async update(id: number, data: Partial<Payment>) {
    return api.patch<Payment>(`/api/payments/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/api/payments/${id}/`);
  },

  getMockData() {
    return mockPayments;
  },
};
