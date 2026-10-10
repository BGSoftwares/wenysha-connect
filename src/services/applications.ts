import { api } from '@/lib/api';

export interface Application {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  previous_school: string;
  result_slip?: string | null;
  guardian_name: string;
  guardian_phone: string;
  created_at: string;
}

export const applicationsService = {
  async getAll() {
    return api.get<Application[]>('/admissions/admissions/');
  },

  async getById(id: number) {
    return api.get<Application>(`/admissions/admissions/${id}/`);
  },

  async create(data: Partial<Application>) {
    return api.post<Application>('/admissions/admissions/', data);
  },

  async update(id: number, data: Partial<Application>) {
    return api.patch<Application>(`/admissions/admissions/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/admissions/admissions/${id}/`);
  },
};
