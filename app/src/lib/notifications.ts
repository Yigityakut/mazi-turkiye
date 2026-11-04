import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { api } from "./api";
import { prefs } from "./prefs";

const DAILY_ID = "mazi-daily-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true,
  }),
});

/**
 * Hatırlatıcı saati = son 7 gündeki oyun başlangıç saatlerinin ortancası, 09:00–24:00 arasına sıkıştırılır.
 * Geçmiş yoksa 20:00. Kullanıcı Ayarlar'dan sabitlediyse o saat.
 */
export async function reminderTime(): Promise<{ hour: number; minute: number }> {
  const fixed = await prefs.reminderOverride();
  if (fixed != null) return { hour: fixed, minute: 0 };
  const times = (await prefs.startTimes()).map((x) => x.m).sort((a, b) => a - b);
  if (!times.length) return { hour: 20, minute: 0 };
  const mid = times[Math.floor(times.length / 2)];
  const clamped = Math.min(Math.max(mid, 9 * 60), 23 * 60 + 45);
  return { hour: Math.floor(clamped / 60), minute: clamped % 60 };
}

/**
 * Bugünü bitirdiyse bugünkü bildirimi atlar: tek seferlik (tarihli) bildirim yarın için kurulur.
 * Bitirmediyse bugün için (saat geçmediyse) kurulur. Uygulama her açıldığında ve gün bitince yeniden hesaplanır.
 */
export async function scheduleDailyReminder(playedToday: boolean, streak: number) {
  if (Platform.OS === "web") return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return;
  await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  const { hour, minute } = await reminderTime();
  const now = new Date();
  const at = new Date(now);
  at.setHours(hour, minute, 0, 0);
  if (playedToday || at <= now) at.setDate(at.getDate() + 1);
  // 04:00 gün dönüşünden sonra olmalı
  if (at.getHours() < 4) at.setHours(9, 0, 0, 0);
  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: streak >= 2 ? `${streak} günlük seri seni bekliyor` : "Günün 5 fotoğrafı hazır",
      body: "Nerede, hangi yıl? Bugünün turu birkaç dakika sürer.",
      data: { url: "maziturkiye://" },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
  });
}

/** İzin ilk turun sonunda istenir (açılışta değil). */
export async function askPermissionAfterFirstRound(): Promise<boolean> {
  if (Platform.OS === "web" || (await prefs.notifAsked())) return false;
  await prefs.setNotifAsked();
  const { granted } = await Notifications.requestPermissionsAsync();
  if (granted) await registerPushToken();
  return granted;
}

export async function registerPushToken() {
  if (Platform.OS === "web" || !Device.isDevice) return;
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Hatırlatıcılar", importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await api.updateProfile({ push_token: token.data });
  } catch {}
}
