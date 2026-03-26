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
import { useAuth } from '../context/AuthContext';
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
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Отпуска и заявки</Text>

      {!isHr ? (
        <View style={styles.newReq}>
          <Text style={styles.sectionTitle}>Новая заявка</Text>

          <View style={styles.typesRow}>
            <TypeChip label="Отпуск" active={requestType === 'vacation'} onPress={() => setRequestType('vacation')} />
            <TypeChip label="Отгул" active={requestType === 'day_off'} onPress={() => setRequestType('day_off')} />
            <TypeChip label="Больничный" active={requestType === 'sick'} onPress={() => setRequestType('sick')} />
          </View>

          <Field value={startDate} onChangeText={setStartDate} placeholder="Дата начала (YYYY-MM-DD)" />
          <Field value={endDate} onChangeText={setEndDate} placeholder="Дата окончания (YYYY-MM-DD)" />
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
        <Text style={styles.sectionTitle}>{isHr ? 'Входящие заявки сотрудников' : 'Мои заявки'}</Text>

        {isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

        {!isLoading && items.length === 0 ? (
          <Text style={styles.empty}>Пока нет заявок</Text>
        ) : null}

        {items.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <Text style={styles.historyTitle}>{item.request_type}</Text>
            <Text style={styles.historyMeta}>{item.start_date} — {item.end_date}</Text>
            <Text style={[styles.status, statusColor[item.status] ?? styles.statusDefault]}>{item.status}</Text>
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
    placeholderTextColor="#9CA3AF"
    autoCapitalize="none"
  />
);

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  sectionTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  newReq: { borderRadius: 16, backgroundColor: '#F6F7F8', padding: 14, gap: 10 },
  typesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeChipActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  typeChipText: { color: '#4B5563', fontSize: 12, fontWeight: '600' },
  typeChipTextActive: { color: '#FFFFFF' },
  field: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    justifyContent: 'center',
    color: '#111827',
  },
  createBtn: { height: 46, borderRadius: 12, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  history: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, gap: 8 },
  empty: { color: '#6B7280' },
  historyRow: { borderRadius: 12, backgroundColor: '#F9FAFB', padding: 10, gap: 3 },
  historyTitle: { fontWeight: '700', color: '#1F2937' },
  historyMeta: { color: '#6B7280', fontSize: 12 },
  reviewRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  approveBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700' },
  statusOk: { color: '#166534' },
  statusBad: { color: '#B91C1C' },
  statusSubmitted: { color: '#2563EB' },
  statusCanceled: { color: '#6B7280' },
  statusDefault: { color: '#374151' },
});

const statusColor = {
  approved: styles.statusOk,
  rejected: styles.statusBad,
  submitted: styles.statusSubmitted,
  canceled: styles.statusCanceled,
};
