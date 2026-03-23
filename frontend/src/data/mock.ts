import { ChatMessage, ChatPreview, LeaveRequest, NewsItem, TaskItem, User } from '../types/models';

export const currentUser: User = {
  id: 'u-1',
  fullName: 'Алексей Смирнов',
  email: 'alexey@company.com',
  role: 'hr',
  department: 'HR',
  position: 'HR Business Partner'
};

export const employees: User[] = [
  currentUser,
  {
    id: 'u-2',
    fullName: 'Мария Иванова',
    email: 'maria@company.com',
    role: 'manager',
    department: 'Sales',
    position: 'Head of Sales'
  },
  {
    id: 'u-3',
    fullName: 'Дмитрий Орлов',
    email: 'dmitriy@company.com',
    role: 'employee',
    department: 'Engineering',
    position: 'Backend Engineer'
  }
];

export const tasks: TaskItem[] = [
  { id: 't-1', title: 'Согласовать отпуск Марии Ивановой', dueAt: '2026-03-24', completed: false },
  { id: 't-2', title: 'Опубликовать план онбординга Q2', dueAt: '2026-03-26', completed: false },
  { id: 't-3', title: 'Проверить закрытие вакансии QA', dueAt: '2026-03-22', completed: true }
];

export const leaveRequests: LeaveRequest[] = [
  {
    id: 'l-1',
    type: 'vacation',
    from: '2026-04-10',
    to: '2026-04-17',
    reason: 'Плановый отпуск',
    status: 'pending',
    createdAt: '2026-03-21'
  },
  {
    id: 'l-2',
    type: 'dayoff',
    from: '2026-03-29',
    to: '2026-03-29',
    reason: 'Семейные обстоятельства',
    status: 'approved',
    createdAt: '2026-03-18'
  }
];

export const newsFeed: NewsItem[] = [
  {
    id: 'n-1',
    title: 'Обновление политики удаленной работы',
    summary: 'Новые правила по гибридному графику начинают действовать с апреля.',
    content:
      'С 1 апреля 2026 года действует обновленный гибридный формат. Минимум 2 дня в офисе для команд с критичной кросс-функциональной координацией. Подробности уточняйте у HRBP.',
    publishedAt: '2026-03-20',
    author: 'HR Team'
  },
  {
    id: 'n-2',
    title: 'Корпоративный митап по AI-инструментам',
    summary: 'В пятницу пройдет внутренний митап по автоматизации рабочих процессов.',
    content:
      'Приглашаем на митап в конференц-зал Delta в 18:00. Будут кейсы по ускорению HR и инженерных процессов и обзор внутренних AI-инструментов.',
    publishedAt: '2026-03-19',
    author: 'People Ops'
  }
];

export const chats: ChatPreview[] = [
  {
    id: 'c-1',
    title: 'HR Team',
    isGroup: true,
    unreadCount: 2,
    lastMessage: {
      id: 'm-3',
      chatId: 'c-1',
      senderId: 'u-2',
      senderName: 'Мария',
      body: 'Отпуск согласован, проверьте карточку заявки.',
      createdAt: '2026-03-23T15:20:00Z'
    }
  },
  {
    id: 'c-2',
    title: 'Дмитрий Орлов',
    isGroup: false,
    unreadCount: 0,
    lastMessage: {
      id: 'm-5',
      chatId: 'c-2',
      senderId: 'u-3',
      senderName: 'Дмитрий',
      body: 'Можно уточнить даты ревью?',
      createdAt: '2026-03-23T10:12:00Z'
    }
  }
];

export const messagesByChat: Record<string, ChatMessage[]> = {
  'c-1': [
    {
      id: 'm-1',
      chatId: 'c-1',
      senderId: 'u-1',
      senderName: 'Алексей',
      body: 'Коллеги, проверьте новые заявки на отпуск.',
      createdAt: '2026-03-23T14:00:00Z'
    },
    {
      id: 'm-2',
      chatId: 'c-1',
      senderId: 'u-2',
      senderName: 'Мария',
      body: 'Принято, беру в работу.',
      createdAt: '2026-03-23T14:05:00Z'
    },
    {
      id: 'm-3',
      chatId: 'c-1',
      senderId: 'u-2',
      senderName: 'Мария',
      body: 'Отпуск согласован, проверьте карточку заявки.',
      createdAt: '2026-03-23T15:20:00Z'
    }
  ],
  'c-2': [
    {
      id: 'm-4',
      chatId: 'c-2',
      senderId: 'u-1',
      senderName: 'Алексей',
      body: 'Добрый день. Отправьте, пожалуйста, апдейт по задачам.',
      createdAt: '2026-03-23T09:55:00Z'
    },
    {
      id: 'm-5',
      chatId: 'c-2',
      senderId: 'u-3',
      senderName: 'Дмитрий',
      body: 'Можно уточнить даты ревью?',
      createdAt: '2026-03-23T10:12:00Z'
    }
  ]
};
