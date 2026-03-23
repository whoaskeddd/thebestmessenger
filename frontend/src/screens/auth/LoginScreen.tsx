import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AuthStackParamList } from '../../navigation/types';
import { colors, gradients } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('name@company.com');
  const [password, setPassword] = useState('password');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setSubmitting(true);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 350);
      });
      Alert.alert('Вход', `Запрос на вход отправлен для ${email.trim()}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={gradients.login} style={styles.page} start={{ x: 0.3, y: 0 }} end={{ x: 0.9, y: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.brand}>
            <Text style={styles.headline}>Вход в HR Connect</Text>
            <Text style={styles.sub}>Управляйте задачами отдела кадров и общайтесь с командой в одном приложении.</Text>
          </View>

          <View style={styles.form}>
            <InputField
              label="Рабочий email"
              placeholder="name@company.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <InputField
              label="Пароль"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <Pressable>
              <Text style={styles.forgot}>Забыли пароль?</Text>
            </Pressable>
          </View>

          <PrimaryButton title="Войти" onPress={handleLogin} color={colors.loginPrimary} disabled={submitting} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Нет аккаунта?</Text>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Зарегистрироваться</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  scrollContent: {
    minHeight: '100%',
    justifyContent: 'center',
    padding: 24
  },
  content: {
    gap: 24,
    borderRadius: 24,
    paddingVertical: 28
  },
  brand: {
    gap: 8
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700'
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20
  },
  form: {
    gap: 14
  },
  forgot: {
    color: colors.loginPrimary,
    fontSize: 13,
    fontWeight: '600'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6
  },
  footerText: {
    color: '#6A7591',
    fontSize: 14
  },
  footerLink: {
    color: colors.loginPrimary,
    fontSize: 14,
    fontWeight: '700'
  }
});
