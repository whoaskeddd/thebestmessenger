import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Employees'>;

export const EmployeesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async (query?: string): Promise<void> => {
    try {
      setLoading(true);
      const data = await modulesApi.getEmployees(query);
      setEmployees(data);
    } catch (error) {
      Alert.alert('Ошибка загрузки', error instanceof Error ? error.message : 'Не удалось получить сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isHr) {
      setLoading(false);
      return;
    }
    void load();
  }, [isHr]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) => {
      const fullName = `${employee.first_name} ${employee.last_name}`.toLowerCase();
      return fullName.includes(q) || (employee.position ?? '').toLowerCase().includes(q);
    });
  }, [employees, search]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Сотрудники</Text>

      {!isHr ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Раздел доступен только для HR</Text>
        </View>
      ) : null}

      {!isHr ? null : (
        <>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Поиск по имени или должности"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={styles.refreshBtn} onPress={() => void load(search)}>
              <Text style={styles.refreshText}>Обновить</Text>
            </Pressable>
          </View>

          {isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

          {!isLoading && filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Сотрудники не найдены</Text>
            </View>
          ) : null}

          {filtered.map((employee) => (
            <Pressable
              key={employee.id}
              style={styles.card}
              onPress={() => navigation.navigate('EmployeeCard', { employeeId: employee.id })}
            >
              <Text style={styles.name}>{employee.first_name} {employee.last_name}</Text>
              <Text style={styles.role}>{employee.position ?? 'Должность не указана'}</Text>
              <Text style={styles.meta}>{employee.work_email ?? 'Email не указан'}</Text>
            </Pressable>
          ))}
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  searchWrap: { gap: 8 },
  searchInput: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#111827',
  },
  refreshBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0F5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: { color: '#4F46E5', fontWeight: '700' },
  emptyCard: { borderRadius: 14, backgroundColor: '#F6F7F8', padding: 14 },
  emptyText: { color: '#6B7280' },
  card: { borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 12, gap: 4 },
  name: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  role: { color: '#6B7280', fontSize: 13 },
  meta: { color: '#9CA3AF', fontSize: 12 },
});
