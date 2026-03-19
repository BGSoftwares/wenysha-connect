import { api } from '@/lib/api';

export interface Attendance {
  id: number;
  student: number;
  classroom?: number;
  date: string;
  status: string;
  notes?: string;
}

export const attendanceService = {
  async getAll() {
    return api.get<Attendance[]>('/api/attendance/');
  },

  async getById(id: number) {
    return api.get<Attendance>(`/api/attendance/${id}/`);
  },

  async create(data: Partial<Attendance>) {
    return api.post<Attendance>('/api/attendance/', data);
  },

  async update(id: number, data: Partial<Attendance>) {
    return api.patch<Attendance>(`/api/attendance/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/api/attendance/${id}/`);
  },

  async bulkCreate(records: Partial<Attendance>[]) {
    return api.post<Attendance[]>('/api/attendance/bulk/', records);
  },
};
