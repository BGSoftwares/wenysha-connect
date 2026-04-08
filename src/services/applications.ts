import { api } from '@/lib/api';

export interface Application {
  id: number;
  application_reference: string;
  applicant_first_name: string;
  applicant_last_name: string;
  grade_applied?: string;
  submitted_at: string;
  status: string;
  documents?: Record<string, unknown>;
  notes?: string;
}

export const applicationsService = {
  async getAll() {
    return api.get<Application[]>('/admissions/applications/');
  },

  async getById(id: number) {
    return api.get<Application>(`/admissions/applications/${id}/`);
  },

  async create(data: Partial<Application>) {
    return api.post<Application>('/admissions/applications/', data);
  },

  async update(id: number, data: Partial<Application>) {
    return api.patch<Application>(`/admissions/applications/${id}/`, data);
  },

  async delete(id: number) {
    return api.delete(`/admissions/applications/${id}/`);
  },

  async approve(id: number) {
    return api.post(`/admissions/applications/${id}/approve/`, {});
  },

  async reject(id: number, reason?: string) {
    return api.post(`/admissions/applications/${id}/reject/`, { reason });
  },
};
