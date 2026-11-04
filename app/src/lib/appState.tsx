import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api } from "./api";
import { track } from "./analytics";
import { DEMO } from "./demo";
import { startIdentitySync, syncIdentity } from "./identity";
import { scheduleDailyReminder } from "./notifications";
import { hasProLocally, onProEntitlement } from "./purchases";
import { ensureSession } from "./supabase";
import type { Me } from "./types";

type Ctx = { me: Me | null; error: string | null; refresh: () => Promise<Me | null>; setPro: () => void };
const AppCtx = createContext<Ctx>({ me: null, error: null, refresh: async () => null, setPro: () => {} });

/** Satın almadan sonra sunucudaki `is_pro` (RevenueCat webhook'u) gelene kadar yenileme aralıkları. */
const CONFIRM_DELAYS = [2000, 5000, 10000, 20000, 40000, 90000];

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, new Promise<T>((r) => setTimeout(() => r(fallback), ms))]);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const meRef = useRef<Me | null>(null);
  /** Mağaza (RevenueCat) yetkisinin bu cihazda doğrulandığı kullanıcı kimliği. */
  const localPro = useRef<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (m: Me | null) => { meRef.current = m; setMe(m); };

  /**
   * İstemcide Pro = sunucu `is_pro` VEYA mağaza yetkisi (QA Y1). Webhook gecikse de ödeme yapan kullanıcı Pro'yu
   * kaybetmez; sunucuda kapılanan özellikler (ipucu, arşiv, sınırsız 1v1) webhook gelince açılır.
   */
  const withLocalPro = useCallback(async (m: Me): Promise<Me> => {
    if (m.is_pro || DEMO) return m;
    if (localPro.current !== m.id && (await withTimeout(hasProLocally(m.id).catch(() => false), 2500, false))) {
      localPro.current = m.id;
    }
    return localPro.current === m.id ? { ...m, is_pro: true } : m;
  }, []);

  const load = useCallback(async (): Promise<{ server: Me; m: Me } | null> => {
    try {
      const server = await api.me();
      const m = await withLocalPro(server);
      apply(m);
      setError(null);
      // İnternetsiz ilk açılıştan sonra da RevenueCat/PostHog kimliği bağlansın (QA O9)
      if (!DEMO) void syncIdentity(m.id);
      scheduleDailyReminder(!!m.today_result, m.streak.current).catch(() => {});
      return { server, m };
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, [withLocalPro]);

  const refresh = useCallback(async () => (await load())?.m ?? null, [load]);

  /** Sunucu `is_pro`'yu onaylayana kadar artan aralıklarla yeniler; bu sırada yerel Pro açık kalır. */
  const confirmPro = useCallback((attempt = 0) => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    if (attempt >= CONFIRM_DELAYS.length) return;
    confirmTimer.current = setTimeout(async () => {
      const r = await load();
      if (!r?.server.is_pro) confirmPro(attempt + 1);
    }, CONFIRM_DELAYS[attempt]);
  }, [load]);

  const setPro = useCallback(() => {
    const m = meRef.current;
    if (!m) return;
    localPro.current = m.id;
    if (!m.is_pro) apply({ ...m, is_pro: true });
    confirmPro(0);
  }, [confirmPro]);

  useEffect(() => {
    let stopIdentity = () => {};
    let stopPro = () => {};
    if (!DEMO) {
      stopIdentity = startIdentitySync(() => {
        // Hesap silindi veya oturum düştü: eski kullanıcının verisi ekranda kalmasın, yeni anonim oturum açılsın
        localPro.current = null;
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
        apply(null);
        void refresh();
      });
      // Bekleyen ödeme onaylanınca veya başka ekranda geri yüklenince
      stopPro = onProEntitlement((appUserId) => {
        const m = meRef.current;
        if (m && m.id === appUserId && !m.is_pro) setPro();
      });
    }
    (async () => {
      // Demo derlemesinde oturum açılmaz (anonim giriş yok, ağ yok)
      if (!DEMO) {
        try {
          const s = await ensureSession();
          void syncIdentity(s.user.id); // identify eşzamanlı çalışır; app_opened doğru kimlikle gider
        } catch {}
      }
      track("app_opened");
      void refresh();
    })();
    return () => {
      stopIdentity();
      stopPro();
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, [refresh, setPro]);

  const value = useMemo(() => ({ me, error, refresh, setPro }), [me, error, refresh, setPro]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
