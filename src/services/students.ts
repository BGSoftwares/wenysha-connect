import { api } from '@/lib/api';

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  dob?: string;
  gender: string;
  classroom?: number;
  status: string;
  parent?: number;
  admission_date?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for offline mode
const mockStudents: Student[] = [
  { id: 1, first_name: "John", last_name: "Mutasa", gender: "Male", status: "Active", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, first_name: "Sarah", last_name: "Moyo", gender: "Female", status: "Active", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, first_name: "Peter", last_name: "Ncube", gender: "Male", status: "Active", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, first_name: "Grace", last_name: "Dube", gender: "Female", status: "Active", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, first_name: "David", last_name: "Chuma", gender: "Male", status: "Active", created_at: "2024-01-01", updated_at: "2024-01-01" },
];

export const studentsService = {
  async getAll(useMockOnOffline = true) {
    const result = await api.get<Student[]>('/api/students/');
    if (result.isOffline && useMockOnOffline) {
      return { data: mockStudents, status: 200, isOffline: true };
    }
    return result;
  },

  async getById(id: number) {
    const result = await api.get<Student>(`/api/students/${id}/`);
    if (result.isOffline) {
      const mock = mockStudents.find(s => s.id === id);
      if (mock) return { data: mock, status: 200, isOffline: true };
    }
    return result;
  },

  async create(data: Partial<Student>) {
    return api.post<Student>('/api/students/', data);
  },

  async update(id: number, data: Partial<Student>) {
    return api.patch<Student>(`/api/students/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/api/students/${id}/`);
  },

  getMockData() {
    return mockStudents;
  },
};
