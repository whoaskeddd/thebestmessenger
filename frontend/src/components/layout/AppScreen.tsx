import type { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../theme/colors';

export function AppScreen({
  children,
  style,
  contentStyle,
  edges = ['top', 'bottom'],
}: {
  children: ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}) {
  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  content: {
    flex: 1,
  },
});

