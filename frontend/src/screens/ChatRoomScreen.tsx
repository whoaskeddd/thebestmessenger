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
} from 'react-native';

import type { RootStackParamList } from '../navigation/types';

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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <View style={styles.head}>
        <View style={styles.left}>
          <Pressable style={styles.circleBtn} onPress={() => navigation.goBack()}><Text style={styles.circleText}>‹</Text></Pressable>
          <View style={styles.avatar} />
          <View>
            <Text style={styles.name}>{chatName}</Text>
            <Text style={styles.role}>Online</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.messages}>
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
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Сообщение..."
          placeholderTextColor="#9CA3AF"
          onSubmitEditing={send}
        />
        <Pressable style={[styles.circleBtn, styles.sendBtn]} onPress={send}>
          <Text style={styles.sendText}>➤</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  circleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F6F7F8', alignItems: 'center', justifyContent: 'center' },
  circleText: { color: '#1A1A1A', fontSize: 13 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE3E5' },
  name: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  role: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  messages: { gap: 10, flexGrow: 1 },
  inWrap: { alignSelf: 'flex-start', gap: 4 },
  outWrap: { alignSelf: 'flex-end', gap: 4, alignItems: 'flex-end' },
  inBubble: { maxWidth: 320, alignSelf: 'flex-start', backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  inText: { color: '#1A1A1A', fontSize: 14 },
  time: { color: '#9CA3AF', fontSize: 11 },
  outBubble: { maxWidth: 320, backgroundColor: '#FF6B6B', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  outText: { color: '#FFFFFF', fontSize: 14 },
  composer: {
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  input: { flex: 1, color: '#111827', fontSize: 14 },
  sendBtn: { backgroundColor: '#FF6B6B' },
  sendText: { color: '#FFFFFF' },
});
