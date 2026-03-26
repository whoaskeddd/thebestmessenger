import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Chats'>;

type ChatPreview = {
  id: string;
  name: string;
  message: string;
  trailing: string;
  unread?: number;
};

const initialChats: ChatPreview[] = [
  {
    id: 'anna-petrova',
    name: 'Анна Петрова',
    message: 'Отправила обновленный оффер для кандидата',
    trailing: '09:42',
  },
  {
    id: 'igor-smirnov',
    name: 'Игорь Смирнов',
    message: 'Нужно согласовать дату интервью на завтра',
    trailing: 'Вчера',
  },
  {
    id: 'elena-hrbp',
    name: 'Елена HRBP',
    message: 'Финальный фидбек загружен в карточку сотрудника',
    trailing: '09:01',
    unread: 2,
  },
];

export const ChatsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [isLoadingEmployees, setLoadingEmployees] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const chats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialChats;
    return initialChats.filter((chat) => {
      const haystack = `${chat.name} ${chat.message}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search]);

  const loadEmployees = async (): Promise<void> => {
    if (!isHr) return;
    try {
      setLoadingEmployees(true);
      const data = await modulesApi.getEmployees();
      setEmployees(data);
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить сотрудников');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const togglePicker = async (): Promise<void> => {
    const next = !showEmployeePicker;
    setShowEmployeePicker(next);
    if (next && employees.length === 0) {
      await loadEmployees();
    }
  };

  const openEmployeeRoom = (employee: Employee): void => {
    const name = `${employee.first_name} ${employee.last_name}`;
    const chatId = employee.user_id ?? employee.id;
    navigation.navigate('ChatRoom', { chatId, chatName: name });
    setShowEmployeePicker(false);
  };

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Чаты</Text>
            <Pressable
              style={styles.plus}
              onPress={() => {
                if (isHr) {
                  void togglePicker();
                  return;
                }
                navigation.navigate('ChatRoom', { chatId: 'new-chat', chatName: 'Новый чат' });
              }}
            >
              <Text style={styles.plusText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              style={styles.search}
              placeholder="Поиск по чатам"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor={colors.textMuted}
            />
          </View>

          {isHr && showEmployeePicker ? (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Выберите сотрудника</Text>
              {isLoadingEmployees ? <ActivityIndicator color={colors.primary} /> : null}
              {!isLoadingEmployees && employees.length === 0 ? (
                <Text style={styles.pickerEmpty}>Сотрудники не найдены</Text>
              ) : null}
              {employees.map((employee) => (
                <Pressable key={employee.id} style={styles.pickerRow} onPress={() => openEmployeeRoom(employee)}>
                  <Text style={styles.pickerName}>{employee.first_name} {employee.last_name}</Text>
                  <Text style={styles.pickerMeta}>{employee.position ?? 'Сотрудник'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Последние</Text>

          {chats.map((chat) => (
            <Pressable key={chat.id} onPress={() => navigation.navigate('ChatRoom', { chatId: chat.id, chatName: chat.name })}>
              <Row name={chat.name} message={chat.message} trailing={chat.trailing} unread={chat.unread} />
            </Pressable>
          ))}
        </ScrollView>

        <BottomPillNav activeRoute="Chats" />
      </View>
    </AppScreen>
  );
};

const Row = ({
  name,
  message,
  trailing,
  unread,
}: {
  name: string;
  message: string;
  trailing: string;
  unread?: number;
}) => (
  <View style={styles.row}>
    <View style={styles.avatar} />
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName}>{name}</Text>
      <Text style={styles.rowMessage}>{message}</Text>
    </View>
    {unread ? (
      <View style={styles.badge}><Text style={styles.badgeText}>{unread}</Text></View>
    ) : (
      <Text style={styles.trailing}>{trailing}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  page: { flex: 1 },
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 10, backgroundColor: colors.pageBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  plus: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.surface, fontSize: 18, fontWeight: '700', fontFamily: fontFamilies.primary, marginTop: -1 },
  pickerCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 12,
    gap: 8,
  },
  pickerTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  pickerEmpty: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  pickerRow: {
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pickerName: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  pickerMeta: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  searchWrap: {
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchIcon: {
    fontFamily: fontFamilies.primary,
    color: colors.textMuted,
    fontSize: 14,
  },
  search: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
    fontSize: 13,
  },
  label: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '700', marginTop: 8 },
  row: { borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.surface },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.cardStrong },
  rowName: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  rowMessage: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  trailing: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textMuted, fontWeight: '700' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.surface, fontWeight: '700' },
});
