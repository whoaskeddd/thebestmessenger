import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Announcement, HrTask } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

export const DashboardScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [tasks, setTasks] = useState<HrTask[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTasksCount, setNewTasksCount] = useState(0);
  const [unreadLeaveCount, setUnreadLeaveCount] = useState(0);

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
        const [tasksCount, leaveCount] = await Promise.all([
          modulesApi.getNewMyTasksCount(),
          isHr ? modulesApi.getUnreadLeaveRequestsCount() : Promise.resolve(0),
        ]);
        setNewTasksCount(tasksCount);
        setUnreadLeaveCount(leaveCount);
      } catch {
        // ignore badge errors
      }
    })();
  }, [isHr]);

  useFocusEffect(loadBadges);

  const displayName = getDisplayName(user?.email ?? '');
  const roleLabel = getRoleLabel(user?.role ?? null);

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap}>
          <View style={styles.topRow}>
            <Text style={styles.title}>Главная</Text>
            <Pressable style={styles.iconBtn} onPress={() => Alert.alert('MVP', 'Уведомления появятся позже')}>
              <Text style={styles.iconText}>🔔</Text>
            </Pressable>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{roleLabel}</Text>
            </View>
            {isHr ? (
              <Pressable style={styles.hrChip} onPress={() => navigation.navigate('Employees')}>
                <Text style={styles.hrChipText}>HR</Text>
              </Pressable>
            ) : null}
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
  },
  iconText: {
    fontSize: 16,
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
