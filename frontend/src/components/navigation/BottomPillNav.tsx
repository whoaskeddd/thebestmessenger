import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  const current = (activeRoute ?? (route.name as RouteName)) as RouteName;

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
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

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
});
