import type {
  Announcement,
  AnnouncementCreatePayload,
  Employee,
  HrTask,
  HrTaskCreatePayload,
  LeaveRequest,
  LeaveRequestEvent,
  LeaveRequestType,
  MyTaskResponse,
} from '../types/api';
import { authApi } from './auth';

export const modulesApi = {
  async getEmployees(search?: string): Promise<Employee[]> {
    const query = new URLSearchParams({ limit: '50', offset: '0' });
    if (search?.trim()) query.set('search', search.trim());
    const data = await authApi.request<Employee[]>(`/employees?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  async getEmployee(employeeId: string): Promise<Employee> {
    return authApi.request<Employee>(`/employees/${employeeId}`);
  },

  async getAnnouncements(): Promise<Announcement[]> {
    const data = await authApi.request<Announcement[]>('/announcements?limit=50&offset=0');
    return Array.isArray(data) ? data : [];
  },

  async createAnnouncement(payload: AnnouncementCreatePayload): Promise<Announcement> {
    return authApi.request<Announcement>('/announcements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getAnnouncement(announcementId: string): Promise<Announcement> {
    return authApi.request<Announcement>(`/announcements/${announcementId}`);
  },

  async markAnnouncementRead(announcementId: string): Promise<void> {
    await authApi.request<void>(`/announcements/${announcementId}/read`, { method: 'POST' });
  },

  async getMyTasks(): Promise<HrTask[]> {
    const data = await authApi.request<MyTaskResponse[]>('/hr-tasks/my?include_completed=false&limit=50&offset=0');
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      ...item.task,
      completed_at: item.completed_at ?? null,
    }));
  },

  async getAllTasks(): Promise<HrTask[]> {
    const data = await authApi.request<HrTask[]>('/hr-tasks?limit=50&offset=0');
    return Array.isArray(data) ? data : [];
  },

  async createTask(payload: HrTaskCreatePayload): Promise<HrTask> {
    return authApi.request<HrTask>('/hr-tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async completeTask(taskId: string): Promise<void> {
    await authApi.request<void>(`/hr-tasks/${taskId}/complete`, { method: 'POST' });
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    const data = await authApi.request<LeaveRequest[]>('/leave-requests?limit=50&offset=0');
    return Array.isArray(data) ? data : [];
  },

  async createLeaveRequest(payload: {
    request_type: LeaveRequestType;
    start_date: string;
    end_date: string;
    reason?: string | null;
  }): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>('/leave-requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getLeaveRequestHistory(requestId: string): Promise<LeaveRequestEvent[]> {
    const data = await authApi.request<LeaveRequestEvent[]>(`/leave-requests/${requestId}/history`);
    return Array.isArray(data) ? data : [];
  },

  async approveLeaveRequest(requestId: string, hrComment?: string | null): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>(`/leave-requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ hr_comment: hrComment ?? null }),
    });
  },

  async rejectLeaveRequest(requestId: string, hrComment: string): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>(`/leave-requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ hr_comment: hrComment }),
    });
  },
};
