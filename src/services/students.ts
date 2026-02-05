import api from '@/lib/api';

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

export const studentsService = {
  async getAll() {
    return api.get<Student[]>('/api/students/');
  },

  async getById(id: number) {
    return api.get<Student>(`/api/students/${id}/`);
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
};
