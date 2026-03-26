import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { RootStackParamList } from '../navigation/types';

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
  const [search, setSearch] = useState('');

  const chats = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialChats;
    return initialChats.filter((chat) => {
      const haystack = `${chat.name} ${chat.message}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [search]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Чаты HR</Text>
        <Pressable style={styles.plus} onPress={() => navigation.navigate('ChatRoom', { chatId: 'new-chat', chatName: 'Новый чат' })}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Поиск по чатам"
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9CA3AF"
      />

      <Text style={styles.label}>Последние</Text>

      {chats.map((chat) => (
        <Pressable key={chat.id} onPress={() => navigation.navigate('ChatRoom', { chatId: chat.id, chatName: chat.name })}>
          <Row name={chat.name} message={chat.message} trailing={chat.trailing} unread={chat.unread} />
        </Pressable>
      ))}
    </ScrollView>
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
  wrap: { paddingTop: 16, paddingHorizontal: 16, paddingBottom: 24, gap: 10, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#1A1A1A', fontSize: 28, fontWeight: '700' },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  search: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F6F7F8',
    paddingHorizontal: 14,
    color: '#111827',
  },
  label: { color: '#1A1A1A', fontSize: 18, fontWeight: '700', marginTop: 2 },
  row: { borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#F6F7F8' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE3E5' },
  rowName: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  rowMessage: { color: '#6B7280', fontSize: 13 },
  trailing: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  badge: { minWidth: 22, height: 22, borderRadius: 11, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
