import type { Announcement, Employee, HrTask } from '../types/api';
import { authApi } from './auth';

export const modulesApi = {
  async getEmployees(): Promise<Employee[]> {
    const data = await authApi.request<Employee[]>('/employees?limit=20&offset=0');
    return Array.isArray(data) ? data : [];
  },

  async getAnnouncements(): Promise<Announcement[]> {
    const data = await authApi.request<Announcement[]>('/announcements');
    return Array.isArray(data) ? data : [];
  },

  async getMyTasks(): Promise<HrTask[]> {
    const data = await authApi.request<HrTask[]>('/hr-tasks/my?include_completed=false');
    return Array.isArray(data) ? data : [];
  },
};
