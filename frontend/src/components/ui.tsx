import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  danger: '#FF6B6B',
  blue: '#4D6BFF',
  white: '#FFFFFF',
  border: '#E5E7EB',
  borderBlue: '#DCE7F7',
  soft: '#F6F7F8',
  bg: '#F8FBFF',
};

export const AppBackground = ({ children }: { children: ReactNode }) => (
  <LinearGradient
    colors={['#FFFFFF', '#EEF4FF']}
    start={{ x: 0.1, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.page}
  >
    {children}
  </LinearGradient>
);

export const Title = ({ children }: { children: ReactNode }) => (
  <Text style={styles.title}>{children}</Text>
);

export const SubTitle = ({ children }: { children: ReactNode }) => (
  <Text style={styles.subtitle}>{children}</Text>
);

export const Label = ({ children }: { children: ReactNode }) => (
  <Text style={styles.label}>{children}</Text>
);

export const InputField = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
}) => (
  <View style={styles.inputWrap}>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#98A4BE"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="none"
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

export const PrimaryButton = ({
  title,
  onPress,
  danger = true,
  disabled,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.button,
      { backgroundColor: danger ? colors.danger : colors.blue },
      pressed && styles.pressed,
      disabled && styles.disabled,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

export const LinkText = ({
  title,
  onPress,
  color = colors.blue,
  bold = true,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  bold?: boolean;
}) => (
  <Pressable onPress={onPress}>
    <Text style={[styles.link, { color, fontWeight: bold ? '700' : '600' }]}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#182033',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 8,
    color: '#5E6A85',
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    color: '#2A3552',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.borderBlue,
    borderRadius: 14,
    backgroundColor: colors.white,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
    color: '#1E293B',
    fontSize: 14,
    paddingVertical: 0,
  },
  button: {
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  link: {
    fontSize: 13,
  },
});
