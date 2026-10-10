import { api } from '@/lib/api';

export interface Student {
  id: number;
  user?: number;
  student_id: string;
  name: string;
  school_class: number;
  class_name?: string;
  gender: string;
  status: "Active" | "Inactive";
  date_of_birth?: string | null;
  address?: string;
}

export const studentsService = {
  async getAll() {
    return api.get<Student[]>('/school/students/');
  },
  async getById(id: number) {
    return api.get<Student>(`/school/students/${id}/`);
  },
  async create(data: Partial<Student>) {
    return api.post<Student>('/school/students/', data);
  },
  async update(id: number, data: Partial<Student>) {
    return api.patch<Student>(`/school/students/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/school/students/${id}/`);
  },
};
