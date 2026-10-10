import { api } from '@/lib/api';

export interface Attendance {
  id: number;
  student: number;
  date: string;
  status: string;
  student_name?: string;
  class_name?: string;
}

export const attendanceService = {
  async getAll() {
    return api.get<Attendance[]>('/attendance/attendance/');
  },

  async getById(id: number) {
    return api.get<Attendance>(`/attendance/attendance/${id}/`);
  },

  async create(data: Partial<Attendance>) {
    return api.post<Attendance>('/attendance/attendance/', data);
  },

  async update(id: number, data: Partial<Attendance>) {
    return api.patch<Attendance>(`/attendance/attendance/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/attendance/attendance/${id}/`);
  },

  async bulkCreate(records: Partial<Attendance>[]) {
    return api.post<Attendance[]>('/attendance/attendance/bulk/', records);
  },
};
