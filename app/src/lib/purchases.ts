import { Platform } from "react-native";
import Purchases, { type CustomerInfo, type PurchasesPackage } from "react-native-purchases";
import { RC_ANDROID_KEY, RC_IOS_KEY } from "./config";

/**
 * RevenueCat: tek seferlik, tüketilmeyen `pro_lifetime`. Entitlement adı: "pro".
 * RevenueCat'teki kullanıcı kimliği her zaman o anki Supabase kullanıcı kimliğidir (anonim veya girişli).
 * Kimlik değişimleri (ilk açılış, Apple/Google girişi, hesap silme) `syncPurchasesUser`/`resetPurchasesUser` ile
 * sırayla uygulanır; böylece satın alma ve geri yükleme her zaman oyuncunun profiline yazılır (QA K2).
 */
export const ENTITLEMENT = "pro";
let configured = false;
const apiKey = () => (Platform.OS === "ios" ? RC_IOS_KEY : Platform.OS === "android" ? RC_ANDROID_KEY : undefined);

// RevenueCat çağrıları sıraya alınır: configure → logIn → logOut aynı anda çalışmasın.
let queue: Promise<unknown> = Promise.resolve();
function serial<T>(fn: () => Promise<T>): Promise<T> {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}

type ProListener = (appUserId: string) => void;
const proListeners = new Set<ProListener>();
const hasPro = (info: CustomerInfo) => !!info.entitlements.active[ENTITLEMENT];

function onCustomerInfo(info: CustomerInfo) {
  if (!hasPro(info) || !proListeners.size) return;
  Purchases.getAppUserID().then((id) => proListeners.forEach((l) => l(id))).catch(() => {});
}

/** Pro yetkisi bu cihazda (satın alma, geri yükleme, bekleyen ödeme onayı) aktif olunca çağrılır. */
export function onProEntitlement(l: ProListener) {
  proListeners.add(l);
  return () => { proListeners.delete(l); };
}

/** İlk çağrıda yapılandırır; sonra kimlik farklıysa `logIn` ile o kullanıcıya geçer. */
export function syncPurchasesUser(uid: string) {
  return serial(async () => {
    const key = apiKey();
    if (!key) return;
    if (!configured) {
      Purchases.configure({ apiKey: key, appUserID: uid });
      Purchases.addCustomerInfoUpdateListener(onCustomerInfo);
      configured = true;
      return;
    }
    if ((await Purchases.getAppUserID()) !== uid) await Purchases.logIn(uid);
  });
}

/** Hesap silindikten sonra: silinen kullanıcının kimliği RevenueCat'te kalmasın. Yeni anonim oturum `syncPurchasesUser` ile bağlanır. */
export function resetPurchasesUser() {
  return serial(async () => {
    if (!configured) return;
    if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  });
}

export const purchasesReady = () => configured;

/** Bekleyen kimlik işlemleri bitince teklif. Mağazaya ulaşılamazsa hata fırlatır; yapılandırma yoksa null. */
export async function proPackage(): Promise<PurchasesPackage | null> {
  await queue;
  if (!configured) return null;
  const o = await Purchases.getOfferings();
  return o.current?.lifetime ?? o.current?.availablePackages[0] ?? null;
}

export async function buyPro(pkg: PurchasesPackage) {
  await queue;
  const r = await Purchases.purchasePackage(pkg);
  return hasPro(r.customerInfo);
}

export async function restorePro() {
  await queue;
  if (!configured) return false;
  return hasPro(await Purchases.restorePurchases());
}

/**
 * Mağaza yetkisi istemcide doğruluk kaynağıdır: RevenueCat bu kullanıcı (uid) için `pro` diyorsa,
 * sunucudaki `profiles.is_pro` webhook'la henüz güncellenmemiş olsa da arayüz Pro gösterir (QA Y1).
 */
export async function hasProLocally(uid: string) {
  await queue;
  if (!configured) return false;
  if ((await Purchases.getAppUserID()) !== uid) return false;
  return hasPro(await Purchases.getCustomerInfo());
}
