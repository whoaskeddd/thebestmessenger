export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Profile: undefined;
  Notifications: undefined;
  Employees: undefined;
  EmployeeCard: { employeeId?: string } | undefined;
  Leaves: undefined;
  News: undefined;
  Tasks: undefined;
  Chats: undefined;
  ChatRoom: { chatId: string; chatName?: string } | undefined;
};
