import { DEMO, demoRpc } from "./demo";
import { ensureSession, supabase } from "./supabase";
import type { Challenge, Day, DuelState, GuessResult, Leaderboard, Me, Source, Stats } from "./types";

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  if (DEMO) return demoRpc<T>(fn, args); // mağaza ekran görüntüleri (EXPO_PUBLIC_DEMO=1); üretimde hiç girilmez
  await ensureSession();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const api = {
  me: () => rpc<Me>("get_me"),
  day: (day?: string | null, challenge?: string | null) =>
    rpc<Day>("get_day", { p_day: day ?? null, p_challenge: challenge ?? null }),
  guess: (a: { day: string; slot: number; lat: number; lng: number; year: number; durationMs?: number; challenge?: string | null }) =>
    rpc<GuessResult>("submit_guess", {
      p_day: a.day, p_slot: a.slot, p_lat: a.lat, p_lng: a.lng, p_year: a.year,
      p_duration_ms: a.durationMs ?? null, p_challenge: a.challenge ?? null,
    }),
  hint: (day: string, slot: number, kind: "year" | "location") =>
    rpc<{ kind: string; text: string }>("use_hint", { p_day: day, p_slot: slot, p_kind: kind }),
  stats: () => rpc<Stats>("get_stats"),
  leaderboard: (scope: "today" | "week" | "friends") => rpc<Leaderboard>("leaderboard", { p_scope: scope, p_limit: 50 }),
  createChallenge: (day?: string) => rpc<{ code: string; url: string; number: number; total: number }>("create_challenge", { p_day: day ?? null }),
  challenge: (code: string) => rpc<Challenge>("get_challenge", { p_code: code }),
  updateProfile: (p: Record<string, unknown>) => rpc<void>("update_profile", { p }),
  report: (photoId: string, reason: string, note?: string) => rpc<void>("report_photo", { p_photo_id: photoId, p_reason: reason, p_note: note ?? null }),
  sources: (offset = 0) => rpc<Source[]>("list_sources", { p_limit: 100, p_offset: offset }),
  duelFind: () => rpc<{ status: "waiting" | "matched"; duel_id?: string }>("duel_find"),
  duelQueueStatus: () => rpc<{ status: string; duel_id: string | null; waited: number }>("duel_queue_status"),
  duelCancel: () => rpc<void>("duel_cancel"),
  duelAdminJoin: (token: string) => rpc<{ status: string; duel_id: string | null }>("duel_admin_join", { p_token: token }),
  duelState: (id: string) => rpc<DuelState>("duel_state", { p_duel: id }),
  duelGuess: (id: string, round: number, lat: number, lng: number, year: number) =>
    rpc<DuelState>("duel_guess", { p_duel: id, p_round: round, p_lat: lat, p_lng: lng, p_year: year }),
  createMergeTicket: () => rpc<string>("create_merge_ticket"),
  redeemMergeTicket: (ticket: string) => rpc<{ moved: number }>("redeem_merge_ticket", { p_ticket: ticket }),
  /**
   * Pro yetkisini sunucuda RevenueCat'ten doğrulatır (supabase/functions/sync-pro, QA Y1). Webhook gecikse de
   * `profiles.is_pro` hemen yazılır. Sonuç: sunucunun gördüğü `is_pro`; hata fırlatabilir (çağıran yeniden dener).
   */
  async syncPro(): Promise<boolean> {
    if (DEMO) return true;
    const s = await ensureSession();
    const { data, error } = await supabase.functions.invoke<{ is_pro?: boolean }>("sync-pro", {
      headers: { Authorization: `Bearer ${s.access_token}` },
      body: {},
    });
    if (error) throw new Error(error.message);
    return !!data?.is_pro;
  },
  /**
   * Hesabı siler. Apple ile bağlı hesapta `appleAuthorizationCode` verilirse fonksiyon Apple token'ını da iptal eder
   * (supabase/functions/delete-account, gövde: `{ apple_authorization_code }`).
   */
  async deleteAccount(appleAuthorizationCode?: string | null) {
    if (DEMO) return;
    const s = await ensureSession();
    const { error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${s.access_token}` },
      body: appleAuthorizationCode ? { apple_authorization_code: appleAuthorizationCode } : {},
    });
    if (error) {
      // Fonksiyonun döndürdüğü `{ error }` metnini kullan (ör. auth_required); yoksa istemci hatası
      const ctx = (error as { context?: unknown }).context;
      const body = ctx instanceof Response ? await ctx.json().catch(() => null) : null;
      throw new Error(typeof body?.error === "string" ? body.error : error.message);
    }
    // Kullanıcı sunucuda artık yok: sadece yerel oturumu sil (SIGNED_OUT → identity.ts yeni anonim oturumu bağlar)
    await supabase.auth.signOut({ scope: "local" });
  },
};
