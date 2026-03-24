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
  first_name: string;
  last_name: string;
  position?: string | null;
  work_email?: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  created_at?: string;
};

export type HrTask = {
  id: string;
  title: string;
  description?: string | null;
  completed_at?: string | null;
};
