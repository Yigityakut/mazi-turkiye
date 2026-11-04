import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import { identify, track } from "./analytics";
import { scheduleDailyReminder } from "./notifications";
import { DEMO } from "./demo";
import { configurePurchases } from "./purchases";
import { ensureSession } from "./supabase";
import type { Me } from "./types";

type Ctx = { me: Me | null; error: string | null; refresh: () => Promise<Me | null>; setPro: () => void };
const AppCtx = createContext<Ctx>({ me: null, error: null, refresh: async () => null, setPro: () => {} });

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const m = await api.me();
      setMe(m);
      setError(null);
      scheduleDailyReminder(!!m.today_result, m.streak.current).catch(() => {});
      return m;
    } catch (e) {
      setError(String(e));
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      // Demo derlemesinde oturum açılmaz (anonim giriş yok, ağ yok)
      if (!DEMO) {
        try {
          const s = await ensureSession();
          identify(s.user.id);
          configurePurchases(s.user.id);
        } catch {}
      }
      track("app_opened");
      refresh();
    })();
  }, [refresh]);

  const value = useMemo(
    () => ({ me, error, refresh, setPro: () => setMe((m) => (m ? { ...m, is_pro: true } : m)) }),
    [me, error, refresh],
  );
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export const useApp = () => useContext(AppCtx);
