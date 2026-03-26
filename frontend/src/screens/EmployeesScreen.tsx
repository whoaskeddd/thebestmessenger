import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
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
import type { Department, Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Employees'>;

export const EmployeesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isProvisioning, setProvisioning] = useState(false);
  const [search, setSearch] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [isDeptPickerOpen, setDeptPickerOpen] = useState(false);
  const [deptQuery, setDeptQuery] = useState('');

  const load = async (query?: string): Promise<void> => {
    try {
      setLoading(true);
      const [employeesData, depsData] = await Promise.all([
        modulesApi.getEmployees(query),
        modulesApi.getDepartments({ limit: 200, offset: 0 }),
      ]);
      setEmployees(employeesData);
      setDepartments(depsData);
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

  const filteredDepartments = useMemo(() => {
    const q = deptQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(q));
  }, [departments, deptQuery]);

  const selectedDepartmentsLabel = useMemo(() => {
    if (!selectedDepartmentIds.length) return 'Выбрать отделы (необязательно)';
    const picked = departments.filter((d) => selectedDepartmentIds.includes(d.id)).map((d) => d.name);
    return picked.length <= 2 ? picked.join(', ') : `${picked.slice(0, 2).join(', ')} +${picked.length - 2}`;
  }, [departments, selectedDepartmentIds]);

  const toggleDepartment = (departmentId: string): void => {
    setSelectedDepartmentIds((prev) => (
      prev.includes(departmentId) ? prev.filter((id) => id !== departmentId) : [...prev, departmentId]
    ));
  };

  const closeDeptPicker = (): void => {
    setDeptPickerOpen(false);
    setDeptQuery('');
  };

  const onProvision = async (): Promise<void> => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Проверьте поля', 'Заполните имя, фамилию, email и пароль');
      return;
    }
    if (password.trim().length < 8) {
      Alert.alert('Проверьте пароль', 'Минимум 8 символов');
      return;
    }

    setProvisioning(true);
    try {
      await modulesApi.provisionEmployeeAccount({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        position: position.trim() || null,
        department_ids: selectedDepartmentIds,
      });
      Alert.alert(
        'Сотрудник создан',
        `Передайте сотруднику данные для входа:\nЛогин: ${email.trim().toLowerCase()}\nПароль: ${password.trim()}`,
      );
      setFirstName('');
      setLastName('');
      setPosition('');
      setEmail('');
      setPassword('');
      setSelectedDepartmentIds([]);
      await load();
    } catch (error) {
      Alert.alert('Ошибка создания', error instanceof Error ? error.message : 'Не удалось создать сотрудника');
    } finally {
      setProvisioning(false);
    }
  };

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
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Создать сотрудника (HR)</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Имя"
              value={firstName}
              onChangeText={setFirstName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Фамилия"
              value={lastName}
              onChangeText={setLastName}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Должность (необязательно)"
              value={position}
              onChangeText={setPosition}
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={styles.deptBtn} onPress={() => setDeptPickerOpen(true)}>
              <Text style={styles.deptBtnText}>{selectedDepartmentsLabel}</Text>
              {selectedDepartmentIds.length ? (
                <Text style={styles.deptBtnMeta}>Выбрано: {selectedDepartmentIds.length}</Text>
              ) : null}
            </Pressable>
            <TextInput
              style={styles.searchInput}
              placeholder="Логин (email)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Временный пароль"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <Pressable style={styles.createBtn} onPress={() => void onProvision()} disabled={isProvisioning}>
              <Text style={styles.createBtnText}>{isProvisioning ? 'Создаю...' : 'Создать и выдать доступ'}</Text>
            </Pressable>
          </View>

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
              ListEmptyComponent={<Text style={styles.emptyText}>Отделы не найдены</Text>}
            />

            <Pressable style={styles.modalDone} onPress={closeDeptPicker}>
              <Text style={styles.modalDoneText}>Готово</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  deptBtn: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 2,
  },
  deptBtnText: { color: '#111827', fontWeight: '700' },
  deptBtnMeta: { color: '#6B7280', fontSize: 12 },
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
  createCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 8,
  },
  createTitle: { color: '#111827', fontWeight: '700' },
  createBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createBtnText: { color: '#FFFFFF', fontWeight: '700' },
  card: { borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 12, gap: 4 },
  name: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  role: { color: '#6B7280', fontSize: 13 },
  meta: { color: '#9CA3AF', fontSize: 12 },

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
