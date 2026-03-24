import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chats'>;

export const ChatsScreen = ({ navigation }: Props) => (
  <ScrollView contentContainerStyle={styles.wrap}>
    <View style={styles.header}>
      <Text style={styles.title}>Чаты HR</Text>
      <View style={styles.plus}><Text style={styles.plusText}>+</Text></View>
    </View>

    <View style={styles.search}><Text style={styles.searchText}>Поиск по чатам</Text></View>

    <Text style={styles.label}>Последние</Text>

    <Pressable onPress={() => navigation.navigate('ChatRoom')}>
      <Row name="Анна Петрова" message="Отправила обновленный оффер для кандидата" trailing="09:42" light />
    </Pressable>
    <Pressable onPress={() => navigation.navigate('ChatRoom')}>
      <Row name="Игорь Смирнов" message="Нужно согласовать дату интервью на завтра" trailing="Вчера" />
    </Pressable>
    <Pressable onPress={() => navigation.navigate('ChatRoom')}>
      <Row name="Елена HRBP" message="Финальный фидбек загружен в карточку сотрудника" trailing="2" light badge />
    </Pressable>
  </ScrollView>
);

const Row = ({
  name,
  message,
  trailing,
  light = false,
  badge = false,
}: {
  name: string;
  message: string;
  trailing: string;
  light?: boolean;
  badge?: boolean;
}) => (
  <View style={[styles.row, { backgroundColor: light ? '#FFFFFF' : '#F6F7F8' }]}> 
    <View style={styles.avatar} />
    <View style={{ flex: 1 }}>
      <Text style={styles.rowName}>{name}</Text>
      <Text style={styles.rowMessage}>{message}</Text>
    </View>
    {badge ? (
      <View style={styles.badge}><Text style={styles.badgeText}>{trailing}</Text></View>
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
  search: { height: 52, borderRadius: 26, backgroundColor: '#F6F7F8', justifyContent: 'center', paddingHorizontal: 14 },
  searchText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
  label: { color: '#1A1A1A', fontSize: 18, fontWeight: '700', marginTop: 2 },
  row: { borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#FFE3E5' },
  rowName: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  rowMessage: { color: '#6B7280', fontSize: 13 },
  trailing: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  badge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
