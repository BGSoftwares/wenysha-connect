import { api } from '@/lib/api';

export interface ClassRoom {
  id: number;
  name: string;
  teacher_name?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for offline mode
const mockClassrooms: ClassRoom[] = [
  { id: 1, name: "Form 1A", teacher_name: "Mrs. Chikwanda", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 2, name: "Form 1B", teacher_name: "Mr. Mutasa", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 3, name: "Form 2A", teacher_name: "Mrs. Manyika", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 4, name: "Form 2B", teacher_name: "Mr. Mukucha", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 5, name: "Form 3A", teacher_name: "Ms. Ncube", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 6, name: "Form 3B", teacher_name: "Mr. Zimuto", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 7, name: "Form 4A", teacher_name: "Mrs. Hwata", created_at: "2024-01-01", updated_at: "2024-01-01" },
  { id: 8, name: "Form 4B", teacher_name: "Mr. Moyo", created_at: "2024-01-01", updated_at: "2024-01-01" },
];

export const classroomsService = {
  async getAll(useMockOnOffline = true) {
    const result = await api.get<ClassRoom[]>('/api/classrooms/');
    if (result.isOffline && useMockOnOffline) {
      return { data: mockClassrooms, status: 200, isOffline: true };
    }
    return result;
  },

  async getById(id: number) {
    const result = await api.get<ClassRoom>(`/api/classrooms/${id}/`);
    if (result.isOffline) {
      const mock = mockClassrooms.find(c => c.id === id);
      if (mock) return { data: mock, status: 200, isOffline: true };
    }
    return result;
  },

  async create(data: Partial<ClassRoom>) {
    return api.post<ClassRoom>('/api/classrooms/', data);
  },

  async update(id: number, data: Partial<ClassRoom>) {
    return api.patch<ClassRoom>(`/api/classrooms/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/api/classrooms/${id}/`);
  },

  getMockData() {
    return mockClassrooms;
  },
};
