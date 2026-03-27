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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
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
              <View style={styles.composerActions}>
                <Pressable style={styles.publishBtn} onPress={() => void createAnnouncement()} disabled={isSubmitting}>
                  <Text style={styles.publishText}>{isSubmitting ? 'Публикую...' : 'Опубликовать'}</Text>
                </Pressable>
              </View>
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

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flex: 1 },
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 12, backgroundColor: colors.pageBg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  subtitle: { ...typography.subtitle, fontFamily: fontFamilies.primary, color: colors.textSecondary, marginTop: 2 },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center' },
  plusText: { color: colors.surface, fontSize: 20, fontWeight: '700', fontFamily: fontFamilies.primary },
  composer: { borderRadius: 16, backgroundColor: colors.cardStrong, padding: 14, gap: 8, position: 'relative', zIndex: 2, elevation: 2 },
  composerTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: 10, paddingBottom: 12 },
  composerActions: { marginTop: 4 },
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
