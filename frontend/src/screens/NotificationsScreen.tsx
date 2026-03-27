import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import {
  getSeenAnnouncementIds,
  getSeenLeaveStatuses,
  markAnnouncementsSeen,
  setSeenLeaveStatuses,
} from '../services/notificationStorage';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Announcement, Chat, HrTask, LeaveRequest } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;
type NotificationKind = 'announcement' | 'task' | 'leave' | 'chat';

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: string;
  unread: boolean;
  onPress: () => void;
};

export const NotificationsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const load = useCallback(async (markAsSeen: boolean): Promise<void> => {
    if (!user?.id) {
      setItems([]);
      setUnreadTotal(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const leavesPromise = isHr
        ? modulesApi.getLeaveRequests({ status: 'submitted', limit: 50, offset: 0 })
        : modulesApi.getLeaveRequests({ limit: 50, offset: 0 });

      const [tasks, tasksUnreadCount, leaves, leavesUnreadCountHr, chats, announcements, seenAnnouncementIds, seenLeaveStatuses] = await Promise.all([
        modulesApi.getMyTasks().catch(() => [] as HrTask[]),
        modulesApi.getNewMyTasksCount().catch(() => 0),
        leavesPromise.catch(() => [] as LeaveRequest[]),
        isHr ? modulesApi.getUnreadLeaveRequestsCount().catch(() => 0) : Promise.resolve(0),
        modulesApi.getChats({ limit: 200, offset: 0 }).catch(() => [] as Chat[]),
        modulesApi.getAnnouncements().catch(() => [] as Announcement[]),
        getSeenAnnouncementIds(user.id),
        getSeenLeaveStatuses(user.id),
      ]);

      const taskItems = buildTaskNotifications(tasks, tasksUnreadCount, markAsSeen, () => navigation.navigate('Tasks'));
      const chatItems = buildChatNotifications(chats, (chatId, chatName) => navigation.navigate('ChatRoom', { chatId, chatName }));
      const announcementItems = buildAnnouncementNotifications(
        announcements,
        seenAnnouncementIds,
        markAsSeen,
        () => navigation.navigate('News'),
      );

      const leavesPrepared = buildLeaveNotifications({
        leaves,
        isHr,
        unreadHrCount: leavesUnreadCountHr,
        seenStatuses: seenLeaveStatuses,
        markAsSeen,
        openLeaves: () => navigation.navigate('Leaves'),
      });

      if (markAsSeen) {
        const markCalls: Array<Promise<unknown>> = [
          modulesApi.markMyTasksSeen(),
          markAnnouncementsSeen(user.id, announcements.map((item) => item.id)),
          Promise.allSettled(announcements.map((item) => modulesApi.markAnnouncementRead(item.id))),
        ];
        if (isHr) {
          markCalls.push(modulesApi.markLeaveRequestsRead());
        } else {
          markCalls.push(setSeenLeaveStatuses(user.id, leavesPrepared.nextSeenStatuses));
        }
        await Promise.allSettled(markCalls);
      }

      const merged = [...taskItems, ...chatItems, ...announcementItems, ...leavesPrepared.items]
        .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));

      const totalUnread = merged.reduce((sum, item) => sum + (item.unread ? 1 : 0), 0);
      setItems(merged);
      setUnreadTotal(totalUnread);
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить уведомления');
    } finally {
      setLoading(false);
    }
  }, [isHr, navigation, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
      const timer = setInterval(() => {
        void load(false);
      }, 15000);
      return () => clearInterval(timer);
    }, [load]),
  );

  const title = useMemo(
    () => (unreadTotal > 0 ? `Уведомления (${unreadTotal})` : 'Уведомления'),
    [unreadTotal],
  );

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.header}>
            <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <View style={{ width: 36 }} />
          </View>

          {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

          {!isLoading && items.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Новых уведомлений пока нет</Text>
            </View>
          ) : null}

          {items.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, item.unread && styles.cardUnread]}
              onPress={item.onPress}
            >
              <View style={styles.cardHead}>
                <Text style={styles.kind}>{kindLabel[item.kind]}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <BottomPillNav />
      </View>
    </AppScreen>
  );
};

function buildTaskNotifications(
  tasks: HrTask[],
  unreadCount: number,
  markAsSeen: boolean,
  onPress: () => void,
): NotificationItem[] {
  const sorted = [...tasks].sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at));
  const unreadIds = new Set(sorted.slice(0, Math.max(0, unreadCount)).map((item) => item.id));
  return sorted.slice(0, 20).map((task) => ({
    id: `task-${task.id}`,
    kind: 'task',
    title: `Задача: ${task.title}`,
    body: task.description ?? 'Новая рабочая задача',
    createdAt: task.created_at ?? new Date().toISOString(),
    unread: markAsSeen ? false : unreadIds.has(task.id),
    onPress,
  }));
}

