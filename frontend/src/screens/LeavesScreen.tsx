import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import type { Employee, LeaveRequest, LeaveRequestType } from '../types/api';
import { apiDateToDisplayDate, displayDateToApiDate, formatDateInput } from '../utils/date';

const DEFAULT_TYPE: LeaveRequestType = 'vacation';

export const LeavesScreen = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';
  const [items, setItems] = useState<LeaveRequest[]>([]);
  const [employeesByUserId, setEmployeesByUserId] = useState<Record<string, string>>({});
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isRejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');

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
        const employees = await modulesApi.getEmployees();
        setEmployeesByUserId(createEmployeeNameMap(employees));
      }
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
    const apiStartDate = displayDateToApiDate(startDate);
    const apiEndDate = displayDateToApiDate(endDate);
    if (!apiStartDate || !apiEndDate) {
      Alert.alert('Проверьте поля', 'Введите корректные даты в формате ДД.ММ.ГГГГ');
      return;
    }

    setSubmitting(true);
    try {
      await modulesApi.createLeaveRequest({
        request_type: requestType,
        start_date: apiStartDate,
        end_date: apiEndDate,
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
      await modulesApi.approveLeaveRequest(requestId, null);
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось согласовать заявку');
    }
  };

  const reject = async (): Promise<void> => {
    if (!rejectRequestId) return;
    const comment = rejectComment.trim();
    if (!comment) {
      Alert.alert('Проверьте поля', 'Для отклонения нужен комментарий HR');
      return;
    }
    try {
      await modulesApi.rejectLeaveRequest(rejectRequestId, comment);
      setRejectComment('');
      setRejectRequestId(null);
      setRejectModalOpen(false);
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось отклонить заявку');
    }
  };

  const openRejectModal = (requestId: string): void => {
    setRejectRequestId(requestId);
    setRejectComment('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = (): void => {
    setRejectModalOpen(false);
    setRejectRequestId(null);
    setRejectComment('');
  };

  return (
    <AppScreen>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.headRow}>
            <Text style={styles.title}>Отпуска и заявки</Text>
          </View>

          {!isHr ? (
            <View style={styles.newReq}>
              <Text style={styles.sectionTitle}>Новая заявка</Text>

              <View style={styles.fieldRow}>
                <Field value={startDate} onChangeText={(value) => setStartDate(formatDateInput(value))} placeholder="Дата начала (ДД.ММ.ГГГГ)" />
                <Field value={endDate} onChangeText={(value) => setEndDate(formatDateInput(value))} placeholder="Дата окончания (ДД.ММ.ГГГГ)" />
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
              <Text style={styles.hint}>Отклонение заявки требует комментария. Комментарий вводится при нажатии «Отклонить».</Text>
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
                    {isHr ? <Text style={styles.historyMeta}>Создал: {employeesByUserId[item.user_id] ?? item.user_id}</Text> : null}
                    {item.hr_comment ? <Text style={styles.commentText}>Комментарий HR: {item.hr_comment}</Text> : null}
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
                    <Pressable style={styles.rejectBtn} onPress={() => openRejectModal(item.id)}>
                      <Text style={styles.reviewText}>Отклонить</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal visible={isRejectModalOpen} transparent animationType="fade" onRequestClose={closeRejectModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Комментарий к отклонению</Text>
              <TextInput
                style={[styles.field, styles.rejectInput]}
                value={rejectComment}
                onChangeText={setRejectComment}
                placeholder="Укажите причину отказа"
                placeholderTextColor={colors.textMuted}
                multiline
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalSecondaryBtn} onPress={closeRejectModal}>
                  <Text style={styles.modalSecondaryText}>Отмена</Text>
                </Pressable>
                <Pressable style={styles.modalPrimaryBtn} onPress={() => void reject()}>
                  <Text style={styles.modalPrimaryText}>Отклонить</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

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
  hint: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textSecondary },
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
  commentText: { ...typography.caption, fontFamily: fontFamilies.primary, color: colors.textPrimary, marginTop: 4 },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 20, justifyContent: 'center' },
  modalCard: { borderRadius: 16, backgroundColor: colors.surface, padding: 14, gap: 10 },
  modalTitle: { ...typography.body, fontFamily: fontFamilies.primary, color: colors.textPrimary, fontWeight: '700' },
  rejectInput: { minHeight: 96, textAlignVertical: 'top', paddingTop: 10, paddingBottom: 10 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalSecondaryBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtn: { flex: 1, height: 42, borderRadius: 12, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.textPrimary },
  modalPrimaryText: { ...typography.button, fontFamily: fontFamilies.primary, color: colors.surface },
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
  if (!end) return apiDateToDisplayDate(start);
  return `${apiDateToDisplayDate(start)} — ${apiDateToDisplayDate(end)}`;
}

function createEmployeeNameMap(employees: Employee[]): Record<string, string> {
  return employees.reduce<Record<string, string>>((acc, employee) => {
    if (!employee.user_id) return acc;
    const fullName = `${employee.first_name ?? ''} ${employee.last_name ?? ''}`.trim();
    acc[employee.user_id] = fullName || employee.work_email || employee.user_id;
    return acc;
  }, {});
}
