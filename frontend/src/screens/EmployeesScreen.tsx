import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const EmployeesScreen = () => (
  <ScrollView contentContainerStyle={styles.wrap}>
    <Text style={styles.title}>Сотрудники</Text>

    <View style={styles.search}><Text style={styles.searchText}>Поиск по имени или отделу</Text></View>

    <View style={styles.filters}>
      <View style={styles.filterActive}><Text style={styles.filterActiveText}>Все</Text></View>
      <View style={styles.filter}><Text style={styles.filterText}>HR</Text></View>
    </View>

    <Card name="Иванов Илья" role="HR Business Partner" />
    <Card name="Петрова Анна" role="Рекрутер" />
  </ScrollView>
);

const Card = ({ name, role }: { name: string; role: string }) => (
  <View style={styles.card}>
    <Text style={styles.name}>{name}</Text>
    <Text style={styles.role}>{role}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  search: { height: 52, borderRadius: 16, backgroundColor: '#F6F7F8', justifyContent: 'center', paddingHorizontal: 14 },
  searchText: { color: '#9CA3AF', fontSize: 13 },
  filters: { flexDirection: 'row', gap: 8 },
  filterActive: { height: 34, borderRadius: 12, backgroundColor: '#FF6B6B', justifyContent: 'center', paddingHorizontal: 12 },
  filterActiveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  filter: { height: 34, borderRadius: 12, backgroundColor: '#F6F7F8', justifyContent: 'center', paddingHorizontal: 12 },
  filterText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 12, gap: 4 },
  name: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  role: { color: '#6B7280', fontSize: 13 },
});
