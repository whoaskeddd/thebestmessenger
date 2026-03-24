import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const LeavesScreen = () => (
  <ScrollView contentContainerStyle={styles.wrap}>
    <Text style={styles.title}>Отпуска и заявки</Text>

    <View style={styles.newReq}>
      <Text style={styles.sectionTitle}>Новая заявка</Text>
      <Field text="15.07.2026 — 22.07.2026" />
      <Field text="Ежегодный отпуск" />
      <View style={styles.createBtn}><Text style={styles.createBtnText}>Создать заявку</Text></View>
    </View>

    <View style={styles.history}>
      <Text style={styles.sectionTitle}>История</Text>
      <Text style={styles.ok}>Отпуск 01.05 — Одобрено</Text>
      <Text style={styles.bad}>Отгул 12.04 — Отклонено</Text>
    </View>
  </ScrollView>
);

const Field = ({ text }: { text: string }) => (
  <View style={styles.field}><Text style={styles.fieldText}>{text}</Text></View>
);

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 14, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  sectionTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  newReq: { borderRadius: 16, backgroundColor: '#F6F7F8', padding: 14, gap: 10 },
  field: { height: 46, borderRadius: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 12, justifyContent: 'center' },
  fieldText: { color: '#6B7280', fontSize: 13 },
  createBtn: { height: 46, borderRadius: 12, backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center' },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  history: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, gap: 8 },
  ok: { color: '#166534', fontSize: 13 },
  bad: { color: '#B91C1C', fontSize: 13 },
});
