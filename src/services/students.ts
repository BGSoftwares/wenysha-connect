import { api } from '@/lib/api';

export const studentsService = {
  async getAll() {
    return api.get<any[]>('/school/students/');
  },
  async getById(id: number) {
    return api.get<any>(`/school/students/${id}/`);
  },
  async create(data: Partial<any>) {
    return api.post<any>('/school/students/', data);
  },
  async update(id: number, data: Partial<any>) {
    return api.patch<any>(`/school/students/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/school/students/${id}/`);
  },
};

export interface Student {
  id: number;
  student_id: string;
  name: string;
  school_class: number;
  class_name?: string;
  gender?: string;
  status?: string;
  date_of_birth?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}
