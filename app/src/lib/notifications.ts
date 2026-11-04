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
  try {
    if (Platform.OS === "web" || (await prefs.notifAsked())) return false;
    await prefs.setNotifAsked();
    const { granted } = await Notifications.requestPermissionsAsync();
    if (granted) await registerPushToken();
    return granted;
  } catch {
    return false;
  }
}

/**
 * Expo push token'ı için EAS proje kimliği. `EAS_PROJECT_ID` build sırasında tanımlı değilse (app.config.ts)
 * `extra.eas.projectId` boş kalır; o zaman EAS build'in yazdığı `easConfig`'e bakılır. İkisi de yoksa sunucu
 * bildirimleri kapalı kalır, yerel hatırlatıcı çalışmaya devam eder (bkz. app/README.md → EAS_PROJECT_ID).
 */
function easProjectId(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)?.projectId;
  return fromExtra || Constants.easConfig?.projectId || undefined;
}

let registered: string | null = null;

/** Push token'ını o anki kullanıcının profiline yazar. Hata uygulamayı etkilemez; sonraki açılışta yeniden denenir. */
export async function registerPushToken(): Promise<boolean> {
  if (Platform.OS === "web" || !Device.isDevice) return false;
  const projectId = easProjectId();
  if (!projectId) {
    if (__DEV__) console.warn("[push] EAS proje kimliği yok (EAS_PROJECT_ID); sunucu bildirimleri kapalı.");
    return false;
  }
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Hatırlatıcılar", importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.updateProfile({ push_token: token.data });
    return true;
  } catch {
    return false;
  }
}

/**
 * İzin daha önce verildiyse token'ı bu kullanıcı için yeniden kaydeder: kimlik değişince (giriş, hesap silme),
 * izin sonradan Ayarlar'dan verilince veya token yenilenince sunucudaki token eskimesin (QA O10).
 */
export async function syncPushToken(uid: string) {
  if (Platform.OS === "web" || registered === uid) return;
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    if (await registerPushToken()) registered = uid;
  } catch {}
}
