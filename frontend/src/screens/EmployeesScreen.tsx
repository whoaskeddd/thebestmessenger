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
import { AppScreen } from '../components/layout/AppScreen';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Department, Employee } from '../types/api';
import { apiDateToDisplayDate, displayDateToApiDate, formatDateInput } from '../utils/date';
import { validateEmail, validatePassword } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'Employees'>;

export const EmployeesScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isHr = user?.role === 'hr' || isAdmin;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isProvisioning, setProvisioning] = useState(false);
  const [search, setSearch] = useState('');
  const [showProvision, setShowProvision] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');
  const [hireDate, setHireDate] = useState('');
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
    if (isAdmin) {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Проверьте поля', 'Заполните email и пароль');
        return;
      }
      const emailError = validateEmail(email);
      if (emailError) {
        Alert.alert('Проверьте email', emailError);
        return;
      }
      const passwordError = validatePassword(password.trim());
      if (passwordError) {
        Alert.alert('Проверьте пароль', passwordError);
        return;
      }

      setProvisioning(true);
      try {
        const created = await modulesApi.createUserByAdmin({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role: 'hr',
        });
        Alert.alert(
          'HR создан',
          `Новый HR:\nЛогин: ${created.email}\nПароль: ${password.trim()}`,
        );
        setEmail('');
        setPassword('');
      } catch (error) {
        Alert.alert('Ошибка создания', error instanceof Error ? error.message : 'Не удалось создать HR');
      } finally {
        setProvisioning(false);
      }
      return;
    }

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Проверьте поля', 'Заполните имя, фамилию, email и пароль');
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      Alert.alert('Проверьте email', emailError);
      return;
    }
    const passwordError = validatePassword(password.trim());
    if (passwordError) {
      Alert.alert('Проверьте пароль', passwordError);
      return;
    }
    const apiHireDate = hireDate.trim() ? displayDateToApiDate(hireDate.trim()) : null;
    if (hireDate.trim() && !apiHireDate) {
      Alert.alert('Проверьте дату', 'Дата найма должна быть в формате ДД.ММ.ГГГГ и быть корректной');
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
        hire_date: apiHireDate,
        department_ids: selectedDepartmentIds,
      });
      Alert.alert(
        'Сотрудник создан',
        `Передайте сотруднику данные для входа:\nЛогин: ${email.trim().toLowerCase()}\nПароль: ${password.trim()}`,
      );
      setFirstName('');
      setLastName('');
      setPosition('');
      setHireDate('');
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
    <AppScreen>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Сотрудники</Text>
            <Text style={styles.subtitle}>Справочник по командам и отделам</Text>
          </View>
          {isHr ? (
            <Pressable style={styles.plus} onPress={() => setShowProvision((v) => !v)}>
              <Text style={styles.plusText}>{showProvision ? '×' : '+'}</Text>
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {!isHr ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Раздел доступен только для HR</Text>
          </View>
        ) : null}

        {!isHr ? null : (
          <>
            {showProvision ? (
              <View style={styles.createCard}>
                <Text style={styles.createTitle}>{isAdmin ? 'Создать HR' : 'Создать сотрудника'}</Text>
                {!isAdmin ? (
                  <>
                    <View style={styles.row2}>
                      <TextInput
                        style={styles.input}
                        placeholder="Имя"
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholderTextColor={colors.textMuted}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Фамилия"
                        value={lastName}
                        onChangeText={setLastName}
                        placeholderTextColor={colors.textMuted}
                      />
                    </View>
                    <TextInput
                      style={styles.input}
                      placeholder="Должность (необязательно)"
                      value={position}
                      onChangeText={setPosition}
                      placeholderTextColor={colors.textMuted}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Дата найма (ДД.ММ.ГГГГ)"
                      value={hireDate}
                      onChangeText={(value) => setHireDate(formatDateInput(value))}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                    />
                    <Pressable style={styles.deptBtn} onPress={() => setDeptPickerOpen(true)}>
                      <Text style={styles.deptBtnText}>{selectedDepartmentsLabel}</Text>
                      {selectedDepartmentIds.length ? (
                        <Text style={styles.deptBtnMeta}>Выбрано: {selectedDepartmentIds.length}</Text>
                      ) : null}
                    </Pressable>
                  </>
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder={isAdmin ? 'Логин HR (email)' : 'Логин (email)'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={isAdmin ? 'Пароль HR' : 'Временный пароль'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  placeholderTextColor={colors.textMuted}
                />
                <Pressable style={styles.createBtn} onPress={() => void onProvision()} disabled={isProvisioning}>
                  <Text style={styles.createBtnText}>
                    {isProvisioning ? 'Создаю...' : isAdmin ? 'Создать HR' : 'Создать и выдать доступ'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.searchWrap}>
              <TextInput
                style={styles.search}
                placeholder="Поиск по имени или должности"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={() => void load(search)}
              />

            </View>

            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

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
                <Text style={styles.role}>{employee.position ?? 'Сотрудник'}</Text>
                <Text style={styles.role}>Дата найма: {apiDateToDisplayDate(employee.hire_date)}</Text>
                <View style={styles.tags}>
                  {(employee.departments ?? []).slice(0, 2).map((dep) => (
                    <View key={dep.id} style={styles.tag}>
                      <Text style={styles.tagText}>{dep.name}</Text>
                    </View>
                  ))}
                  {!employee.departments?.length ? (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>—</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </>
        )}

        <Modal visible={isDeptPickerOpen && !isAdmin} transparent animationType="fade" onRequestClose={closeDeptPicker}>
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
                placeholderTextColor={colors.textMuted}
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
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 32, gap: 14, backgroundColor: colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontSize: 24 },
  subtitle: { ...typography.subtitle, fontFamily: fontFamilies.primary, color: colors.textSecondary, marginTop: 2 },
  plus: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.surface, fontSize: 18, fontWeight: '700', fontFamily: fontFamilies.primary, marginTop: -1 },
  searchWrap: { gap: 10 },
  search: {
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
    fontSize: 13,
  },
  deptBtn: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 2,
  },
  deptBtnText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  deptBtnMeta: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  emptyCard: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 14 },
  emptyText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  createCard: {
    borderRadius: 16,
    backgroundColor: colors.cardStrong,
    padding: 14,
    gap: 8,
  },
  createTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  createBtn: { height: 44, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  createBtnText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface },
  card: { borderRadius: 16, backgroundColor: colors.cardSoft, padding: 14, gap: 4 },
  name: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  role: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  tags: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  tag: { height: 24, borderRadius: 999, backgroundColor: colors.primarySoft, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  tagText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20, justifyContent: 'center' },
  modalCard: { maxHeight: '80%', borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '800', fontSize: 16 },
  modalClose: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primarySoft },
  modalCloseText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  modalSearch: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    marginBottom: 8,
  },
  deptRowChecked: { backgroundColor: colors.cardSoft },
  deptName: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '800' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: { borderColor: colors.primary, backgroundColor: colors.primary },
  checkboxText: { color: colors.surface, fontWeight: '900', fontSize: 14, marginTop: -2 },
  modalDone: { height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  modalDoneText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface, fontWeight: '800' },
});
