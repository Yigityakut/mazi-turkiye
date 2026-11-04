import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { RC_ANDROID_KEY, RC_IOS_KEY } from "./config";

/** RevenueCat: tek seferlik, tüketilmeyen `pro_lifetime`. Entitlement adı: "pro". */
export const ENTITLEMENT = "pro";
let configured = false;

export function configurePurchases(uid: string) {
  const key = Platform.OS === "ios" ? RC_IOS_KEY : Platform.OS === "android" ? RC_ANDROID_KEY : undefined;
  if (!key || configured) return;
  Purchases.configure({ apiKey: key, appUserID: uid });
  configured = true;
}

export const purchasesReady = () => configured;

export async function proPackage(): Promise<PurchasesPackage | null> {
  if (!configured) return null;
  const o = await Purchases.getOfferings();
  return o.current?.lifetime ?? o.current?.availablePackages[0] ?? null;
}

export async function buyPro(pkg: PurchasesPackage) {
  const r = await Purchases.purchasePackage(pkg);
  return !!r.customerInfo.entitlements.active[ENTITLEMENT];
}

export async function restorePro() {
  if (!configured) return false;
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active[ENTITLEMENT];
}

export async function hasProLocally() {
  if (!configured) return false;
  const info = await Purchases.getCustomerInfo();
  return !!info.entitlements.active[ENTITLEMENT];
}
