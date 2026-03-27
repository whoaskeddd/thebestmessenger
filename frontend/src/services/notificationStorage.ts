import AsyncStorage from '@react-native-async-storage/async-storage';

const ANNOUNCEMENTS_PREFIX = 'notifications.announcementsSeen.';
const LEAVES_PREFIX = 'notifications.leaveStatusesSeen.';

function announcementKey(userId: string): string {
  return `${ANNOUNCEMENTS_PREFIX}${userId}`;
}

function leaveStatusesKey(userId: string): string {
  return `${LEAVES_PREFIX}${userId}`;
}

export async function getSeenAnnouncementIds(userId: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(announcementKey(userId));
  if (!raw) return new Set<string>();
  try {
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((item): item is string => typeof item === 'string' && item.length > 0));
  } catch {
    return new Set<string>();
  }
}

export async function markAnnouncementsSeen(userId: string, announcementIds: string[]): Promise<void> {
  const prev = await getSeenAnnouncementIds(userId);
  announcementIds.forEach((id) => {
    if (id) prev.add(id);
  });
  await AsyncStorage.setItem(announcementKey(userId), JSON.stringify(Array.from(prev)));
}

export async function getSeenLeaveStatuses(userId: string): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(leaveStatusesKey(userId));
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Record<string, string>>((acc, [requestId, status]) => {
      if (typeof status === 'string' && status.length > 0) {
        acc[requestId] = status;
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export async function setSeenLeaveStatuses(userId: string, seenStatuses: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(leaveStatusesKey(userId), JSON.stringify(seenStatuses));
}
