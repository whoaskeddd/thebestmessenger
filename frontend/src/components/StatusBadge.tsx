import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LeaveStatus } from '../types/models';

const badgeByStatus: Record<LeaveStatus, { text: string; bg: string; color: string }> = {
  pending: { text: 'На согласовании', bg: '#FFF8E8', color: '#A06A00' },
  approved: { text: 'Согласовано', bg: '#E9F9F0', color: '#0C7A46' },
  rejected: { text: 'Отклонено', bg: '#FFEDED', color: '#AD2A2A' }
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const badge = badgeByStatus[status];

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}> 
      <Text style={[styles.text, { color: badge.color }]}>{badge.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start'
  },
  text: {
    fontSize: 12,
    fontWeight: '600'
  }
});
