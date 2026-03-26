import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Chat, Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Chats'>;

export const ChatsScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setLoadingChats] = useState(true);

  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [isLoadingEmployees, setLoadingEmployees] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadChats = async (): Promise<void> => {
    try {
      setLoadingChats(true);
      const data = await modulesApi.getChats();
      setChats(data);
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить чаты');
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    void loadChats();
  }, []);

  const filteredChats = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...chats].sort((a, b) => {
      const aDate = a.lastMessage?.createdAt ?? a.createdAt;
      const bDate = b.lastMessage?.createdAt ?? b.createdAt;
      return bDate.localeCompare(aDate);
    });

    if (!q) return sorted;
    return sorted.filter((chat) => {
      const lastText = chat.lastMessage?.body ?? '';
      const haystack = `${chat.title} ${lastText}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [chats, search]);

  const loadEmployees = async (): Promise<void> => {
    try {
      setLoadingEmployees(true);
      const data = await modulesApi.getEmployees();
      const available = data.filter((employee) => employee.user_id && employee.user_id !== user?.id);
      setEmployees(available);
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

  const openEmployeeRoom = async (employee: Employee): Promise<void> => {
    if (!employee.user_id) {
      Alert.alert('Невозможно создать чат', 'У сотрудника нет пользовательского аккаунта');
      return;
    }

    try {
      const chat = await modulesApi.createDirectChat(employee.user_id);
      setShowEmployeePicker(false);
      await loadChats();
      navigation.navigate('ChatRoom', { chatId: chat.id, chatName: chat.title });
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось открыть чат');
    }
  };

  const openChat = (chat: Chat): void => {
    navigation.navigate('ChatRoom', { chatId: chat.id, chatName: chat.title });
  };

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Чаты</Text>
            <Pressable style={styles.plus} onPress={() => void togglePicker()}>
              <Text style={styles.plusText}>{showEmployeePicker ? '×' : '+'}</Text>
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

          {showEmployeePicker ? (
            <View style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Новый чат</Text>
              {isLoadingEmployees ? <ActivityIndicator color={colors.primary} /> : null}
              {!isLoadingEmployees && employees.length === 0 ? (
                <Text style={styles.pickerEmpty}>Нет сотрудников для создания чата</Text>
              ) : null}
              {employees.map((employee) => (
                <Pressable key={employee.id} style={styles.pickerRow} onPress={() => void openEmployeeRoom(employee)}>
                  <Text style={styles.pickerName}>{employee.first_name} {employee.last_name}</Text>
                  <Text style={styles.pickerMeta}>{employee.position ?? 'Сотрудник'}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Последние</Text>

          {isLoadingChats ? <ActivityIndicator color={colors.primary} /> : null}

          {!isLoadingChats && filteredChats.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Чатов пока нет</Text>
            </View>
          ) : null}

          {filteredChats.map((chat) => (
            <Pressable key={chat.id} onPress={() => openChat(chat)}>
              <Row
                name={chat.title}
                message={chat.lastMessage?.body ?? 'Нет сообщений'}
                trailing={formatTimeLabel(chat.lastMessage?.createdAt ?? chat.createdAt)}
                unread={chat.unreadCount}
              />
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
  unread: number;
}) => (
  <View style={styles.row}>
    <View style={styles.avatar} />
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName}>{name}</Text>
      <Text style={styles.rowMessage} numberOfLines={1}>{message}</Text>
    </View>
    {unread > 0 ? (
      <View style={styles.badge}><Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text></View>
    ) : (
      <Text style={styles.trailing}>{trailing}</Text>
    )}
  </View>
);

function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.surface, fontWeight: '700', fontSize: 11 },
  emptyCard: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 14 },
  emptyText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textSecondary },
});
