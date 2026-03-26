import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { Announcement } from '../types/api';

export const NewsScreen = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [items, setItems] = useState<Announcement[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [filter, setFilter] = useState<'all' | 'hr' | 'events'>('all');
  const [showComposer, setShowComposer] = useState(false);

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await modulesApi.getAnnouncements();
      setItems(data);
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

  const sorted = useMemo(
    () => [...items].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')),
    [items],
  );

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Новости</Text>
              <Text style={styles.subtitle}>Обновления от HR и команд</Text>
            </View>
            {isHr ? (
              <Pressable style={styles.plus} onPress={() => setShowComposer((v) => !v)}>
                <Text style={styles.plusText}>{showComposer ? '×' : '+'}</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.filters}>
            <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
            <Chip label="HR" active={filter === 'hr'} onPress={() => setFilter('hr')} />
            <Chip label="Events" active={filter === 'events'} onPress={() => setFilter('events')} />
          </View>

          {isHr && showComposer ? (
            <View style={styles.composer}>
              <Text style={styles.composerTitle}>Публикация новости</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Заголовок"
                placeholderTextColor={colors.textMuted}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                value={body}
                onChangeText={setBody}
                placeholder="Текст новости"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <Pressable style={styles.publishBtn} onPress={() => void createAnnouncement()} disabled={isSubmitting}>
                <Text style={styles.publishText}>{isSubmitting ? 'Публикую...' : 'Опубликовать'}</Text>
              </Pressable>
            </View>
          ) : null}

          {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

          {!isLoading && sorted.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Пока нет новостей</Text>
            </View>
          ) : null}

          {sorted.map((post, index) => (
            <Pressable
              key={post.id}
              style={[styles.post, index === 0 ? styles.postFeatured : styles.postUpdate]}
              onPress={() => Alert.alert(post.title, post.body)}
            >
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text numberOfLines={2} style={styles.postText}>
                {post.body}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <BottomPillNav activeRoute="News" />
      </View>
    </AppScreen>
  );
};

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
    <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  page: { flex: 1 },
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 12, backgroundColor: colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  subtitle: { ...typography.subtitle, fontFamily: fontFamilies.primary, color: colors.textSecondary, marginTop: 2 },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.surface, fontSize: 20, fontWeight: '700', fontFamily: fontFamilies.primary },
  filters: { flexDirection: 'row', gap: 8, width: '100%' },
  chip: { height: 34, borderRadius: 999, backgroundColor: colors.cardSoft, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '700' },
  chipTextActive: { color: colors.surface },
  composer: { borderRadius: 16, backgroundColor: colors.cardStrong, padding: 14, gap: 8 },
  composerTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  multiline: { minHeight: 84, textAlignVertical: 'top', paddingTop: 10 },
  publishBtn: { height: 44, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  publishText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface },
  emptyCard: { borderRadius: 16, backgroundColor: colors.cardSoft, padding: 14 },
  emptyText: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  post: { borderRadius: 16, padding: 14, gap: 6 },
  postFeatured: { backgroundColor: colors.cardStrong },
  postUpdate: { backgroundColor: colors.cardSoft },
  postTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  postText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
});
