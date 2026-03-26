import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Department, Employee } from '../types/api';
import { apiDateToDisplayDate } from '../utils/date';
import { validatePassword } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeCard'>;

export const EmployeeCardScreen = ({ route, navigation }: Props) => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setLoading] = useState(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [isDeptPickerOpen, setDeptPickerOpen] = useState(false);
  const [deptQuery, setDeptQuery] = useState('');
  const [isSavingDepartments, setSavingDepartments] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [position, setPosition] = useState('');
  const [phone, setPhone] = useState('');
  const [isSavingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        if (isHr) {
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
          return;
        }

        const profile = await modulesApi.getMyEmployee();
        setEmployee(profile);
      } catch (error) {
        Alert.alert('Ошибка загрузки', error instanceof Error ? error.message : 'Не удалось получить карточку сотрудника');
      } finally {
        setLoading(false);
      }
    })();
  }, [isHr, route.params?.employeeId]);

  useEffect(() => {
    if (!employee || isHr) return;
    setFirstName(employee.first_name ?? '');
    setLastName(employee.last_name ?? '');
    setMiddleName(employee.middle_name ?? '');
    setPosition(employee.position ?? '');
    setPhone(employee.phone ?? '');
  }, [employee, isHr]);

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
    setSavingDepartments(true);
    try {
      const updated = await modulesApi.updateEmployee(employee.id, { department_ids: selectedDepartmentIds });
      setEmployee(updated);
      closeDeptPicker();
      Alert.alert('Успешно', 'Отделы обновлены');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось обновить отделы');
    } finally {
      setSavingDepartments(false);
    }
  };

  const saveMyProfile = async (): Promise<void> => {
    if (!employee) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Проверьте поля', 'Имя и фамилия обязательны');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await modulesApi.updateMyEmployee({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        position: position.trim() || null,
        phone: phone.trim() || null,
      });
      setEmployee(updated);
      Alert.alert('Успешно', 'Данные сотрудника сохранены');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось сохранить данные сотрудника');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (): Promise<void> => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Проверьте поля', 'Заполните все поля для смены пароля');
      return;
    }
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Проверьте пароль', passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Проверьте поле', 'Подтверждение пароля не совпадает');
      return;
    }

    setChangingPassword(true);
    try {
      await modulesApi.changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Успешно', 'Пароль изменён');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось сменить пароль');
    } finally {
      setChangingPassword(false);
    }
  };

  const title = isHr ? 'Карточка сотрудника' : 'Мой профиль';

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

        {!isLoading && !employee ? (
          <View style={styles.infoCard}>
            <Text style={styles.meta}>{isHr ? 'Сотрудники пока не добавлены' : 'Профиль сотрудника не найден'}</Text>
          </View>
        ) : null}

        {employee ? (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.name}>{employee.first_name} {employee.last_name}</Text>
              <Text style={styles.role}>{employee.position ?? 'Сотрудник'}</Text>
              <Text style={styles.meta}>{employee.work_email ?? '—'}</Text>
              <Text style={styles.meta}>{employee.phone ?? 'Телефон не указан'}</Text>
              <Text style={styles.meta}>Дата найма: {apiDateToDisplayDate(employee.hire_date)}</Text>
            </View>

            {isHr ? (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.meta}>Отдел: {(employee.departments ?? []).map((dep) => dep.name).join(', ') || 'Не назначен'}</Text>
                  <Text style={styles.meta}>Руководитель: —</Text>
                  <Pressable style={styles.deptEditLink} onPress={() => setDeptPickerOpen(true)}>
                    <Text style={styles.deptEditText}>Изменить отделы</Text>
                  </Pressable>
                </View>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.action, styles.actionPrimary]}
                    onPress={() => navigation.navigate('ChatRoom', { chatId: employee.user_id ?? employee.id, chatName: `${employee.first_name} ${employee.last_name}` })}
                  >
                    <Text style={[styles.actionText, styles.actionTextPrimary]}>Написать</Text>
                  </Pressable>
                  <Pressable style={[styles.action, styles.actionOutline]} onPress={() => Alert.alert('MVP', 'Звонки появятся позже')}>
                    <Text style={[styles.actionText, styles.actionTextOutline]}>Позвонить</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.editCard}>
                  <Text style={styles.sectionTitle}>Личные данные</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Имя"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Фамилия"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    value={middleName}
                    onChangeText={setMiddleName}
                    placeholder="Отчество (необязательно)"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    value={position}
                    onChangeText={setPosition}
                    placeholder="Должность"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Телефон"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                  />

                  <Pressable style={styles.saveBtn} onPress={() => void saveMyProfile()} disabled={isSavingProfile}>
                    <Text style={styles.saveBtnText}>{isSavingProfile ? 'Сохраняю...' : 'Сохранить данные'}</Text>
                  </Pressable>
                </View>

                <View style={styles.editCard}>
                  <Text style={styles.sectionTitle}>Смена пароля</Text>
                  <TextInput
                    style={styles.input}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Текущий пароль"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Новый пароль"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Повторите новый пароль"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                  />

                  <Pressable style={styles.passwordBtn} onPress={() => void changePassword()} disabled={isChangingPassword}>
                    <Text style={styles.passwordBtnText}>{isChangingPassword ? 'Сохраняю...' : 'Сменить пароль'}</Text>
                  </Pressable>
                </View>
              </>
            )}
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
                ListEmptyComponent={<Text style={styles.meta}>Отделы не найдены</Text>}
              />

              <Pressable style={styles.modalDone} onPress={() => void saveDepartments()} disabled={isSavingDepartments}>
                <Text style={styles.modalDoneText}>{isSavingDepartments ? 'Сохраняю...' : 'Сохранить'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16, backgroundColor: colors.pageBg },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontSize: 24 },
  sectionTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  profileCard: { borderRadius: 16, backgroundColor: colors.cardSoft, padding: 14, gap: 6 },
  infoCard: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 14, gap: 6 },
  editCard: { borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 10 },
  name: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  role: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '600' },
  meta: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  saveBtn: { height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface, fontWeight: '700' },
  passwordBtn: { height: 44, borderRadius: 12, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center' },
  passwordBtnText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface, fontWeight: '700' },
  deptEditLink: { marginTop: 6, alignSelf: 'flex-start' },
  deptEditText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.actionBlue, fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  action: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: colors.primary },
  actionOutline: { backgroundColor: colors.pageBg, borderWidth: 1, borderColor: colors.border },
  actionText: { ...typography.button, fontFamily: fontFamilies.primary },
  actionTextPrimary: { color: colors.surface },
  actionTextOutline: { color: colors.textPrimary },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20, justifyContent: 'center' },
  modalCard: { maxHeight: '80%', borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '800' },
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
