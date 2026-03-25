export type UserRole = 'employee' | 'manager' | 'hr' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
}

export interface TaskItem {
  id: string;
  title: string;
  dueAt: string;
  completed: boolean;
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  type: 'vacation' | 'dayoff' | 'sick';
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  author: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  pending?: boolean;
}

export interface ChatPreview {
  id: string;
  title: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessage?: ChatMessage;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
