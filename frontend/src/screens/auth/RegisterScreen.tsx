import React, { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { AuthStackParamList } from '../../navigation/types';
import { colors, gradients } from '../../theme/colors';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password || password !== confirmPassword) {
      return;
    }

    setSubmitting(true);
    try {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 350);
      });
      Alert.alert('Регистрация', `Аккаунт ${fullName.trim()} готов к созданию`);
      navigation.navigate('Login');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LinearGradient colors={gradients.registerPage} style={styles.page}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={gradients.register} style={styles.content} start={{ x: 0.4, y: 0 }} end={{ x: 0.85, y: 1 }}>
          <View style={styles.header}>
            <Text style={styles.title}>Регистрация</Text>
            <Text style={styles.sub}>Создайте аккаунт для доступа к HR-инструментам и корпоративному мессенджеру.</Text>
          </View>

          <View style={styles.form}>
            <InputField placeholder="Имя и фамилия" value={fullName} onChangeText={setFullName} />
            <InputField
              placeholder="Рабочий email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <InputField placeholder="Пароль" secureTextEntry value={password} onChangeText={setPassword} />
            <InputField
              placeholder="Подтверждение пароля"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.agreeWrap}>
            <View style={styles.check}><Text style={styles.checkMark}>✓</Text></View>
            <Text style={styles.agreeText}>Соглашаюсь с условиями обработки персональных данных</Text>
          </View>

          <PrimaryButton
            title="Создать аккаунт"
            onPress={handleRegister}
            color={colors.registerPrimary}
            disabled={submitting}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Уже есть аккаунт?</Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Войти</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  content: {
    width: '100%',
    maxWidth: 402,
    alignSelf: 'center',
    borderRadius: 20,
    gap: 18,
    padding: 24
  },
  header: {
    gap: 8
  },
  title: {
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
    gap: 12
  },
  agreeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.registerPrimary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkMark: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12
  },
  agreeText: {
    color: '#6A7591',
    fontSize: 12,
    lineHeight: 16,
    flex: 1
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
    color: colors.registerPrimary,
    fontSize: 14,
    fontWeight: '700'
  }
});
