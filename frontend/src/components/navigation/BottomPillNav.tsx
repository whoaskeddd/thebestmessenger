import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { fontFamilies, typography } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/types';

type RouteName = keyof RootStackParamList;

const items: Array<{ key: string; label: string; route: RouteName; short: string }> = [
  { key: 'dash', label: 'ГЛАВНАЯ', route: 'Dashboard', short: 'ГЛАВНАЯ' },
  { key: 'news', label: 'НОВОСТИ', route: 'News', short: 'НОВОСТИ' },
  { key: 'leave', label: 'ОТПУСК', route: 'Leaves', short: 'ОТПУСК' },
  { key: 'chat', label: 'ЧАТЫ', route: 'Chats', short: 'ЧАТЫ' },
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
          return (
            <Pressable
              key={item.key}
              style={[styles.item, isActive && styles.itemActive]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Text style={[styles.dot, isActive && styles.dotActive]}>●</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{item.short}</Text>
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
  dot: {
    fontFamily: fontFamilies.primary,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: -2,
  },
  dotActive: {
    color: colors.surface,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.surface,
  },
});
