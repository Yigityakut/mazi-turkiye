import AsyncStorage from "@react-native-async-storage/async-storage";

/** Cihazda tutulan küçük tercihler. Hiçbiri kritik değil; hata olursa sessizce varsayılana döner. */
const K = {
  onboarded: "mazi.onboarded",
  startTimes: "mazi.startTimes",          // son oyun başlangıç saatleri (dakika cinsinden) → hatırlatıcı saati
  pendingChallenge: "mazi.pendingChallenge",
  notifAsked: "mazi.notifAsked",
  reviewAsked: "mazi.reviewAsked",
  reminderOverride: "mazi.reminderHour",
};

async function get<T>(k: string, d: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem(k);
    return v == null ? d : (JSON.parse(v) as T);
  } catch {
    return d;
  }
}
async function set(k: string, v: unknown) {
  try {
    await AsyncStorage.setItem(k, JSON.stringify(v));
  } catch {}
}

export const prefs = {
  onboarded: () => get(K.onboarded, false),
  setOnboarded: () => set(K.onboarded, true),
  pendingChallenge: () => get<string | null>(K.pendingChallenge, null),
  setPendingChallenge: (c: string | null) => set(K.pendingChallenge, c),
  notifAsked: () => get(K.notifAsked, false),
  setNotifAsked: () => set(K.notifAsked, true),
  reviewAsked: () => get(K.reviewAsked, false),
  setReviewAsked: () => set(K.reviewAsked, true),
  reminderOverride: () => get<number | null>(K.reminderOverride, null),
  setReminderOverride: (h: number | null) => set(K.reminderOverride, h),
  async recordStart(date = new Date()) {
    const list = await get<{ d: string; m: number }[]>(K.startTimes, []);
    const d = date.toISOString().slice(0, 10);
    if (!list.some((x) => x.d === d)) list.push({ d, m: date.getHours() * 60 + date.getMinutes() });
    await set(K.startTimes, list.slice(-7));
  },
  startTimes: () => get<{ d: string; m: number }[]>(K.startTimes, []),
};
