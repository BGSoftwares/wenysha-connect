import { api } from '@/lib/api';

export interface FeeStructure {
  id: number;
  name: string;
  amount: string;
  term?: string;
  form?: string;
  category?: string;
  boarding_type?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const feeStructuresService = {
  async getAll() {
    return api.get<FeeStructure[]>('/api/fee-structures/');
  },
  async getById(id: number) {
    return api.get<FeeStructure>(`/api/fee-structures/${id}/`);
  },
  async create(data: Partial<FeeStructure>) {
    return api.post<FeeStructure>('/api/fee-structures/', data);
  },
  async update(id: number, data: Partial<FeeStructure>) {
    return api.patch<FeeStructure>(`/api/fee-structures/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/api/fee-structures/${id}/`);
  },
};
