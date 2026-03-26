import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { InputField, LinkText, PrimaryButton } from '../components/ui';
import { AppScreen } from '../components/layout/AppScreen';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = (_props: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setLoading] = useState(false);

  const onSubmit = async (): Promise<void> => {
    if (!email || !password) {
      Alert.alert('Ошибка', 'Введите email и пароль');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Вход не выполнен', error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>HR Connect</Text>
            <Text style={styles.subtitle}>Вход в систему отдела кадров</Text>
          </View>

          <View style={styles.formCard}>
            <InputField
              value={email}
              onChangeText={setEmail}
              placeholder="Логин"
              keyboardType="email-address"
            />
            <InputField
              value={password}
              onChangeText={setPassword}
              placeholder="Пароль"
              secureTextEntry
            />
            <Text style={styles.hint}>JWT-обновление выполняется автоматически</Text>
          </View>

          <PrimaryButton title="Войти" onPress={onSubmit} disabled={isLoading} />

          {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

          <View style={styles.footer}>
            <LinkText
              bold={false}
              title="Забыли пароль?"
              onPress={() => Alert.alert('MVP', 'Восстановление пароля будет добавлено позже')}
              color={colors.textSecondary}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 120,
    paddingBottom: 24,
    gap: 20,
  },
  header: {
    gap: 6,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
  },
  formCard: {
    borderRadius: 16,
    backgroundColor: colors.cardStrong,
    padding: 16,
    gap: 12,
    shadowColor: '#1B3A28',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  hint: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
  },
});
