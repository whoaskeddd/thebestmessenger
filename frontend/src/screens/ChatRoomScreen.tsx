import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const ChatRoomScreen = () => (
  <View style={styles.wrap}>
    <View style={styles.head}>
      <View style={styles.left}>
        <View style={styles.circleBtn}><Text style={styles.circleText}>‹</Text></View>
        <View style={styles.avatar} />
        <View>
          <Text style={styles.name}>Анна Петрова</Text>
          <Text style={styles.role}>HR Recruiter</Text>
        </View>
      </View>
      <View style={styles.circleBtn}><Text style={styles.circleText}>⋯</Text></View>
    </View>

    <ScrollView contentContainerStyle={styles.messages}>
      <Bubble text="Привет! Подтверди, пожалуйста, время интервью." />
      <Text style={styles.time}>10:12</Text>
      <Bubble text="Отлично, отправь резюме и портфолио в чат." />
      <View style={styles.outWrap}>
        <View style={styles.outBubble}><Text style={styles.outText}>Подтверждаю, буду в 15:00.</Text></View>
        <Text style={styles.time}>10:13</Text>
      </View>
    </ScrollView>

    <View style={styles.composer}>
      <View style={styles.attachWrap}><CircleIcon text="📎" /><CircleIcon text="🖼" /></View>
      <Text style={styles.placeholder}>Сообщение...</Text>
      <View style={[styles.circleBtn, { backgroundColor: '#FF6B6B' }]}><Text style={{ color: '#FFFFFF' }}>➤</Text></View>
    </View>
  </View>
);

const Bubble = ({ text }: { text: string }) => (
  <View style={styles.inBubble}><Text style={styles.inText}>{text}</Text></View>
);

const CircleIcon = ({ text }: { text: string }) => (
  <View style={[styles.circleBtn, { width: 34, height: 34 }]}><Text style={styles.circleText}>{text}</Text></View>
);

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: '#FFFFFF', gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  circleBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F6F7F8', alignItems: 'center', justifyContent: 'center' },
  circleText: { color: '#1A1A1A', fontSize: 13 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE3E5' },
  name: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  role: { color: '#9CA3AF', fontSize: 12, fontWeight: '500' },
  messages: { gap: 10, flexGrow: 1 },
  inBubble: { alignSelf: 'flex-start', backgroundColor: '#F1F5F9', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  inText: { color: '#1A1A1A', fontSize: 14 },
  time: { color: '#9CA3AF', fontSize: 11 },
  outWrap: { alignSelf: 'flex-end', gap: 4, alignItems: 'flex-end' },
  outBubble: { backgroundColor: '#FF6B6B', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  outText: { color: '#FFFFFF', fontSize: 14 },
  composer: { height: 58, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  attachWrap: { flexDirection: 'row', gap: 6 },
  placeholder: { flex: 1, color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
