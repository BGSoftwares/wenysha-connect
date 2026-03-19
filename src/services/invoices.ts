import { api } from '@/lib/api';

export interface Invoice {
  id: number;
  invoice_number: string;
  student: number;
  issued_at: string;
  due_date?: string;
  total_amount: string;
  status: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Mock data for offline mode
const mockInvoices: Invoice[] = [
  { id: 1, invoice_number: "INV-2024-001", student: 1, issued_at: "2024-01-15", due_date: "2024-02-15", total_amount: "1200.00", status: "issued", created_at: "2024-01-15", updated_at: "2024-01-15" },
  { id: 2, invoice_number: "INV-2024-002", student: 2, issued_at: "2024-01-15", due_date: "2024-02-15", total_amount: "1200.00", status: "paid", created_at: "2024-01-15", updated_at: "2024-01-20" },
  { id: 3, invoice_number: "INV-2024-003", student: 3, issued_at: "2024-01-15", due_date: "2024-02-15", total_amount: "1500.00", status: "partial", created_at: "2024-01-15", updated_at: "2024-01-18" },
  { id: 4, invoice_number: "INV-2024-004", student: 4, issued_at: "2024-01-15", due_date: "2024-02-15", total_amount: "1200.00", status: "overdue", created_at: "2024-01-15", updated_at: "2024-01-15" },
];

export const invoicesService = {
  async getAll(useMockOnOffline = true) {
    const result = await api.get<Invoice[]>('/api/invoices/');
    if (result.isOffline && useMockOnOffline) {
      return { data: mockInvoices, status: 200, isOffline: true };
    }
    return result;
  },

  async getById(id: number) {
    const result = await api.get<Invoice>(`/api/invoices/${id}/`);
    if (result.isOffline) {
      const mock = mockInvoices.find(i => i.id === id);
      if (mock) return { data: mock, status: 200, isOffline: true };
    }
    return result;
  },

  async create(data: Partial<Invoice>) {
    return api.post<Invoice>('/api/invoices/', data);
  },

  async update(id: number, data: Partial<Invoice>) {
    return api.patch<Invoice>(`/api/invoices/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/api/invoices/${id}/`);
  },

  getMockData() {
    return mockInvoices;
  },
};
