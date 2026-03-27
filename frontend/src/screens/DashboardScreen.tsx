import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { getSeenAnnouncementIds, getSeenLeaveStatuses } from '../services/notificationStorage';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Announcement, Chat, HrTask, LeaveRequest } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [tasks, setTasks] = useState<HrTask[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTasksCount, setNewTasksCount] = useState(0);
  const [unreadLeaveCount, setUnreadLeaveCount] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [tasksData, announcementsData] = await Promise.all([
          modulesApi.getMyTasks(),
          modulesApi.getAnnouncements(),
        ]);
        setTasks(tasksData.slice(0, 2));
        setAnnouncements(announcementsData.slice(0, 2));
      } catch (error) {
        Alert.alert('Часть данных не загружена', error instanceof Error ? error.message : 'Ошибка сети');
      }
    })();
  }, []);

  const loadBadges = useCallback(() => {
    (async () => {
      try {
        const leavesPromise = isHr
          ? modulesApi.getLeaveRequests({ status: 'submitted', limit: 50, offset: 0 })
          : modulesApi.getLeaveRequests({ limit: 50, offset: 0 });

        const [tasksCount, leaveCountHr, chats, annItems, leaveItems, seenAnnouncements, seenLeaveStatuses] = await Promise.all([
          modulesApi.getNewMyTasksCount(),
          isHr ? modulesApi.getUnreadLeaveRequestsCount() : Promise.resolve(0),
          modulesApi.getChats({ limit: 200, offset: 0 }).catch(() => [] as Chat[]),
          modulesApi.getAnnouncements().catch(() => [] as Announcement[]),
          leavesPromise.catch(() => [] as LeaveRequest[]),
          user?.id ? getSeenAnnouncementIds(user.id) : Promise.resolve(new Set<string>()),
          user?.id ? getSeenLeaveStatuses(user.id) : Promise.resolve({} as Record<string, string>),
        ]);

        const chatUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount ?? 0), 0);
        const annUnread = annItems.reduce((sum, item) => sum + (seenAnnouncements.has(item.id) ? 0 : 1), 0);
        const leaveCount = isHr
          ? leaveCountHr
          : leaveItems.filter((item) => item.status !== 'submitted' && seenLeaveStatuses[item.id] !== item.status).length;

        setNewTasksCount(tasksCount);
        setUnreadLeaveCount(isHr ? leaveCount : 0);
        setNotificationsCount(tasksCount + leaveCount + chatUnread + annUnread);
      } catch {
        // ignore badge errors
      }
    })();
  }, [isHr, user?.id]);

  useFocusEffect(loadBadges);

  const displayName = getDisplayName(user?.email ?? '');
  const roleLabel = getRoleLabel(user?.role ?? null);

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.topRow}>
            <Text style={styles.title}>Главная</Text>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.iconText}>🔔</Text>
              {notificationsCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{notificationsCount > 99 ? '99+' : notificationsCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{roleLabel}</Text>
            </View>
            <View style={styles.profileActions}>
              <Pressable style={styles.profileBtn} onPress={() => navigation.navigate('Profile')}>
                <Text style={styles.profileBtnText}>Профиль</Text>
              </Pressable>
              {isHr ? (
                <Pressable style={styles.hrChip} onPress={() => navigation.navigate('Employees')}>
                  <Text style={styles.hrChipText}>HR</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Задачи</Text>
              <Text style={styles.statValue}>{Math.max(newTasksCount, tasks.length) || 0} в работе</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Согласования</Text>
              <Text style={styles.statValue}>{isHr ? unreadLeaveCount : 0} заявки</Text>
            </View>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Новости и обновления</Text>
            <Pressable onPress={() => navigation.navigate('News')}>
              <Text style={styles.sectionLink}>Смотреть все</Text>
            </Pressable>
          </View>

          <View style={styles.newsList}>
            {(announcements.length ? announcements : [{ id: 'stub', title: 'Обновлений пока нет', body: ' ' } as Announcement])
              .slice(0, 2)
              .map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.newsCard}
                  onPress={() => navigation.navigate('News')}
                >
                  <Text style={styles.newsTitle}>{item.title}</Text>
                  <Text numberOfLines={2} style={styles.newsBody}>
                    {item.body || '—'}
                  </Text>
                </Pressable>
              ))}
          </View>

          <Pressable style={styles.logoutBtn} onPress={() => void logout()}>
            <Text style={styles.logoutText}>Выйти</Text>
          </Pressable>
        </ScrollView>

        <BottomPillNav activeRoute="Dashboard" />
      </View>
    </AppScreen>
  );
};

function getDisplayName(email: string): string {
  const local = (email.split('@')[0] ?? '').trim();
  if (!local) return 'Сотрудник';
  const parts = local.split(/[._-]+/g).filter(Boolean);
  const toTitle = (s: string) => s.slice(0, 1).toUpperCase() + s.slice(1);
  if (parts.length >= 2) return `${toTitle(parts[0])} ${toTitle(parts[1])}`;
  return toTitle(local);
}

function getRoleLabel(role: string | null): string {
  if (!role) return '—';
  if (role === 'admin') return 'Администратор';
  if (role === 'hr') return 'HR менеджер';
  if (role === 'manager') return 'Руководитель';
  return 'Сотрудник';
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  wrap: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 14,
    backgroundColor: colors.pageBg,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconText: {
    fontSize: 16,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.surface,
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 10,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: colors.cardStrong,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2E6DE0',
  },
  profileName: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  profileRole: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnText: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  hrChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hrChipText: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textMuted,
  },
  statValue: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionLink: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.actionBlue,
    fontWeight: '700',
  },
  newsList: {
    gap: 10,
  },
  newsCard: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 6,
  },
  newsTitle: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  newsBody: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
  },
  logoutBtn: {
    marginTop: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    ...typography.button,
    fontFamily: fontFamilies.primary,
    color: colors.surface,
  },
});
