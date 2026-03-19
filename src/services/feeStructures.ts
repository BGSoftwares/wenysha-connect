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

// Mock data for offline mode
const mockFeeStructures: FeeStructure[] = [
  { id: 1, name: "Tuition Fee", amount: "500.00", term: "Term 1", form: "Form 1", category: "Academic", boarding_type: "Day Scholar", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, name: "Tuition Fee", amount: "500.00", term: "Term 1", form: "Form 2", category: "Academic", boarding_type: "Day Scholar", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, name: "Boarding Fee", amount: "800.00", term: "Term 1", form: "All Forms", category: "Accommodation", boarding_type: "Boarding", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, name: "Sports Levy", amount: "50.00", term: "Term 1", form: "All Forms", category: "Extra-curricular", boarding_type: "All", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, name: "ICT Levy", amount: "75.00", term: "Term 1", form: "All Forms", category: "Academic", boarding_type: "All", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 6, name: "Exam Fee", amount: "100.00", term: "Term 2", form: "Form 4", category: "Academic", boarding_type: "All", active: true, created_at: "2024-01-01", updated_at: "2024-01-01" },
];

export const feeStructuresService = {
  async getAll(useMockOnOffline = true) {
    const result = await api.get<FeeStructure[]>('/api/fee-structures/');
    if (result.isOffline && useMockOnOffline) {
      return { data: mockFeeStructures, status: 200, isOffline: true };
    }
    return result;
  },

  async getById(id: number) {
    const result = await api.get<FeeStructure>(`/api/fee-structures/${id}/`);
    if (result.isOffline) {
      const mock = mockFeeStructures.find(f => f.id === id);
      if (mock) return { data: mock, status: 200, isOffline: true };
    }
    return result;
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

  getMockData() {
    return mockFeeStructures;
  },
};
