import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeCard'>;

export const EmployeeCardScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!isHr) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const employeeId = route.params?.employeeId;

        if (employeeId) {
          const item = await modulesApi.getEmployee(employeeId);
          setEmployee(item);
          return;
        }

        const all = await modulesApi.getEmployees();
        setEmployee(all[0] ?? null);
      } catch (error) {
        Alert.alert('Ошибка загрузки', error instanceof Error ? error.message : 'Не удалось получить карточку сотрудника');
      } finally {
        setLoading(false);
      }
    })();
  }, [isHr, route.params?.employeeId]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Карточка сотрудника</Text>

      {!isHr ? (
        <View style={styles.infoCard}>
          <Text style={styles.meta}>Раздел доступен только для HR</Text>
        </View>
      ) : null}

      {isHr && isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

      {isHr && !isLoading && !employee ? (
        <View style={styles.infoCard}>
          <Text style={styles.meta}>Сотрудники пока не добавлены</Text>
        </View>
      ) : null}

      {isHr && employee ? (
        <>
          <View style={styles.profileCard}>
            <Text style={styles.name}>{employee.first_name} {employee.last_name}</Text>
            <Text style={styles.role}>{employee.position ?? 'Должность не указана'}</Text>
            <Text style={styles.meta}>{employee.work_email ?? 'Email не указан'}</Text>
            <Text style={styles.meta}>{employee.phone ?? 'Телефон не указан'}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.meta}>Отделы: {(employee.departments ?? []).map((dep) => dep.name).join(', ') || 'Не назначены'}</Text>
            <Text style={styles.meta}>Статус: {employee.is_active === false ? 'Неактивен' : 'Активен'}</Text>
          </View>

          <Pressable style={[styles.action, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.actionText}>Написать</Text>
          </Pressable>
        </>
      ) : null}
    </ScrollView>
  );
};

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
