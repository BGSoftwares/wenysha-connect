import { api } from '../lib/api';
import type { Student as StudentType } from '../lib/hooks';

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

export type Student = StudentType;
