import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { Department, Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeCard'>;

export const EmployeeCardScreen = ({ route }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [isDeptPickerOpen, setDeptPickerOpen] = useState(false);
  const [deptQuery, setDeptQuery] = useState('');
  const [isSaving, setSaving] = useState(false);

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
          const [item, deps] = await Promise.all([
            modulesApi.getEmployee(employeeId),
            modulesApi.getDepartments({ limit: 200, offset: 0 }),
          ]);
          setEmployee(item);
          setDepartments(deps);
          setSelectedDepartmentIds((item.departments ?? []).map((d) => d.id));
          return;
        }

        const [all, deps] = await Promise.all([
          modulesApi.getEmployees(),
          modulesApi.getDepartments({ limit: 200, offset: 0 }),
        ]);
        const first = all[0] ?? null;
        setEmployee(first);
        setDepartments(deps);
        setSelectedDepartmentIds(first ? (first.departments ?? []).map((d) => d.id) : []);
      } catch (error) {
        Alert.alert('Ошибка загрузки', error instanceof Error ? error.message : 'Не удалось получить карточку сотрудника');
      } finally {
        setLoading(false);
      }
    })();
  }, [isHr, route.params?.employeeId]);

  const filteredDepartments = useMemo(() => {
    const q = deptQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, deptQuery]);

  const toggleDepartment = (departmentId: string): void => {
    setSelectedDepartmentIds((prev) => (
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId]
    ));
  };

  const closeDeptPicker = (): void => {
    setDeptPickerOpen(false);
    setDeptQuery('');
  };

  const saveDepartments = async (): Promise<void> => {
    if (!employee) return;
    setSaving(true);
    try {
      const updated = await modulesApi.updateEmployee(employee.id, { department_ids: selectedDepartmentIds });
      setEmployee(updated);
      closeDeptPicker();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось обновить отделы');
    } finally {
      setSaving(false);
    }
  };

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
            <Pressable style={styles.deptEditBtn} onPress={() => setDeptPickerOpen(true)}>
              <Text style={styles.deptEditText}>Изменить отделы</Text>
            </Pressable>
          </View>

          <Pressable style={[styles.action, { backgroundColor: '#FF6B6B' }]}>
            <Text style={styles.actionText}>Написать</Text>
          </Pressable>
        </>
      ) : null}

      <Modal visible={isDeptPickerOpen} transparent animationType="fade" onRequestClose={closeDeptPicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Отделы</Text>
              <Pressable onPress={closeDeptPicker} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Закрыть</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.modalSearch}
              value={deptQuery}
              onChangeText={setDeptQuery}
              placeholder="Поиск отдела"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />

            <FlatList
              data={filteredDepartments}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const checked = selectedDepartmentIds.includes(item.id);
                return (
                  <Pressable style={[styles.deptRow, checked && styles.deptRowChecked]} onPress={() => toggleDepartment(item.id)}>
                    <Text style={styles.deptName}>{item.name}</Text>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      <Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.meta}>Отделы не найдены</Text>}
            />

            <Pressable style={styles.modalDone} onPress={() => void saveDepartments()} disabled={isSaving}>
              <Text style={styles.modalDoneText}>{isSaving ? 'Сохраняю...' : 'Сохранить'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  deptEditBtn: {
    marginTop: 6,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptEditText: { color: '#4338CA', fontWeight: '700', fontSize: 12 },
  action: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20, justifyContent: 'center' },
  modalCard: { maxHeight: '80%', borderRadius: 16, backgroundColor: '#FFFFFF', padding: 14, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#111827', fontWeight: '800', fontSize: 16 },
  modalClose: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F3F4F6' },
  modalCloseText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  modalSearch: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    color: '#111827',
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  deptRowChecked: { backgroundColor: '#EEF2FF' },
  deptName: { color: '#111827', fontWeight: '800' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { borderColor: '#4F46E5', backgroundColor: '#4F46E5' },
  checkboxText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, marginTop: -2 },
  modalDone: { height: 44, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  modalDoneText: { color: '#FFFFFF', fontWeight: '800' },
});
