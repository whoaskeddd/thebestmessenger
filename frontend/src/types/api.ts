export type UserRole = 'admin' | 'hr' | 'employee';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer' | string;
};

export type MeResponse = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthErrorResponse = {
  detail?: string;
};

export type Employee = {
  id: string;
  user_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  position?: string | null;
  hire_date?: string | null;
  work_email?: string | null;
  phone?: string | null;
  is_active?: boolean;
  departments?: Department[];
};

export type Announcement = {
  id: string;
  created_by_user_id?: string;
  title: string;
  body: string;
  is_global?: boolean;
  created_at?: string;
};

export type AnnouncementCreatePayload = {
  title: string;
  body: string;
  is_global: boolean;
  department_ids?: string[];
};

export type HrTask = {
  id: string;
  created_by_user_id?: string;
  announcement_id?: string | null;
  title: string;
  description?: string | null;
  due_date?: string | null;
  created_at?: string;
  completed_at?: string | null;
};

export type Department = {
  id: string;
  name: string;
};

export type DepartmentCreatePayload = {
  name: string;
};

export type DepartmentUpdatePayload = {
  name?: string | null;
};

export type MyTaskResponse = {
  task: HrTask;
  completed_at?: string | null;
};

export type HrTaskCreatePayload = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  announcement_id?: string | null;
  assignee_user_ids: string[];
};

export type EmployeeCreatePayload = {
  user_id?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  work_email?: string | null;
  phone?: string | null;
  position?: string | null;
  hire_date?: string | null;
  department_ids?: string[];
};

export type EmployeeUpdatePayload = {
  user_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  work_email?: string | null;
  phone?: string | null;
  position?: string | null;
  hire_date?: string | null;
  is_active?: boolean | null;
  department_ids?: string[] | null;
};

export type EmployeeProvisionPayload = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  work_email?: string | null;
  phone?: string | null;
  position?: string | null;
  hire_date?: string | null;
  department_ids?: string[];
};

export type LeaveRequestType = 'vacation' | 'day_off' | 'sick';
export type LeaveRequestStatus = 'submitted' | 'approved' | 'rejected' | 'canceled';

export type LeaveRequest = {
  id: string;
  user_id: string;
  request_type: LeaveRequestType;
  status: LeaveRequestStatus;
  start_date: string;
  end_date: string;
  reason?: string | null;
  hr_comment?: string | null;
};

export type LeaveRequestsQuery = {
  status?: LeaveRequestStatus;
  type?: LeaveRequestType;
  limit?: number;
  offset?: number;
};

export type LeaveRequestEvent = {
  id: string;
  request_id: string;
  actor_user_id: string;
  from_status?: LeaveRequestStatus | null;
  to_status: LeaveRequestStatus;
  comment?: string | null;
  created_at: string;
};

export type ChatType = 'direct' | 'group';
export type ChatMessageType = 'text' | 'voice';

export type ChatMember = {
  userId: string;
};

export type ChatMessagePreview = {
  id: string;
  senderId: string;
  senderName: string;
  messageType: ChatMessageType;
  body?: string | null;
  createdAt: string;
};

export type Chat = {
  id: string;
  chatType: ChatType;
  title: string;
  members: ChatMember[];
  unreadCount: number;
  lastMessage?: ChatMessagePreview | null;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  messageType: ChatMessageType;
  body?: string | null;
  voiceUrl?: string | null;
  createdAt: string;
};
