import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Employee } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { user, reloadMe } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [phone, setPhone] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isMissingProfile, setMissingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [position, setPosition] = useState('');

  const isHr = user?.role === 'hr' || user?.role === 'admin';

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      setMissingProfile(false);
      const me = await modulesApi.getMyEmployee();
      setEmployee(me);
      setPhone(me.phone ?? '');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Не удалось загрузить профиль';
      if (msg.includes('employee profile not found')) {
        setEmployee(null);
        setMissingProfile(true);
        return;
      }
      Alert.alert('Ошибка', msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onSavePhone = async (): Promise<void> => {
    if (!employee) return;
    setSaving(true);
    try {
      const next = await modulesApi.updateMyEmployee({ phone: phone.trim() || null });
      setEmployee(next);
      setPhone(next.phone ?? '');
      await reloadMe();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось сохранить номер');
    } finally {
      setSaving(false);
    }
  };

  const onCreateProfile = async (): Promise<void> => {
    if (!user?.id) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Проверьте поля', 'Введите имя и фамилию');
      return;
    }
    setSaving(true);
    try {
      const created = await modulesApi.createEmployee({
        user_id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: null,
        work_email: user.email,
        phone: phone.trim() || null,
        position: position.trim() || null,
        hire_date: null,
        department_ids: [],
      });
      setEmployee(created);
      setMissingProfile(false);
      setPhone(created.phone ?? '');
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось создать профиль');
    } finally {
      setSaving(false);
    }
  };

  const name = useMemo(() => {
    if (!employee) return '—';
    return [employee.first_name, employee.middle_name, employee.last_name].filter(Boolean).join(' ');
  }, [employee]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Профиль</Text>
          <View style={{ width: 36 }} />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

        {!isLoading && !employee ? (
          <View style={styles.infoCard}>
            <Text style={styles.meta}>
              {isMissingProfile
                ? 'Профиль сотрудника ещё не создан. Обратитесь в HR, чтобы вам оформили карточку сотрудника.'
                : 'Профиль сотрудника не найден'}
            </Text>
          </View>
        ) : null}

        {!isLoading && isMissingProfile ? (
          <View style={styles.profileCard}>
            <Text style={styles.name}>{user?.email ?? '—'}</Text>
            <Text style={styles.role}>{roleLabel(user?.role ?? null)}</Text>
            {isHr ? (
              <View style={{ marginTop: 10, gap: 10 }}>
                <Text style={styles.sectionTitle}>Создать профиль</Text>
                <View style={styles.row2}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Имя"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Фамилия"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={position}
                  onChangeText={setPosition}
                  placeholder="Должность (необязательно)"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Телефон (необязательно)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
                <Pressable style={styles.saveBtn} onPress={() => void onCreateProfile()} disabled={isSaving}>
                  <Text style={styles.saveText}>{isSaving ? 'Создаю…' : 'Создать профиль'}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {!isLoading && employee ? (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.name}>{name || 'Сотрудник'}</Text>
              <Text style={styles.role}>{employee.position ?? roleLabel(user?.role ?? null)}</Text>
              <Text style={styles.meta}>{employee.work_email ?? user?.email ?? '—'}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Телефон</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+7 (900) 000-00-00"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
              <Pressable style={styles.saveBtn} onPress={() => void onSavePhone()} disabled={isSaving}>
                <Text style={styles.saveText}>{isSaving ? 'Сохраняю…' : 'Сохранить'}</Text>
              </Pressable>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.sectionTitle}>Отделы</Text>
              <Text style={styles.meta}>
                {(employee.departments ?? []).map((d) => d.name).join(', ') || '—'}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
};

function roleLabel(role: string | null): string {
  if (!role) return 'Сотрудник';
  if (role === 'admin') return 'Администратор';
  if (role === 'hr') return 'HR менеджер';
  if (role === 'manager') return 'Руководитель';
  return 'Сотрудник';
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 32, gap: 16, backgroundColor: colors.pageBg },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontSize: 24 },
  profileCard: { borderRadius: 16, backgroundColor: colors.cardSoft, padding: 14, gap: 6 },
  infoCard: { borderRadius: 16, backgroundColor: colors.primarySoft, padding: 14, gap: 10 },
  name: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  role: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '600' },
  meta: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  sectionTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  row2: { flexDirection: 'row', gap: 10 },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  saveBtn: { height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface },
});
