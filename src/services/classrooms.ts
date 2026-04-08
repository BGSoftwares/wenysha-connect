import { api } from '@/lib/api';

export interface ClassRoom {
  id: number;
  name: string;
  capacity: number;
  class_teacher?: number;
  created_at: string;
  updated_at: string;
}

export const classroomsService = {
  async getAll() {
    return api.get<ClassRoom[]>('/school/classes/');
  },
  async getById(id: number) {
    return api.get<ClassRoom>(`/school/classes/${id}/`);
  },
  async create(data: Partial<ClassRoom>) {
    return api.post<ClassRoom>('/school/classes/', data);
  },
  async update(id: number, data: Partial<ClassRoom>) {
    return api.patch<ClassRoom>(`/school/classes/${id}/`, data);
  },
  async delete(id: number) {
    return api.delete(`/school/classes/${id}/`);
  },
};
