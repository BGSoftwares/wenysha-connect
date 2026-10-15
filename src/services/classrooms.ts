import { api } from '@/lib/api';

export interface ClassRoom {
  id: number;
  name: string;
  capacity: number;
  enrolled: number;
  class_teacher: number | null;
  class_teacher_name?: string;
}

export const classroomsService = {
  async getAll(): Promise<ClassRoom[]> {
    const res = await api.get<ClassRoom[] | { results?: ClassRoom[] }>('/school/classes/');
    return Array.isArray(res) ? res : (res?.results ?? []);
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
