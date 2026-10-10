import { api } from '@/lib/api';

export interface Invoice {
  id: number;
  invoice_no: string;
  student: number;
  student_name: string;
  class_name: string;
  term: string;
  amount: string;
  paid: string;
  status: "paid" | "partial" | "unpaid";
  date: string;
}

export const invoicesService = {
  async getAll() {
    return api.get<Invoice[]>('/finance/invoices/');
  },
  async getById(id: number) {
    return api.get<Invoice>(`/finance/invoices/${id}/`);
  },
  async create(data: Partial<Invoice>) {
    return api.post<Invoice>('/finance/invoices/', data);
  },
  async update(id: number, data: Partial<Invoice>) {
    return api.patch<Invoice>(`/finance/invoices/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/finance/invoices/${id}/`);
  },
};
