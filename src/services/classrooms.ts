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
    return api.get<ClassRoom[]>('/api/classrooms/');
  },
  async getById(id: number) {
    return api.get<ClassRoom>(`/api/classrooms/${id}/`);
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
};
