import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { AppBackground, InputField, Label, LinkText, PrimaryButton, SubTitle, Title } from '../components/ui';
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
    <AppBackground>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.content}>
          <View>
            <Title>Вход в HR Connect</Title>
            <SubTitle>
              Управляйте задачами отдела кадров и общайтесь с командой в одном приложении.
            </SubTitle>
          </View>

          <View style={styles.form}>
            <View>
              <Label>Рабочий email</Label>
              <InputField
                value={email}
                onChangeText={setEmail}
                placeholder="name@company.com"
                keyboardType="email-address"
              />
            </View>

            <View>
              <Label>Пароль</Label>
              <InputField
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />
            </View>

            <LinkText title="Забыли пароль?" onPress={() => Alert.alert('MVP', 'Восстановление пароля будет добавлено позже')} />
          </View>

          <PrimaryButton title="Войти" onPress={onSubmit} danger={false} disabled={isLoading} />

          {isLoading ? <ActivityIndicator color="#4D6BFF" /> : null}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Доступ выдаёт HR-отдел. Обратитесь к HR за логином и паролем.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </AppBackground>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 150,
    paddingBottom: 28,
    gap: 24,
  },
  form: {
    gap: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  footerText: {
    color: '#6A7591',
    fontSize: 14,
  },
});
