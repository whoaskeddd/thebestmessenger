import type {
  Announcement,
  Chat,
  ChatMessage,
  AnnouncementCreatePayload,
  AdminCreateUserPayload,
  AdminCreatedUser,
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
import { Platform } from 'react-native';
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
    const query = new URLSearchParams({ limit: '200', offset: '0' });
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

  async getMyEmployee(): Promise<Employee> {
    return authApi.request<Employee>('/employees/me');
  },

  async updateEmployee(employeeId: string, payload: EmployeeUpdatePayload): Promise<Employee> {
    return authApi.request<Employee>(`/employees/${employeeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async updateMyEmployee(
    payload: Pick<EmployeeUpdatePayload, 'first_name' | 'last_name' | 'middle_name' | 'phone' | 'position'>,
  ): Promise<Employee> {
    return authApi.request<Employee>('/employees/me', {
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
      hire_date: payload.hire_date ?? null,
      department_ids: payload.department_ids ?? [],
    });
  },

  async createUserByAdmin(payload: AdminCreateUserPayload): Promise<AdminCreatedUser> {
    return authApi.request<AdminCreatedUser>('/auth/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
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

  async getUnreadLeaveRequestsCount(): Promise<number> {
    const data = await authApi.request<{ count?: number }>('/leave-requests/unread-count');
    return typeof data?.count === 'number' ? data.count : 0;
  },

  async markLeaveRequestsRead(): Promise<number> {
    const data = await authApi.request<{ count?: number }>('/leave-requests/mark-read', { method: 'POST' });
    return typeof data?.count === 'number' ? data.count : 0;
  },

  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    return authApi.request<LeaveRequest>(`/leave-requests/${requestId}/cancel`, {
      method: 'POST',
    });
  },

  async getNewMyTasksCount(): Promise<number> {
    const data = await authApi.request<{ count?: number }>('/hr-tasks/my/new-count');
    return typeof data?.count === 'number' ? data.count : 0;
  },

  async markMyTasksSeen(): Promise<number> {
    const data = await authApi.request<{ count?: number }>('/hr-tasks/my/mark-seen', { method: 'POST' });
    return typeof data?.count === 'number' ? data.count : 0;
  },

  async changeMyPassword(payload: { current_password: string; new_password: string }): Promise<void> {
    await authApi.request<void>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getChats(params?: { limit?: number; offset?: number }): Promise<Chat[]> {
    const query = new URLSearchParams({
      limit: String(params?.limit ?? 200),
      offset: String(params?.offset ?? 0),
    });
    const data = await authApi.request<Chat[]>(`/chats?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  async getChat(chatId: string): Promise<Chat> {
    return authApi.request<Chat>(`/chats/${chatId}`);
  },

  async createDirectChat(otherUserId: string): Promise<Chat> {
    return authApi.request<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({
        chatType: 'direct',
        otherUserId,
      }),
    });
  },

  async getChatMessages(chatId: string, params?: { limit?: number; before?: string }): Promise<ChatMessage[]> {
    const query = new URLSearchParams({
      limit: String(params?.limit ?? 100),
    });
    if (params?.before) query.set('before', params.before);
    const data = await authApi.request<ChatMessage[]>(`/chats/${chatId}/messages?${query.toString()}`);
    return Array.isArray(data) ? data : [];
  },

  async sendChatMessage(chatId: string, body: string): Promise<ChatMessage> {
    return authApi.request<ChatMessage>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    });
  },

  async sendVoiceMessage(
    chatId: string,
    payload: { uri: string; durationSeconds?: number; mimeType?: string; fileName?: string },
  ): Promise<ChatMessage> {
    const form = new FormData();
    const fileName = payload.fileName ?? 'voice-message.m4a';
    const mimeType = payload.mimeType ?? 'audio/m4a';

    if (Platform.OS === 'web') {
      const response = await fetch(payload.uri);
      const blob = await response.blob();
      form.append('file', new File([blob], fileName, { type: blob.type || mimeType }));
    } else {
      form.append('file', {
        uri: payload.uri,
        name: fileName,
        type: mimeType,
      } as any);
    }

    if (typeof payload.durationSeconds === 'number') {
      form.append('duration_seconds', String(payload.durationSeconds));
    }

    return authApi.request<ChatMessage>(`/chats/${chatId}/voice`, {
      method: 'POST',
      body: form,
    });
  },

  async markChatRead(chatId: string): Promise<void> {
    await authApi.request(`/chats/${chatId}/read`, { method: 'POST' });
  },
};
