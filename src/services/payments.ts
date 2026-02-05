import api from '@/lib/api';

export interface Payment {
  id: number;
  invoice: number;
  paid_at: string;
  amount: string;
  method?: string;
  reference?: string;
}

export const paymentsService = {
  async getAll() {
    return api.get<Payment[]>('/api/payments/');
  },

  async getById(id: number) {
    return api.get<Payment>(`/api/payments/${id}/`);
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
};
