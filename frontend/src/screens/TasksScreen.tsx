import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { modulesApi } from '../api/modules';
import { useAuth } from '../context/AuthContext';
import type { Employee, HrTask } from '../types/api';

export const TasksScreen = () => {
  const { user } = useAuth();
  const isHr = user?.role === 'hr' || user?.role === 'admin';

  const [tasks, setTasks] = useState<HrTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPickerOpen, setPickerOpen] = useState(false);
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const [tasksData, employeesData] = await Promise.all([
        isHr ? modulesApi.getAllTasks() : modulesApi.getMyTasks(),
        isHr ? modulesApi.getEmployees() : Promise.resolve([] as Employee[]),
      ]);
      setTasks(tasksData);
      setEmployees(employeesData);
      if (!isHr) {
        try {
          await modulesApi.markMyTasksSeen();
        } catch {
          // ignore mark-seen errors
        }
      }
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isHr]);

  const onCreate = async (): Promise<void> => {
    if (!title.trim()) {
      Alert.alert('Проверьте поля', 'Введите заголовок задачи');
      return;
    }

    if (selectedAssigneeIds.length === 0) {
      Alert.alert('Проверьте поля', 'Выберите как минимум одного исполнителя');
      return;
    }

    setSubmitting(true);
    try {
      await modulesApi.createTask({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.trim() || null,
        announcement_id: null,
        assignee_user_ids: selectedAssigneeIds,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedAssigneeIds([]);
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось создать задачу');
    } finally {
      setSubmitting(false);
    }
  };

  const onComplete = async (taskId: string): Promise<void> => {
    try {
      await modulesApi.completeTask(taskId);
      await load();
    } catch (error) {
      Alert.alert('Ошибка', error instanceof Error ? error.message : 'Не удалось отметить задачу');
    }
  };

  const selectedAssigneesLabel = useMemo(() => {
    if (!selectedAssigneeIds.length) return 'Выбрать исполнителей';
    const picked = employees.filter((e) => e.user_id && selectedAssigneeIds.includes(e.user_id));
    if (picked.length === 0) return `Выбрано: ${selectedAssigneeIds.length}`;
    const names = picked.map((e) => `${e.first_name} ${e.last_name}`.trim()).filter(Boolean);
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }, [employees, selectedAssigneeIds]);

  const filteredEmployees = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    const withUsers = employees.filter((e) => Boolean(e.user_id));
    if (!q) return withUsers;
    return withUsers.filter((e) => {
      const full = `${e.first_name ?? ''} ${e.last_name ?? ''} ${e.middle_name ?? ''}`.toLowerCase();
      const email = `${e.work_email ?? ''}`.toLowerCase();
      const dept = (e.departments ?? []).map((d) => d.name).join(' ').toLowerCase();
      return full.includes(q) || email.includes(q) || dept.includes(q);
    });
  }, [assigneeQuery, employees]);

  const toggleAssignee = (userId: string): void => {
    setSelectedAssigneeIds((prev) => (
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    ));
  };

  const closePicker = (): void => {
    setPickerOpen(false);
    setAssigneeQuery('');
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Задачи</Text>

      {isHr ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Создать задачу сотруднику</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Заголовок" placeholderTextColor="#9CA3AF" />
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Описание (необязательно)" placeholderTextColor="#9CA3AF" />
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="Срок (YYYY-MM-DD)" placeholderTextColor="#9CA3AF" />
          <Pressable style={styles.pickerBtn} onPress={() => setPickerOpen(true)}>
            <Text style={styles.pickerText}>{selectedAssigneesLabel}</Text>
            {selectedAssigneeIds.length ? <Text style={styles.pickerMeta}>Выбрано: {selectedAssigneeIds.length}</Text> : null}
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={() => void onCreate()} disabled={isSubmitting}>
            <Text style={styles.primaryText}>{isSubmitting ? 'Создаю...' : 'Создать задачу'}</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{isHr ? 'Все задачи' : 'Мои задачи'}</Text>

        {isLoading ? <ActivityIndicator color="#FF6B6B" /> : null}

        {!isLoading && tasks.length === 0 ? <Text style={styles.empty}>Задач пока нет</Text> : null}

        {tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>{task.description ?? 'Без описания'}</Text>
            {task.due_date ? <Text style={styles.taskMeta}>Срок: {task.due_date}</Text> : null}
            {!isHr ? (
              <Pressable style={styles.secondaryBtn} onPress={() => void onComplete(task.id)}>
                <Text style={styles.secondaryText}>Отметить выполненной</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Modal visible={isPickerOpen} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Исполнители</Text>
              <Pressable onPress={closePicker} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>Закрыть</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.search}
              value={assigneeQuery}
              onChangeText={setAssigneeQuery}
              placeholder="Поиск: имя, отдел, email"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
            />

            <FlatList
              data={filteredEmployees}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const userId = item.user_id;
                if (!userId) return null;
                const checked = selectedAssigneeIds.includes(userId);
                const dept = (item.departments ?? []).map((d) => d.name).filter(Boolean).join(', ');
                return (
                  <Pressable style={[styles.empRow, checked && styles.empRowChecked]} onPress={() => toggleAssignee(userId)}>
                    <View style={styles.empLeft}>
                      <Text style={styles.empName}>{item.first_name} {item.last_name}</Text>
                      <Text style={styles.empMeta}>{dept || '—'}</Text>
                    </View>
                    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                      <Text style={styles.checkboxText}>{checked ? '✓' : ''}</Text>
                    </View>
                  </Pressable>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>Никого не нашли</Text>}
            />

            <Pressable style={styles.modalDone} onPress={closePicker}>
              <Text style={styles.modalDoneText}>Готово</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 10, backgroundColor: '#FFFFFF' },
  sectionTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  input: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    color: '#111827',
  },
  pickerBtn: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 2,
  },
  pickerText: { color: '#111827', fontWeight: '700' },
  pickerMeta: { color: '#6B7280', fontSize: 12 },
  empty: { color: '#6B7280' },
  primaryBtn: { height: 44, borderRadius: 12, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  taskRow: { borderRadius: 12, backgroundColor: '#F9FAFB', padding: 10, gap: 3 },
  taskTitle: { color: '#111827', fontSize: 14, fontWeight: '700' },
  taskMeta: { color: '#6B7280', fontSize: 12 },
  secondaryBtn: {
    marginTop: 6,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#4338CA', fontWeight: '700', fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 20,
    justifyContent: 'center',
  },
  modalCard: {
    maxHeight: '80%',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { color: '#111827', fontWeight: '800', fontSize: 16 },
  modalClose: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F3F4F6' },
  modalCloseText: { color: '#111827', fontWeight: '700', fontSize: 12 },
  search: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    color: '#111827',
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
  },
  empRowChecked: { backgroundColor: '#EEF2FF' },
  empLeft: { flex: 1, paddingRight: 10 },
  empName: { color: '#111827', fontWeight: '800', fontSize: 13 },
  empMeta: { color: '#6B7280', fontSize: 12, marginTop: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: { borderColor: '#4F46E5', backgroundColor: '#4F46E5' },
  checkboxText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14, marginTop: -2 },
  modalDone: { height: 44, borderRadius: 12, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  modalDoneText: { color: '#FFFFFF', fontWeight: '800' },
});
