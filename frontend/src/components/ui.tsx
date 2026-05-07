import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';

export const AppBackground = ({ children }: { children: ReactNode }) => (
  <View style={styles.page}>{children}</View>
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
      placeholderTextColor={colors.textMuted}
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
  danger = false,
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
      { backgroundColor: danger ? colors.danger : colors.primary },
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
  color = colors.actionBlue,
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
    backgroundColor: colors.pageBg,
  },
  title: {
    ...typography.title,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
  },
  label: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: {
    ...typography.body,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
    fontFamily: fontFamilies.primary,
    color: colors.surface,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.5,
  },
  link: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
  },
});
