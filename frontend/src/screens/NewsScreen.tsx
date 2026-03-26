import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { Announcement } from '../types/api';

export const NewsScreen = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [items, setItems] = useState<Announcement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await modulesApi.getAnnouncements();
      setItems(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
      }
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось получить объявления');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createAnnouncement = async (): Promise<void> => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Проверьте поля', 'Введите заголовок и текст новости');
      return;
    }
    setSubmitting(true);
    try {
      await modulesApi.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        is_global: true,
        department_ids: [],
      });
      setTitle('');
      setBody('');
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось опубликовать новость');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }

    (async () => {
      try {
        const detail = await modulesApi.getAnnouncement(selectedId);
        setSelected(detail);
        await modulesApi.markAnnouncementRead(selectedId);
      } catch (error) {
        Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось получить детали объявления');
      }
    })();
  }, [selectedId]);

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [items],
  );

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Новости</Text>

      {isHr ? (
        <View style={styles.createCard}>
          <Text style={styles.createTitle}>Публикация новости (HR)</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Заголовок"
            placeholderTextColor="#9CA3AF"
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={body}
            onChangeText={setBody}
            placeholder="Текст новости"
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <Pressable style={styles.publishBtn} onPress={() => void createAnnouncement()} disabled={isSubmitting}>
            <Text style={styles.publishText}>{isSubmitting ? 'Публикую...' : 'Опубликовать'}</Text>
          </Pressable>
        </View>
      ) : null}

      {isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

      {!isLoading && sorted.length === 0 ? (
        <View style={styles.details}>
          <Text style={styles.detailsText}>Пока нет объявлений</Text>
        </View>
      ) : null}

      {sorted.map((post) => (
        <Pressable key={post.id} style={[styles.post, selectedId === post.id && styles.postSelected]} onPress={() => setSelectedId(post.id)}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postDate}>{post.created_at ? new Date(post.created_at).toLocaleString() : 'Без даты'}</Text>
          <Text numberOfLines={2} style={styles.postText}>{post.body}</Text>
        </Pressable>
      ))}

      <View style={styles.details}>
        <Text style={styles.detailsTitle}>Детали объявления</Text>
        <Text style={styles.detailsText}>{selected?.body ?? 'Выберите объявление для просмотра полной версии'}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 12, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  post: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, gap: 6 },
  postSelected: { borderColor: '#FF6B6B', backgroundColor: '#FFF5F5' },
  postTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  postDate: { color: '#9CA3AF', fontSize: 12 },
  postText: { color: '#4B5563', fontSize: 13 },
  createCard: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, gap: 8 },
  createTitle: { color: '#111827', fontWeight: '700' },
  input: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    color: '#111827',
  },
  multiline: {
    minHeight: 84,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  publishBtn: { height: 42, borderRadius: 10, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  publishText: { color: '#FFFFFF', fontWeight: '700' },
  details: { borderRadius: 16, backgroundColor: '#FFF4F4', padding: 14, gap: 6 },
  detailsTitle: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
  detailsText: { color: '#7F1D1D', fontSize: 13 },
});
