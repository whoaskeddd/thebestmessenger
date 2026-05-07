import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../../api/modules';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';
import { fontFamilies, typography } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

import HouseIcon from '../../assets/icons/house.svg';
import NewspaperIcon from '../../assets/icons/newspaper.svg';
import CalendarIcon from '../../assets/icons/calendar.svg';
import CheckIcon from '../../assets/icons/check.svg';
import ChatIcon from '../../assets/icons/chat.svg';

type RouteName = keyof RootStackParamList;

const items: Array<{ key: string; route: RouteName; label: string; Icon: ComponentType<{ width?: number; height?: number; color?: string }> }> = [
  { key: 'dash', route: 'Dashboard', label: 'ГЛАВНАЯ', Icon: HouseIcon },
  { key: 'news', route: 'News', label: 'НОВОСТИ', Icon: NewspaperIcon },
  { key: 'leave', route: 'Leaves', label: 'ОТПУСК', Icon: CalendarIcon },
  { key: 'tasks', route: 'Tasks', label: 'ЗАДАЧИ', Icon: CheckIcon },
  { key: 'chat', route: 'Chats', label: 'ЧАТЫ', Icon: ChatIcon },
];

export function BottomPillNav({ activeRoute }: { activeRoute?: RouteName }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [badges, setBadges] = useState({ leaves: 0, tasks: 0, chats: 0 });

  const current = (activeRoute ?? (route.name as RouteName)) as RouteName;

  const loadBadges = useCallback(async (): Promise<void> => {
    try {
      const [tasks, leaves, chats] = await Promise.all([
        modulesApi.getNewMyTasksCount().catch(() => 0),
        isHr ? modulesApi.getUnreadLeaveRequestsCount().catch(() => 0) : Promise.resolve(0),
        modulesApi.getChats({ limit: 200, offset: 0 }).catch(() => []),
      ]);
      const unreadChats = chats.reduce((sum, chat) => sum + (chat.unreadCount ?? 0), 0);
      setBadges({ tasks, leaves, chats: unreadChats });
    } catch {
      // ignore badge loading issues
    }
  }, [isHr]);

  useFocusEffect(
    useCallback(() => {
      void loadBadges();
      const timer = setInterval(() => {
        void loadBadges();
      }, 15000);
      return () => clearInterval(timer);
    }, [loadBadges]),
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        {items.map((item) => {
          const isActive = current === item.route;
          const iconColor = isActive ? colors.surface : colors.textMuted;
          return (
            <Pressable
              key={item.key}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.iconWrap}>
                <item.Icon width={16} height={16} color={iconColor} />
                {item.route === 'Leaves' && badges.leaves > 0 ? <Badge value={badges.leaves} /> : null}
                {item.route === 'Tasks' && badges.tasks > 0 ? <Badge value={badges.tasks} /> : null}
                {item.route === 'Chats' && badges.chats > 0 ? <Badge value={badges.chats} /> : null}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const Badge = ({ value }: { value: number }) => (
  <View style={styles.badge}>
    <Text style={styles.badgeText}>{value > 99 ? '99+' : value}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 21,
    paddingTop: 12,
    paddingBottom: 21,
    backgroundColor: colors.pageBg,
  },
  pill: {
    height: 62,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  item: {
    flex: 1,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  iconWrap: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 12,
  },
  labelActive: {
    color: colors.surface,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
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
});
