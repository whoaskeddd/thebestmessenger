import { ScrollView, StyleSheet, Text, View } from 'react-native';

export const NewsScreen = () => (
  <ScrollView contentContainerStyle={styles.wrap}>
    <Text style={styles.title}>Новости</Text>

    <Post title="Новый регламент по отпускам" date="Сегодня, 10:15" text="Внесены изменения в порядок согласования отпусков." />
    <Post title="Запуск внутреннего мессенджера" date="Вчера, 17:40" text="Доступны групповые чаты и отправка вложений." />

    <View style={styles.details}>
      <Text style={styles.detailsTitle}>Детали объявления</Text>
      <Text style={styles.detailsText}>Полная версия новости открывается по нажатию на карточку.</Text>
    </View>
  </ScrollView>
);

const Post = ({ title, date, text }: { title: string; date: string; text: string }) => (
  <View style={styles.post}>
    <Text style={styles.postTitle}>{title}</Text>
    <Text style={styles.postDate}>{date}</Text>
    <Text style={styles.postText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingTop: 24, paddingHorizontal: 20, paddingBottom: 24, gap: 12, backgroundColor: '#FFFFFF' },
  title: { color: '#1A1A1A', fontSize: 32, fontWeight: '700' },
  post: { borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 14, gap: 6 },
  postTitle: { color: '#1A1A1A', fontSize: 15, fontWeight: '700' },
  postDate: { color: '#9CA3AF', fontSize: 12 },
  postText: { color: '#4B5563', fontSize: 13 },
  details: { borderRadius: 16, backgroundColor: '#FFF4F4', padding: 14, gap: 6 },
  detailsTitle: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },
  detailsText: { color: '#7F1D1D', fontSize: 13 },
});
