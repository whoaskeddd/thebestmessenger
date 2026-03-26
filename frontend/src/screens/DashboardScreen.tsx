import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
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

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Дашборд</Text>
      <Text style={styles.sub}>Задачи, заявки и сообщения на сегодня</Text>

      <View style={[styles.card, { backgroundColor: '#F6F7F8' }]}> 
        <Text style={styles.cardTitle}>Профиль</Text>
        <Text style={styles.line}>{user?.email ?? '—'}</Text>
        <Text style={styles.line}>Роль: {user?.role ?? '—'}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: '#F6F7F8' }]}> 
        <Text style={styles.cardTitle}>Задачи</Text>
        {(tasks.length ? tasks : [{ id: 'stub-1', title: 'Нет активных задач' }]).map((task) => (
          <Text key={task.id} style={styles.line}>• {task.title}</Text>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: '#FFF4F4' }]}> 
        <Text style={styles.cardTitle}>Новости</Text>
        {(announcements.length ? announcements : [{ id: 'stub-2', title: 'Нет объявлений' }]).map((announcement) => (
          <Text key={announcement.id} style={styles.line}>• {announcement.title}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {isHr ? <QuickButton title="Сотрудники" onPress={() => navigation.navigate('Employees')} /> : null}
        {isHr ? <QuickButton title="Карточка" onPress={() => navigation.navigate('EmployeeCard', undefined)} /> : null}
        <QuickButton title="Заявки" onPress={() => navigation.navigate('Leaves')} badgeCount={isHr ? unreadLeaveCount : 0} />
        <QuickButton title="Новости" onPress={() => navigation.navigate('News')} />
        <QuickButton title="Задачи" onPress={() => navigation.navigate('Tasks')} badgeCount={newTasksCount} />
        <QuickButton title="Чаты" onPress={() => navigation.navigate('Chats')} />
        <QuickButton
          title="Комната"
          onPress={() => navigation.navigate('ChatRoom', { chatId: 'general', chatName: 'Общий чат HR' })}
        />
      </View>

      <Pressable style={styles.logoutBtn} onPress={() => void logout()}>
        <Text style={styles.logoutText}>Выйти</Text>
      </Pressable>
    </ScrollView>
  );
};

const QuickButton = ({ title, onPress, badgeCount }: { title: string; onPress: () => void; badgeCount?: number }) => (
  <Pressable style={styles.quickButton} onPress={onPress}>
    <Text style={styles.quickButtonText}>{title}</Text>
    {badgeCount ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : String(badgeCount)}</Text>
      </View>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
    backgroundColor: '#FFFFFF',
  },
  title: {
    color: '#1A1A1A',
    fontSize: 32,
    fontWeight: '700',
  },
  sub: {
    marginTop: -6,
    color: '#6B7280',
    fontSize: 13,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  line: {
    color: '#374151',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    minWidth: 110,
    height: 40,
    backgroundColor: '#F0F5FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    position: 'relative',
  },
  quickButtonText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  logoutBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