function buildChatNotifications(
  chats: Chat[],
  onOpenChat: (chatId: string, chatName?: string) => void,
): NotificationItem[] {
  const items: NotificationItem[] = [];
  chats.forEach((chat) => {
    if ((chat.unreadCount ?? 0) <= 0) return;
    items.push({
      id: `chat-${chat.id}`,
      kind: 'chat',
      title: `Чат: ${chat.title}`,
      body: chat.lastMessage?.body ?? `Новых сообщений: ${chat.unreadCount}`,
      createdAt: chat.lastMessage?.createdAt ?? chat.createdAt,
      unread: true,
      onPress: () => onOpenChat(chat.id, chat.title),
    });
  });
  return items;
}

function buildAnnouncementNotifications(
  announcements: Announcement[],
  seenIds: Set<string>,
  markAsSeen: boolean,
  onPress: () => void,
): NotificationItem[] {
  const sorted = [...announcements].sort((a, b) => toTimestamp(b.created_at) - toTimestamp(a.created_at));
  return sorted.slice(0, 20).map((announcement) => ({
    id: `announcement-${announcement.id}`,
    kind: 'announcement',
    title: `Объявление: ${announcement.title}`,
    body: announcement.body,
    createdAt: announcement.created_at ?? new Date().toISOString(),
    unread: markAsSeen ? false : !seenIds.has(announcement.id),
    onPress,
  }));
}

function buildLeaveNotifications(args: {
  leaves: LeaveRequest[];
  isHr: boolean;
  unreadHrCount: number;
  seenStatuses: Record<string, string>;
  markAsSeen: boolean;
  openLeaves: () => void;
}): { items: NotificationItem[]; nextSeenStatuses: Record<string, string> } {
  const { leaves, isHr, unreadHrCount, seenStatuses, markAsSeen, openLeaves } = args;
  const sorted = [...leaves].sort((a, b) => toTimestamp(b.start_date) - toTimestamp(a.start_date));

  if (isHr) {
    const unreadIds = new Set(sorted.slice(0, Math.max(0, unreadHrCount)).map((item) => item.id));
    return {
      items: sorted.slice(0, 20).map((leave) => ({
        id: `leave-${leave.id}`,
        kind: 'leave',
        title: `Заявка на ${leaveTypeLabel[leave.request_type] ?? leave.request_type}`,
        body: `Период: ${leave.start_date} — ${leave.end_date}`,
        createdAt: leave.start_date,
        unread: markAsSeen ? false : unreadIds.has(leave.id),
        onPress: openLeaves,
      })),
      nextSeenStatuses: seenStatuses,
    };
  }

  const relevant = sorted.filter((leave) => leave.status !== 'submitted');
  const nextSeenStatuses = { ...seenStatuses };
  relevant.forEach((leave) => {
    nextSeenStatuses[leave.id] = leave.status;
  });
  return {
    items: relevant.slice(0, 20).map((leave) => ({
      id: `leave-${leave.id}`,
      kind: 'leave',
      title: `Отпуск: ${statusLabel[leave.status] ?? leave.status}`,
      body: leave.hr_comment ? `Комментарий HR: ${leave.hr_comment}` : `Период: ${leave.start_date} — ${leave.end_date}`,
      createdAt: leave.end_date,
      unread: markAsSeen ? false : seenStatuses[leave.id] !== leave.status,
      onPress: openLeaves,
    })),
    nextSeenStatuses,
  };
}

function toTimestamp(dateValue?: string | null): number {
  if (!dateValue) return 0;
  const parsed = Date.parse(dateValue);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatTime(dateValue: string): string {
  const ts = toTimestamp(dateValue);
  if (ts <= 0) return '';
  return new Date(ts).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const kindLabel: Record<NotificationKind, string> = {
  announcement: 'Объявление',
  task: 'Задача',
  leave: 'Отпуск',
  chat: 'Чат',
};

const leaveTypeLabel: Record<string, string> = {
  vacation: 'отпуск',
  day_off: 'отгул',
  sick: 'больничный',
};

const statusLabel: Record<string, string> = {
  approved: 'одобрено',
  rejected: 'отклонено',
  canceled: 'отменено',
  submitted: 'на рассмотрении',
};

const styles = StyleSheet.create({
  page: { flex: 1 },
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 10, backgroundColor: colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  emptyCard: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 14 },
  emptyText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  card: { borderRadius: 16, backgroundColor: colors.surface, padding: 12, gap: 5 },
  cardUnread: { borderWidth: 1, borderColor: colors.primary },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kind: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.actionBlue, fontWeight: '700' },
  time: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textMuted },
  cardTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  cardBody: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
});
