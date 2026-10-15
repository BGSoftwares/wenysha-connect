import { api } from '@/lib/api';

export interface FeeStructure {
  id: number;
  name: string;
  amount: string;
  term: string;
  form: string;
  category: string;
  boarding_type: string;
  active: boolean;
}

export const feeStructuresService = {
  async getAll(): Promise<FeeStructure[]> {
    const res = await api.get<FeeStructure[] | { results?: FeeStructure[] }>('/finance/fee-structures/');
    return Array.isArray(res) ? res : (res?.results ?? []);
  },
  async getById(id: number) {
    return api.get<FeeStructure>(`/finance/fee-structures/${id}/`);
  },
  async create(data: Partial<FeeStructure>) {
    return api.post<FeeStructure>('/finance/fee-structures/', data);
  },
  async update(id: number, data: Partial<FeeStructure>) {
    return api.patch<FeeStructure>(`/finance/fee-structures/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/finance/fee-structures/${id}/`);
  },
};
