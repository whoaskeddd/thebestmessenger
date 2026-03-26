import type {
  Announcement,
  AnnouncementCreatePayload,
  Department,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
  Employee,
  EmployeeCreatePayload,
  EmployeeProvisionPayload,
  EmployeeUpdatePayload,
  HrTask,
  HrTaskCreatePayload,
  LeaveRequest,
  LeaveRequestEvent,
  LeaveRequestsQuery,
  LeaveRequestType,
  MeResponse,
  MyTaskResponse,
} from '../types/api';
import { authApi } from './auth';

export const modulesApi = {
  async getHealth(): Promise<Record<string, string>> {
    return authApi.request<Record<string, string>>('/health', { skipAuth: true });
  },

  async getIndex(): Promise<Record<string, string>> {
    return authApi.request<Record<string, string>>('/', { skipAuth: true });
  },

  async getDepartments(params?: { search?: string; limit?: number; offset?: number }): Promise<Department[]> {
    const query = new URLSearchParams({
      limit: String(params?.limit ?? 50),
      offset: String(params?.offset ?? 0),
    });
    if (params?.search?.trim()) query.set('search', params.search.trim());
    const data = await authApi.request<Department[]>(`/departments?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  async createDepartment(payload: DepartmentCreatePayload): Promise<Department> {
    return authApi.request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getDepartment(departmentId: string): Promise<Department> {
    return authApi.request<Department>(`/departments/${departmentId}`);
  },

  async updateDepartment(departmentId: string, payload: DepartmentUpdatePayload): Promise<Department> {
    return authApi.request<Department>(`/departments/${departmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteDepartment(departmentId: string): Promise<void> {
    await authApi.request<void>(`/departments/${departmentId}`, { method: 'DELETE' });
  },

  async getEmployees(search?: string): Promise<Employee[]> {
    const query = new URLSearchParams({ limit: '50', offset: '0' });
    if (search?.trim()) query.set('search', search.trim());
    const data = await authApi.request<Employee[]>(`/employees?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  async createEmployee(payload: EmployeeCreatePayload): Promise<Employee> {
    return authApi.request<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getEmployee(employeeId: string): Promise<Employee> {
    return authApi.request<Employee>(`/employees/${employeeId}`);
  },

  async updateEmployee(employeeId: string, payload: EmployeeUpdatePayload): Promise<Employee> {
    return authApi.request<Employee>(`/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteEmployee(employeeId: string): Promise<void> {
    await authApi.request<void>(`/employees/${employeeId}`, { method: 'DELETE' });
  },

  async provisionEmployeeAccount(payload: EmployeeProvisionPayload): Promise<Employee> {
    const tokenPair = await authApi.register(payload.email, payload.password);
    const me = await authApi.request<MeResponse>('/auth/me', {
      skipAuth: true,
      headers: {
        Authorization: `Bearer ${tokenPair.access_token}`,
      },
    });

    return this.createEmployee({
      user_id: me.id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      middle_name: payload.middle_name ?? null,
      work_email: payload.work_email ?? payload.email,
      phone: payload.phone ?? null,
      position: payload.position ?? null,
      department_ids: payload.department_ids ?? [],
    });
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

  async getLeaveRequests(params?: LeaveRequestsQuery): Promise<LeaveRequest[]> {
    const query = new URLSearchParams({
      limit: String(params?.limit ?? 50),
      offset: String(params?.offset ?? 0),
    });
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const data = await authApi.request<LeaveRequest[]>(`/leave-requests?${query.toString()}`);
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

  async getLeaveRequest(requestId: string): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>(`/leave-requests/${requestId}`);
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

  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>(`/leave-requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },
};
