import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export const EmployeeCardScreen = () => (
  <ScrollView contentContainerStyle={styles.wrap}>
    <Text style={styles.title}>Карточка сотрудника</Text>

    <View style={styles.profileCard}>
      <Text style={styles.name}>Илья Иванов</Text>
      <Text style={styles.role}>HR Business Partner</Text>
      <Text style={styles.meta}>ivanov@company.com</Text>
      <Text style={styles.meta}>+7 (900) 000-00-01</Text>
    </View>

    <View style={styles.infoCard}>
      <Text style={styles.meta}>Отдел: HR</Text>
      <Text style={styles.meta}>Руководитель: Анна Петрова</Text>
    </View>

    <Pressable style={[styles.action, { backgroundColor: '#FF6B6B' }]}><Text style={styles.actionText}>Написать</Text></Pressable>
    <Pressable style={[styles.action, { backgroundColor: '#F0F5FF' }]}><Text style={[styles.actionText, { color: '#4F46E5' }]}>Позвонить</Text></Pressable>
  </ScrollView>
);

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 16, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  profileCard: { borderRadius: 18, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 16, gap: 8 },
  infoCard: { borderRadius: 16, backgroundColor: '#F6F7F8', padding: 16, gap: 8 },
  name: { color: '#1A1A1A', fontSize: 18, fontWeight: '700' },
  role: { color: '#6B7280', fontSize: 14 },
  meta: { color: '#374151', fontSize: 13 },
  action: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
