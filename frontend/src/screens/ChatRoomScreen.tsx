import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Audio, type AVPlaybackStatus } from 'expo-av';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { ChatMessage } from '../types/api';
import { API_BASE_URL } from '../config';

type Props = NativeStackScreenProps<RootStackParamList, 'ChatRoom'>;

type ChatWsMessage =
  | ({ type: 'chat.message' } & ChatMessage)
  | ({ type: 'chat.read'; chatId: string; userId: string; readAt: string });

export const ChatRoomScreen = ({ route, navigation }: Props) => {
  const { user, tokens } = useAuth();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isVoiceSending, setVoiceSending] = useState(false);
  const [isRecording, setRecording] = useState(false);
  const [chatTitle, setChatTitle] = useState(route.params?.chatName ?? 'Чат');
  const scrollRef = useRef<ScrollView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  const chatId = route.params?.chatId;

  const load = async (): Promise<void> => {
    if (!chatId) return;
    try {
      setLoading(true);
      const [chat, chatMessages] = await Promise.all([
        modulesApi.getChat(chatId),
        modulesApi.getChatMessages(chatId, { limit: 100 }),
      ]);
      setChatTitle(chat.title || route.params?.chatName || 'Чат');
      setMessages(chatMessages);
      await modulesApi.markChatRead(chatId);
    } catch {
      // Keep UI stable if chat metadata fails temporarily.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !tokens?.access_token) return;

    const wsBase = API_BASE_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsBase}/ws/chats/${chatId}?token=${encodeURIComponent(tokens.access_token)}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as ChatWsMessage;
        if (payload.type === 'chat.message') {
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === payload.id)) return prev;
            return [...prev, payload];
          });
          if (payload.senderId !== user?.id) {
            void modulesApi.markChatRead(chatId);
          }
        }
      } catch {
        // Ignore malformed websocket events.
      }
    };

    ws.onopen = () => {
      void modulesApi.markChatRead(chatId);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [chatId, tokens?.access_token, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    return () => {
      const recording = recordingRef.current;
      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
      const sound = soundRef.current;
      if (sound) {
        void sound.unloadAsync().catch(() => undefined);
        soundRef.current = null;
      }
    };
  }, []);

  const send = async (): Promise<void> => {
    if (!chatId) return;
    const text = draft.trim();
    if (!text) return;

    setDraft('');
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat.message', body: text }));
      return;
    }

    try {
      const created = await modulesApi.sendChatMessage(chatId, text);
      setMessages((prev) => (prev.some((msg) => msg.id === created.id) ? prev : [...prev, created]));
      await modulesApi.markChatRead(chatId);
    } catch {
      // Restore draft if send failed via REST fallback.
      setDraft(text);
    }
  };

  const toggleVoiceRecording = async (): Promise<void> => {
    if (!chatId || isVoiceSending) return;

    if (isRecording) {
      const active = recordingRef.current;
      if (!active) {
        setRecording(false);
        return;
      }
      try {
        setVoiceSending(true);
        await active.stopAndUnloadAsync();
        const status = await active.getStatusAsync();
        const durationMillis = status.durationMillis ?? 0;
        const durationSeconds = Math.max(1, Math.round(durationMillis / 1000));
        const uri = active.getURI();
        recordingRef.current = null;
        setRecording(false);
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        if (!uri) return;

        const created = await modulesApi.sendVoiceMessage(chatId, {
          uri,
          durationSeconds,
          mimeType: 'audio/m4a',
          fileName: `voice-${Date.now()}.m4a`,
        });
        setMessages((prev) => (prev.some((msg) => msg.id === created.id) ? prev : [...prev, created]));
        await modulesApi.markChatRead(chatId);
      } catch {
        // Voice send failures are ignored to keep chat usable.
      } finally {
        setVoiceSending(false);
      }
      return;
    }

    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setRecording(true);
    } catch {
      setRecording(false);
      recordingRef.current = null;
    }
  };

  const playVoice = async (message: ChatMessage): Promise<void> => {
    if (message.messageType !== 'voice' || !message.voiceUrl) return;
    const hostBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const uri = message.voiceUrl.startsWith('http') ? message.voiceUrl : `${hostBase}${message.voiceUrl}`;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync({ uri });
      soundRef.current = sound;
      setPlayingMessageId(message.id);
      sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
        if (!status.isLoaded || status.didJustFinish) {
          setPlayingMessageId((prev) => (prev === message.id ? null : prev));
        }
      });
      await sound.playAsync();
    } catch {
      setPlayingMessageId(null);
    }
  };

  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages],
  );

  return (
    <AppScreen edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.page}>
        <View style={styles.head}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.headTitle} numberOfLines={1}>{chatTitle}</Text>
          <View style={styles.rightStub} />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} /> : null}

        <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled">
          {sorted.map((message) => {
            const fromMe = message.senderId === user?.id;
            return (
              <View key={message.id} style={fromMe ? styles.outWrap : styles.inWrap}>
                <View style={fromMe ? styles.outBubble : styles.inBubble}>
                  {!fromMe ? <Text style={styles.senderName}>{message.senderName}</Text> : null}
                  {message.messageType === 'voice' ? (
                    <Pressable style={styles.voiceBtn} onPress={() => void playVoice(message)}>
                      <Text style={styles.voiceBtnText}>
                        {playingMessageId === message.id
                          ? 'Воспроизводится...'
                          : `Голосовое${formatVoiceDuration(message.voiceDurationSeconds)}`}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={fromMe ? styles.outText : styles.inText}>{message.body ?? ''}</Text>
                  )}
                </View>
                <Text style={styles.time}>{formatTimeLabel(message.createdAt)}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composer}>
          <Pressable
            style={[styles.voiceRecordBtn, isRecording ? styles.voiceRecordBtnActive : null]}
            onPress={() => void toggleVoiceRecording()}
            disabled={isVoiceSending}
          >
            <Text style={styles.voiceRecordText}>{isRecording ? '■' : '●'}</Text>
          </Pressable>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder="Сообщение..."
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => void send()}
          />
          <Pressable style={styles.sendBtn} onPress={() => void send()}>
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatVoiceDuration(durationSeconds: number | null | undefined): string {
  if (!durationSeconds || durationSeconds <= 0) return '';
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return ` ${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.pageBg },
  head: {
    height: 56,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 22, marginTop: -2 },
  headTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700', flex: 1 },
  rightStub: { width: 36, height: 36 },
  messages: { gap: 10, flexGrow: 1, paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  inWrap: { alignSelf: 'flex-start', gap: 4 },
  outWrap: { alignSelf: 'flex-end', gap: 4, alignItems: 'flex-end' },
  inBubble: { maxWidth: 320, alignSelf: 'flex-start', backgroundColor: colors.surface, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  outBubble: { maxWidth: 320, backgroundColor: colors.cardStrong, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  senderName: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, marginBottom: 2 },
  inText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  outText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  voiceBtn: {
    borderRadius: 10,
    backgroundColor: colors.pageBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  voiceBtnText: {
    ...typography.caption,
    fontFamily: fontFamilies.primary,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  time: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textMuted, fontSize: 11 },
  composer: {
    minHeight: 56,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginHorizontal: 20,
    marginBottom: 21,
  },
  input: { flex: 1, color: colors.textPrimary, fontFamily: fontFamilies.primary, fontSize: 13, paddingVertical: 0 },
  voiceRecordBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  voiceRecordBtnActive: {
    backgroundColor: '#ffe5e5',
    borderColor: '#e04f4f',
  },
  voiceRecordText: {
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
    fontSize: 14,
    lineHeight: 14,
  },
  sendBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendText: { color: colors.surface, fontFamily: fontFamilies.primary, fontSize: 16, marginTop: -2 },
});
