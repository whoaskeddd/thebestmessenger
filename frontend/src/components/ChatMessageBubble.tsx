import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { ChatMessage } from '../types/models';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
}

export function ChatMessageBubble({ message, mine }: ChatMessageBubbleProps) {
  return (
    <View style={[styles.row, mine ? styles.mine : styles.other]}>
      {!mine ? <Text style={styles.sender}>{message.senderName}</Text> : null}
      <Text style={[styles.body, mine ? styles.mineText : styles.otherText]}>{message.body}</Text>
      <Text style={styles.time}>{new Date(message.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 4
  },
  mine: {
    alignSelf: 'flex-end',
    backgroundColor: colors.loginPrimary
  },
  other: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  sender: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  body: {
    fontSize: 14,
    lineHeight: 20
  },
  mineText: {
    color: '#FFFFFF'
  },
  otherText: {
    color: colors.textPrimary
  },
  time: {
    fontSize: 11,
    color: '#9AA6C0',
    alignSelf: 'flex-end'
  }
});
