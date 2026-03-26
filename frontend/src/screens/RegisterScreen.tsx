import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppBackground, InputField, LinkText, PrimaryButton, SubTitle, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import type { UserRole } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: Props) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [isLoading, setLoading] = useState(false);

  const onSubmit = async (): Promise<void> => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 8 символов');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      await register(email.trim(), password, role);
    } catch (error) {
      Alert.alert('Регистрация не выполнена', error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.content}>
          <View>
            <Title>Регистрация</Title>
            <SubTitle>
              Создайте аккаунт для доступа к HR-инструментам и корпоративному мессенджеру.
            </SubTitle>
          </View>

          <View style={styles.form}>
            <InputField value={email} onChangeText={setEmail} placeholder="Рабочий email" keyboardType="email-address" />
            <InputField value={password} onChangeText={setPassword} placeholder="Пароль" secureTextEntry />
            <InputField value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Подтверждение пароля" secureTextEntry />
            <View style={styles.rolesRow}>
              <RoleChip label="Сотрудник" active={role === 'employee'} onPress={() => setRole('employee')} />
              <RoleChip label="HR" active={role === 'hr'} onPress={() => setRole('hr')} />
            </View>
          </View>

          <View style={styles.agreeRow}>
            <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
            <Text style={styles.agreeText}>Соглашаюсь с условиями обработки персональных данных</Text>
          </View>

          <PrimaryButton title="Создать аккаунт" onPress={onSubmit} disabled={isLoading} />
          {isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <LinkText title="Войти" onPress={() => navigation.navigate('Login')} color="#FF6B6B" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const RoleChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable style={[styles.roleChip, active && styles.roleChipActive]} onPress={onPress}>
    <Text style={[styles.roleChipText, active && styles.roleChipTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 118,
    gap: 18,
  },
  form: {
    gap: 12,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleChip: {
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F6F7F8',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  roleChipActive: {
    backgroundColor: '#FF6B6B',
  },
  roleChipText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  agreeText: {
    color: '#6A7591',
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: '#6A7591',
    fontSize: 14,
  },
});
