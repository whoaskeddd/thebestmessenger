import { useEffect, useMemo, useState } from 'react';
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
  const [assigneeUserIds, setAssigneeUserIds] = useState('');

  const load = async (): Promise<void> => {
    try {
      setLoading(true);
      const [tasksData, employeesData] = await Promise.all([
        isHr ? modulesApi.getAllTasks() : modulesApi.getMyTasks(),
        isHr ? modulesApi.getEmployees() : Promise.resolve([] as Employee[]),
      ]);
      setTasks(tasksData);
      setEmployees(employeesData);
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

    const ids = assigneeUserIds
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      Alert.alert('Проверьте поля', 'Укажите как минимум один user_id исполнителя');
      return;
    }

    setSubmitting(true);
    try {
      await modulesApi.createTask({
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate.trim() || null,
        announcement_id: null,
        assignee_user_ids: ids,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssigneeUserIds('');
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

  const employeesHint = useMemo(() => {
    if (!employees.length) return '';
    return employees
      .slice(0, 5)
      .map((item) => `${item.first_name} ${item.last_name}: ${item.user_id ?? 'no-user-id'}`)
      .join('\n');
  }, [employees]);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Text style={styles.title}>Задачи</Text>

      {isHr ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Создать задачу сотруднику</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Заголовок" placeholderTextColor="#9CA3AF" />
          <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Описание (необязательно)" placeholderTextColor="#9CA3AF" />
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="Срок (YYYY-MM-DD)" placeholderTextColor="#9CA3AF" />
          <TextInput
            style={styles.input}
            value={assigneeUserIds}
            onChangeText={setAssigneeUserIds}
            placeholder="user_id исполнителей через запятую"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
          />
          {employeesHint ? <Text style={styles.hint}>{employeesHint}</Text> : null}
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
  hint: { color: '#6B7280', fontSize: 12, lineHeight: 18 },
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
});
