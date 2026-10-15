import { api } from '@/lib/api';

export interface Payment {
  id: number;
  receipt_no: string;
  invoice: number;
  amount: string;
  method: string;
  reference?: string;
  date: string;
  student_name?: string;
  invoice_no?: string;
}

export const paymentsService = {
  async getAll(): Promise<Payment[]> {
    const res = await api.get<Payment[] | { results?: Payment[] }>('/finance/payments/');
    return Array.isArray(res) ? res : (res?.results ?? []);
  },
  async getById(id: number) {
    return api.get<Payment>(`/finance/payments/${id}/`);
  },
  async create(data: Partial<Payment>) {
    return api.post<Payment>('/finance/payments/', data);
  },
  async update(id: number, data: Partial<Payment>) {
    return api.patch<Payment>(`/finance/payments/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/finance/payments/${id}/`);
  },
};
