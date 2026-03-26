import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';

import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

type Message = {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
};

const seedMessages: Message[] = [
  { id: '1', text: 'Привет! Подтверди, пожалуйста, время интервью.', fromMe: false, time: '10:12' },
  { id: '2', text: 'Отлично, отправь резюме и портфолио в чат.', fromMe: false, time: '10:13' },
  { id: '3', text: 'Подтверждаю, буду в 15:00.', fromMe: true, time: '10:14' },
];

export const ChatRoomScreen = ({ route, navigation }: Props) => {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(seedMessages);

  const chatName = route.params?.chatName ?? 'Чат';

  const send = (): void => {
    const text = draft.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `${Date.now()}`, text, fromMe: true, time }]);
    setDraft('');
  };

  const sorted = useMemo(() => messages, [messages]);

  return (
    <AppScreen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.head}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headTitle}>{chatName}</Text>
          <Pressable style={styles.infoBtn} onPress={() => Alert.alert('MVP', 'Информация о чате появится позже')}>
            <Text style={styles.infoText}>ⓘ</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {sorted.map((message) => (
            <View key={message.id} style={message.fromMe ? styles.outWrap : styles.inWrap}>
              <View style={message.fromMe ? styles.outBubble : styles.inBubble}>
                <Text style={message.fromMe ? styles.outText : styles.inText}>{message.text}</Text>
              </View>
              <Text style={styles.time}>{message.time}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <Text style={styles.pencil}>✎</Text>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={send}
          />
          <Pressable style={[styles.circleBtn, styles.attachBtn]} onPress={() => Alert.alert('MVP', 'Вложения появятся позже')}>
            <Text style={styles.circleText}>➤</Text>
          </Pressable>
          <Pressable style={[styles.circleBtn, styles.sendBtn]} onPress={send}>
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>

        <BottomPillNav activeRoute="Chats" />
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.pageBg },
  head: {
    height: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  headTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  infoBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoText: { color: colors.textSecondary, fontFamily: fontFamilies.primary, fontSize: 16 },
  messages: { gap: 10, flexGrow: 1, paddingHorizontal: 20, paddingBottom: 10 },
  inWrap: { alignSelf: 'flex-start', gap: 4 },
  outWrap: { alignSelf: 'flex-end', gap: 4, alignItems: 'flex-end' },
  inBubble: { maxWidth: 320, alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  inText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  time: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textMuted, fontSize: 11 },
  outBubble: { maxWidth: 320, backgroundColor: colors.cardStrong, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  outText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  composer: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  pencil: { color: colors.textMuted, fontFamily: fontFamilies.primary, fontSize: 14 },
  input: { flex: 1, color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 13, paddingVertical: 0 },
  circleBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  attachBtn: { backgroundColor: colors.actionBlue },
  sendBtn: { backgroundColor: colors.primary },
  circleText: { color: colors.surface, fontFamily: fontFamilies.primary, fontSize: 14 },
  sendText: { color: colors.surface, fontFamily: fontFamilies.primary, fontSize: 16, marginTop: -2 },
});
