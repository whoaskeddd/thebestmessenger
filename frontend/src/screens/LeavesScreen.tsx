import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { modulesApi } from '../api/modules';
import { AppScreen } from '../components/layout/AppScreen';
import { BottomPillNav } from '../components/navigation/BottomPillNav';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { fontFamilies, typography } from '../theme/typography';
import type { LeaveRequest, LeaveRequestType } from '../types/api';

const DEFAULT_TYPE: LeaveRequestType = 'vacation';

export const LeavesScreen = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  const [requestType, setRequestType] = useState<LeaveRequestType>(DEFAULT_TYPE);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await modulesApi.getLeaveRequests();
      setItems(data);
      if (isHr) {
        try {
          await modulesApi.markLeaveRequestsRead();
        } catch {
          // ignore mark-read errors
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить заявки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submit = async (): Promise<void> => {
    if (isHr) return;
    if (!startDate || !endDate) {
      Alert.alert('Проверьте поля', 'Введите дату начала и окончания в формате YYYY-MM-DD');
      return;
    }

    setSubmitting(true);
    try {
      await modulesApi.createLeaveRequest({
        request_type: requestType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim() || null,
      });
      setStartDate('');
      setEndDate('');
      setReason('');
      await load();
    } catch (error) {
      Alert.alert('Ошибка создания', error instanceof Error ? error.message : 'Не удалось создать заявку');
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (requestId: string): Promise<void> => {
    try {
      await modulesApi.approveLeaveRequest(requestId, reviewComment.trim() || null);
      setReviewComment('');
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось согласовать заявку');
    }
  };

  const reject = async (requestId: string): Promise<void> => {
    const comment = reviewComment.trim();
    if (!comment) {
      Alert.alert('Проверьте поля', 'Для отклонения нужен комментарий HR');
      return;
    }
    try {
      await modulesApi.rejectLeaveRequest(requestId, comment);
      setReviewComment('');
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось отклонить заявку');
    }
  };

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.headRow}>
            <Text style={styles.title}>Отпуска и заявки</Text>
            <Pressable style={styles.iconBtn} onPress={() => Alert.alert('MVP', 'Фильтры появятся позже')}>
              <Text style={styles.iconText}>≡</Text>
            </Pressable>
          </View>

          {!isHr ? (
            <View style={styles.newReq}>
              <Text style={styles.sectionTitle}>Новая заявка</Text>

              <View style={styles.fieldRow}>
                <Field value={startDate} onChangeText={setStartDate} placeholder="Дата начала" />
                <Field value={endDate} onChangeText={setEndDate} placeholder="Дата окончания" />
              </View>

              <View style={styles.typesRow}>
                <TypeChip label="Отпуск" active={requestType === 'vacation'} onPress={() => setRequestType('vacation')} />
                <TypeChip label="Отгул" active={requestType === 'day_off'} onPress={() => setRequestType('day_off')} />
                <TypeChip label="Больничный" active={requestType === 'sick'} onPress={() => setRequestType('sick')} />
              </View>

              <Field value={reason} onChangeText={setReason} placeholder="Причина (необязательно)" />

              <Pressable style={styles.createBtn} onPress={() => void submit()} disabled={isSubmitting}>
                <Text style={styles.createBtnText}>{isSubmitting ? 'Отправка...' : 'Создать заявку'}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.newReq}>
              <Text style={styles.sectionTitle}>Панель HR</Text>
              <Field value={reviewComment} onChangeText={setReviewComment} placeholder="Комментарий для решения по заявкам" />
            </View>
          )}

          <View style={styles.history}>
            <Text style={styles.sectionTitle}>История</Text>

            {isLoading ? <ActivityIndicator color={colors.primary} /> : null}

            {!isLoading && items.length === 0 ? (
              <Text style={styles.empty}>Пока нет заявок</Text>
            ) : null}

            {items.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyTitle}>{typeLabel[item.request_type] ?? item.request_type}</Text>
                    <Text style={styles.historyMeta}>{formatPeriod(item.start_date, item.end_date)}</Text>
                  </View>
                  <Text style={[styles.status, statusColor[item.status] ?? styles.statusDefault]}>
                    {statusLabel[item.status] ?? item.status}
                  </Text>
                </View>
                {isHr && item.status === 'submitted' ? (
                  <View style={styles.reviewRow}>
                    <Pressable style={styles.approveBtn} onPress={() => void approve(item.id)}>
                      <Text style={styles.reviewText}>Одобрить</Text>
                    </Pressable>
                    <Pressable style={styles.rejectBtn} onPress={() => void reject(item.id)}>
                      <Text style={styles.reviewText}>Отклонить</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>

        <BottomPillNav activeRoute="Leaves" />
      </View>
    </AppScreen>
  );
};

const TypeChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <Pressable style={[styles.typeChip, active && styles.typeChipActive]} onPress={onPress}>
    <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{label}</Text>
  </Pressable>
);

const Field = ({ value, onChangeText, placeholder }: { value: string; onChangeText: (value: string) => void; placeholder: string }) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    style={styles.field}
    placeholderTextColor={colors.textMuted}
    autoCapitalize="none"
  />
);

const styles = StyleSheet.create({
  page: { flex: 1 },
  wrap: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 120, gap: 14, backgroundColor: colors.pageBg },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.textSecondary, fontSize: 18, fontFamily: fontFamilies.primary },
  sectionTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  newReq: { borderRadius: 16, backgroundColor: colors.cardStrong, padding: 14, gap: 10 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  typesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  typeChipActive: {
    backgroundColor: colors.primary,
  },
  typeChipText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary, fontWeight: '700' },
  typeChipTextActive: { color: colors.surface },
  field: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    justifyContent: 'center',
    color: colors.textPrimary,
    fontFamily: fontFamilies.primary,
  },
  createBtn: { height: 46, borderRadius: 12, backgroundColor: colors.actionBlue, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface },
  history: { borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 10 },
  empty: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  historyItem: { paddingVertical: 6 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  historyMeta: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
  status: { ...typography.caption, fontFamily: fontFamilies.primary, fontWeight: '700' },
  statusOk: { color: colors.textSecondary },
  statusBad: { color: colors.danger },
  statusSubmitted: { color: colors.actionBlue },
  statusCanceled: { color: colors.textMuted },
  statusDefault: { color: colors.textSecondary },
  reviewRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  approveBtn: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { flex: 1, height: 38, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  reviewText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface, fontSize: 13 },
});

const statusColor = {
  approved: styles.statusOk,
  rejected: styles.statusBad,
  submitted: styles.statusSubmitted,
  canceled: styles.statusCanceled,
};

const statusLabel: Record<string, string> = {
  approved: 'Одобрено',
  rejected: 'Отклонено',
  submitted: 'На согласовании',
  canceled: 'Отменено',
};

const typeLabel: Record<string, string> = {
  vacation: 'Отпуск',
  day_off: 'Отгул',
  sick: 'Больничный',
};

function formatPeriod(start: string, end: string): string {
  if (!start && !end) return '—';
  if (!end) return start;
  return `${start} — ${end}`;
}
