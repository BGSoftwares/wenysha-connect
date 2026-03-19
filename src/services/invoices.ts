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

export const invoicesService = {
  async getAll() {
    return api.get<Invoice[]>('/api/invoices/');
  },
  async getById(id: number) {
    return api.get<Invoice>(`/api/invoices/${id}/`);
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
};
