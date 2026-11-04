# QA raporu · Mazi Türkiye 1.0 (iOS + Android)

_Tarih: 2026-11-04 · Kapsam: `app/` (Expo SDK 58), `app/app.config.ts`, `app/eas.json`; ilgili yerlerde `supabase/functions`, `supabase/migrations`, `web/` · Yöntem: otomatik kontroller + `app/src` altındaki her dosyanın satır satır okunması. Gerçek cihazda test **yapılmadı** (konteynerde simülatör/cihaz yok); cihaz testleri `store/release-checklist.md` → Bölüm C._

> Satır numaraları bu raporun yazıldığı andaki dosyalara göredir. Diğer ajanlar `app/src` üzerinde çalışmaya devam ettiği için birkaç satır kayabilir; dosya ve fonksiyon adı esas alınmalıdır.

## 1. Otomatik kontroller

| Kontrol | Sonuç | Not |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ 0 hata | TypeScript 6.0, `strict` |
| `npx expo-doctor` (v1.21.6) | ⚠️ 18/20 geçti | Başarısız 2 kontrol **ağ kaynaklı**: "Expo config schema" (`exp.host` çözümlenemedi) ve "React Native Directory" (sunucu yanıtı yok). Konteynerden expo.dev erişimi kapalı. Bağımlılık sürümleri, peer dependency'ler, çift paket, lock dosyası, Metro, mağaza sürüm gereksinimleri kontrolleri ✅. Ağ olan bir makinede yeniden çalıştırılmalı. |
| `npx expo config --type public` | ✅ | Yapılandırma çözülüyor. Ortam değişkeni yokken `owner`, `updates`, `extra.eas` **boş** (bkz. Y4). Google Sign-In plugin'i `GOOGLE_IOS_URL_SCHEME` olmadığı için eklenmiyor (beklenen). |
| `npx expo export --platform web` | ✅ | 13 MB, tüm rotalar paketlendi |
| `npx expo export --platform android` | ✅ | Hermes bytecode 7,7 MB, 2.252 modül; native JS paketi derleniyor |
| `npx expo lint` | ⏭️ çalıştırılmadı | Projede ESLint yapılandırması yok; ilk çalıştırma `eslint.config.js` oluşturup `package.json`'u değiştirir (bu ajanın dosya sınırı dışında). Öneri: ESLint'i kurup `react-hooks/exhaustive-deps` uyarılarını gözden geçirmek. |
| Varlıklar | ✅ | `icon.png` 1024×1024 RGB (alfa yok, App Store uyumlu), adaptive icon 1024 RGBA, bildirim ikonu 96 px |
| Android izinleri (bağımlılık manifestleri) | ✅ | `expo-notifications`: `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`. `SCHEDULE_EXACT_ALARM` yok. `AD_ID` RevenueCat'in Maven paketinde olabilir; build sonrası birleşik manifest kontrol edilmeli. |

## 2. Özet

| Önem | Adet | Anlamı |
| --- | --- | --- |
| **Kritik** | 2 | Para/veri kaybı veya mağaza reddi neredeyse kesin; yayından önce düzeltilmeli |
| **Yüksek** | 6 | Yayını engelleyebilir veya lansman gününü bozabilir; yayından önce düzeltilmeli |
| **Orta** | 13 | Kullanıcı deneyimi, erişilebilirlik veya kural riski; 1.0'da düzeltilmesi önerilir |
| **Düşük** | 18 | İyileştirme; 1.0.x güncellemelerinde |

Kod genel olarak sağlam: puanlama ve doğru cevap sunucuda, cevap tahminden önce istemciye hiç gelmiyor; her açılımda ve "Kaynaklar"da atıf var; bot açıkça bildiriliyor; bildirim izni ilk turun sonunda isteniyor; hesap silme ve "Satın alımı geri yükle" mevcut; ana düğmeler 44–54 pt ve etiketli; harita ve fontlar gömülü olduğu için uygulama internetsiz açılıyor; incelenen yollarda internet yokken çökmeye yol açan bir kod bulunmadı. Asıl riskler **kimlik yönetimi** (anonim oturum, RevenueCat ve PostHog kimliğinin birbirinden kopması) ve **Pro yetkisinin yalnızca webhook'a bağlı olması**.

---

## 3. Bulgular

### Kritik

#### K1. İlk açılışta iki anonim kullanıcı oluşabiliyor; RevenueCat/PostHog ile oturum farklı kişiye bağlanıyor
- **Dosya:** `app/src/lib/supabase.ts:25-31` (`ensureSession`), `app/src/lib/appState.tsx:30-43`, `app/src/app/index.tsx:26` (`useFocusEffect(refresh)`)
- **Sorun:** Temiz kurulumda Home'un `useFocusEffect(refresh)` çağrısı (çocuk efekt, önce çalışır) ve `AppStateProvider`'ın `ensureSession()` çağrısı aynı anda `getSession()` → `null` görür ve **ikisi de** `signInAnonymously()` çağırır (auth-js 2.118 bunu tekilleştirmez; kontrol edildi). İki anonim kullanıcı açılır; son yazılan oturum saklanır. `identify()` ve `configurePurchases()` ilk kullanıcının kimliğiyle, oyun verisi ise ikincisiyle çalışabilir. Sonuç: satın alma RevenueCat'te **yanlış** `app_user_id` ile kaydedilir → webhook `is_pro`'yu oyuncunun profiline yazmaz → kullanıcı ödeme yapar, Pro açılmaz. Ayrıca her yeni kullanıcı anonim giriş kotasından iki kez düşer (bkz. Y5).
- **Öneri:** Uçuştaki isteği paylaş:
  ```ts
  let inflight: Promise<Session> | null = null;
  export function ensureSession(): Promise<Session> {
    inflight ??= (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session;
      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return anon.session!;
    })().finally(() => { inflight = null; });
    return inflight;
  }
  ```
  Ve kimlik bağlamayı tek yere al: `supabase.auth.onAuthStateChange((_e, s) => s && syncIdentity(s.user.id))` (bkz. K2).

#### K2. Apple/Google ile giriş ve hesap silme sonrası RevenueCat kimliği güncellenmiyor
- **Dosya:** `app/src/lib/purchases.ts:9-14` (`configured` bir kez true olunca bir daha hiçbir şey yapılmıyor), `app/src/lib/auth.ts:11-17`, `app/src/app/settings.tsx:47-50` (`signIn`), `app/src/app/settings.tsx:51-61` (`deleteAccount`)
- **Sorun:** RevenueCat açılışta anonim kullanıcının kimliğiyle yapılandırılıyor. Kullanıcı aynı oturumda Apple/Google ile giriş yapınca Supabase kimliği değişiyor ama `Purchases.logIn(yeniId)` çağrılmıyor; PostHog'a da yeni `identify` gitmiyor. Bu oturumda yapılan satın alma veya **geri yükleme** (yeni cihazda en sık yapılan akış: giriş yap → geri yükle) eski anonim kimliğe yazılır; birleştirme bileti zaten bozdurulduğu için `is_pro` girişli hesaba hiç ulaşmaz. Hesap silmede de aynı şey: yeni anonim oturum açılır ama RevenueCat silinmiş kullanıcının kimliğinde kalır. İnceleme notu inceleme ekibine girişi isteğe bağlı olarak gösteriyor; ekip önce giriş yapıp sonra satın alırsa ipucu `pro_required` döner → **3.1.1 / 2.1 reddi**.
- **Öneri:** `purchases.ts`'e
  ```ts
  export async function syncPurchasesUser(uid: string) {
    if (!configured) return configurePurchases(uid);
    if ((await Purchases.getAppUserID()) !== uid) await Purchases.logIn(uid);
  }
  ```
  ekle; `onAuthStateChange` içinde (SIGNED_IN, TOKEN_REFRESHED değil) `syncPurchasesUser` + `identify` çağır. `deleteAccount` sonrası `resetAnalytics()` ile birlikte yeni anonim oturum için de aynısı. Giriş sonrası `Purchases.restorePurchases()` gerekmez; `logIn` yeterli.

### Yüksek

#### Y1. Pro yetkisi yalnızca webhook'a bağlı; satın almadan 3 sn sonra Pro geri kapanabiliyor
- **Dosya:** `app/src/app/pro.tsx:43-47` ve `:57` (`setPro(); setTimeout(refresh, 3000)`), `app/src/lib/appState.tsx:17-28` (`setMe(m)` sunucu değeriyle yerel Pro'yu ezer), `supabase/functions/revenuecat-webhook/index.ts`
- **Sorun:** İpuçları, arşiv ve 1v1 sınırı sunucuda `profiles.is_pro` ile kapılanıyor; bu alanı sadece RevenueCat webhook'u yazıyor. Webhook gecikirse (sandbox'ta dakikalar sürebilir), yanlış yapılandırılırsa veya K2 nedeniyle başka kimliğe giderse: 3 sn sonraki `refresh` `is_pro: false` getirir, ekran "Pro'yu aç"a döner, ipucu `pro_required` verir. Ödeme yapmış kullanıcı için en kötü deneyim.
- **Öneri:** Kullanıcı JWT'siyle çağrılan bir `sync-pro` Edge Function'ı: RevenueCat REST API'den (`GET https://api.revenuecat.com/v1/subscribers/{uid}`, gizli anahtar `REVENUECAT_SECRET_KEY` Supabase secret'ında) `entitlements.pro` aktifse `is_pro = true` yazar. `buy` ve `restore` başarılı olunca önce `await api.syncPro()`, sonra `refresh()`. Ek olarak `Purchases.addCustomerInfoUpdateListener` ile entitlement aktif ama `me.is_pro` false ise `syncPro` çağır. Webhook yedek olarak kalır.

#### Y2. Hesap silmede Sign in with Apple token'ı iptal edilmiyor (App Store 5.1.1(v))
- **Dosya:** `supabase/functions/delete-account/index.ts:11`, `app/src/lib/api.ts:40-45`, `app/src/lib/auth.ts:19-28`
- **Sorun:** Apple, Sign in with Apple sunan uygulamaların hesap silinirken kullanıcının token'larını Apple'ın REST API'siyle (`/auth/revoke`) iptal etmesini istiyor. Fonksiyon sadece Supabase kullanıcısını siliyor. App Review bu adımı sık soruyor.
- **Öneri:** En basit yol: Apple ile bağlı hesapta silme onayından sonra `AppleAuthentication.signInAsync()` ile taze `authorizationCode` al, `delete-account`'a gövdede gönder. Fonksiyon `https://appleid.apple.com/auth/token` ile kodu `refresh_token`'a çevirir (client_id `com.maziturkiye.app`, client_secret: Sign in with Apple anahtarıyla imzalı ES256 JWT; secrets `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`), `https://appleid.apple.com/auth/revoke` çağırır, sonra kullanıcıyı siler. Kullanıcının Apple kimliği `auth.identities`'ten okunur.

#### Y3. Çökme raporlama ve hata sınırı yok (Plan 7.3: "Çökme ve analitik olayları PostHog'a ulaşıyor")
- **Dosya:** `app/src/lib/analytics.ts:16-22`, `app/src/app/_layout.tsx` (ErrorBoundary yok)
- **Sorun:** PostHog sadece olay için yapılandırılmış; yakalanmamış JS hataları ve promise reddleri PostHog'a gitmiyor. Expo Router `ErrorBoundary` dışa aktarılmadığı için bir render hatası üretimde uygulamayı kapatır. Plan 7.3'ün son maddesi bu haliyle geçemez; App Privacy'de beyan edilen "Crash Data" fiilen toplanmıyor.
- **Öneri:**
  ```ts
  ph = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, personProfiles: "identified_only",
    errorTracking: { autocapture: { uncaughtExceptions: true, unhandledRejections: true, console: ["error"] } } });
  export const captureException = (e: unknown) => ph?.captureException(e);
  ```
  `_layout.tsx`'e `export function ErrorBoundary({ error, retry }: ErrorBoundaryProps)` ekle: `captureException(error)` + `ErrorState` ("Beklenmeyen bir hata oldu", "Tekrar dene" → `retry`). Native çökmeler için isteğe bağlı `@posthog/react-native-plugin` + `autocapture.nativeCrashes`.

#### Y4. `EAS_PROJECT_ID` ve `EXPO_OWNER` sadece ortam değişkeninden geliyor
- **Dosya:** `app/app.config.ts:15`, `:22`, `:74`
- **Sorun:** EAS CLI, sunucudaki ortam değişkenlerini indirebilmek için projeyi önce `app.config.ts`'ten tanımalı; bu değerler sadece EAS'te tanımlıysa CLI projeyi bulamaz (yeni proje açmayı önerebilir). Unutulan bir build'de `updates.url` ve `extra.eas.projectId` **sessizce** boş kalır: OTA ile acil düzeltme gönderilemez, Expo push token'ı alınamaz (`notifications.ts:74-77` hatayı yutar). Lansman günü hotfix yolunu kapatabilecek bir sessiz hata.
- **Öneri:** Gizli olmayan bu iki değeri `eas init`'ten sonra koda sabitle: `owner: "<hesap>"`, `updates: { url: "https://u.expo.dev/<uuid>" }`, `extra.eas.projectId: "<uuid>"`. Env okumayı istersen `?? "<uuid>"` ile varsayılan ver. Build öncesi `npx expo config --type public` ile doğrula.

#### Y5. Anonim giriş hız sınırı lansman gününü durdurabilir
- **Dosya:** `app/src/lib/supabase.ts:28` (`signInAnonymously`), `app/src/lib/format.ts:48-53` (`errorText`), Supabase Dashboard → Authentication → Rate Limits
- **Sorun:** Supabase'in varsayılan anonim giriş sınırı IP başına saatte 30. Türkiye'deki mobil operatörler CGNAT ile çok sayıda kullanıcıyı aynı IP'den çıkarır; lansman/basın anında yeni kullanıcılar "Bağlantı kurulamadı" görür. K1 her yeni kurulumu iki kez saydırdığı için sorunu ikiye katlar. `errorText` 429'u (`over_request_rate_limit` / "rate limit") tanımadığı için mesaj da yanıltıcı ("Bir şeyler ters gitti").
- **Öneri:** Lansmandan önce anonim giriş sınırını yükselt (ör. saatte birkaç bin) ve kötüye kullanıma karşı Cloudflare Turnstile CAPTCHA'yı değerlendir (`signInAnonymously({ options: { captchaToken } })`). `ERRORS`'a `rate_limit: "Şu an çok yoğunuz, birkaç dakika sonra tekrar dene."` ekleyip `/rate limit|429/i` ile eşle. K1'i düzelt.

#### Y6. AASA dosyası Vercel'in `trailingSlash` yönlendirmesine takılabilir (evrensel linkler)
- **Dosya:** `web/vercel.json:3` (`"trailingSlash": true`), `web/.well-known/apple-app-site-association`
- **Sorun:** Vercel, `trailingSlash: true` iken uzantısız yolları `/…/`'ye 308 ile yönlendirir; `apple-app-site-association` uzantısızdır. Apple'ın CDN'i yönlendirme takip etmez → meydan okuma (`/m/`) ve admin Telegram (`/d/`) linkleri uygulamayı açmaz, Plan 7.3'ün "meydan okuma linki" maddesi ve admin akışı bozulur. (`assetlinks.json` uzantılı olduğu için etkilenmez.)
- **Öneri:** Yayından sonra `curl -sI https://maziturkiye.com/.well-known/apple-app-site-association` → 200 olmalı. 308 dönüyorsa `trailingSlash`'ı kaldır (sayfa linkleri zaten `/gizlilik/` biçiminde) veya `.well-known` için açık bir `rewrites`/`headers` kuralıyla test et. Apple'ın kopyası: `https://app-site-association.cdn-apple.com/a/v1/maziturkiye.com`. Ayrıca `APPLE_TEAM_ID` yer tutucusu doldurulmalı.

### Orta

#### O1. Dört ekranda "Tekrar dene" çalışmıyor (hata durumu sıfırlanmıyor)
- **Dosya:** `app/src/app/leaderboard.tsx:20` ve `:34`, `app/src/app/stats.tsx:18-20`, `app/src/app/sources.tsx:17-19`, `app/src/app/challenge/[code].tsx:16-19`
- **Sorun:** `load` başarılı olsa bile `err` hiç `null` yapılmıyor; render `if (err) return <ErrorState/>` olduğu için internet gelse de ekran hata durumunda kalır. Sıralamada sekme değiştirmek de kurtarmaz. Plan 7.3 "anlaşılır mesaj" şartını karşılıyor ama kurtarma yok.
- **Öneri:** Her `load`'un başına `setErr(null)` (sıralamada ayrıca sekme değişiminde). Örnek: `const load = () => { setErr(null); setData(null); api.leaderboard(tab).then(setData).catch((e) => setErr(errorText(e))); };`

#### O2. 1v1 maçında hata kullanıcıya gösterilmiyor
- **Dosya:** `app/src/app/duel/[id].tsx:44` (`fetchState` hatası), `:77` (`send` hatası), `:80` (hata sadece `!s` iken gösteriliyor)
- **Sorun:** Maç başladıktan sonra bağlantı koparsa veya tahmin `round_closed` ile reddedilirse `err` dolar ama hiçbir yerde görünmez: sayaç sıfıra iner, "Tahmin et" yükleniyor gösterip hiçbir şey olmaz.
- **Öneri:** `err && s` iken üst çubuğun altında ince bir şerit: `<Card><T color={c.bad}>{err}</T></Card>` ("Bağlantı koptu, yeniden bağlanılıyor…"). `fetchState` başarıda zaten `setErr(null)` yapıyor.

#### O3. Geri yığını yokken `router.back()` hiçbir şey yapmıyor (soğuk açılışta derin link)
- **Dosya:** `app/src/app/play.tsx:153` (✕), `app/src/app/duel/index.tsx:84` (Vazgeç), `app/src/app/pro.tsx:47` ve `:66` (Kapat)
- **Sorun:** Uygulama kapalıyken meydan okuma linkiyle açılınca yığın `challenge → (replace) play` olur; ✕'e basınca gidilecek ekran yoktur (Expo Router "GO_BACK was not handled" uyarısı verir), kullanıcı oyunda kalır.
- **Öneri:** `_layout.tsx`'e `export const unstable_settings = { initialRouteName: "index" };` (derin linklerin altına ana ekranı koyar) ve/veya ortak yardımcı: `const close = () => (router.canGoBack() ? router.back() : router.replace("/"));`

#### O4. Google ile giriş iOS'ta URL şeması olmadan çökebilir
- **Dosya:** `app/src/lib/auth.ts:30-40` ve `:46` (`googleConfigured`), `app/src/app/settings.tsx:102`, `app/app.config.ts:9` ve `:70`
- **Sorun:** Düğme sadece `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` varsa görünür; URL şeması ise sadece `GOOGLE_IOS_URL_SCHEME` varsa eklenir. Biri girilip öteki unutulursa Google Sign-In iOS SDK'sı "missing URL scheme" istisnasıyla uygulamayı kapatır. (Native modül paket listesinde olduğu için plugin'siz de bağlanır.)
- **Öneri:** `app.config.ts` → `extra.googleIos: !!googleIosScheme && !!env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; `googleConfigured = () => !!GOOGLE_WEB_CLIENT_ID && (Platform.OS !== "ios" || extra.googleIos)`.

#### O5. Fotoğraf yakınlaştırma Android'de çalışmayabilir (Modal içinde GestureHandlerRootView yok)
- **Dosya:** `app/src/components/Photo.tsx:58-64`
- **Sorun:** React Native `Modal` Android'de ana kök görünümün dışında açılır; react-native-gesture-handler bu durumda içeriğin ayrıca `GestureHandlerRootView` ile sarılmasını ister. Aksi halde pinch, pan ve çift dokunma tepki vermez (Plan 2.1: "yakınlaştırılabilir").
- **Öneri:** `<Modal …><GestureHandlerRootView style={{ flex: 1 }}> … </GestureHandlerRootView></Modal>`. Android cihazda doğrula.

#### O6. Android'de sunucu bildirimi için FCM yapılandırması yok
- **Dosya:** `app/app.config.ts:42-58` (`android.googleServicesFile` yok), `app/src/lib/notifications.ts:66-78` (hata `catch {}` ile yutuluyor)
- **Sorun:** Expo push token'ı Android'de Firebase (FCM V1) ister. `google-services.json` olmadan `getExpoPushTokenAsync` hata verir, token kaydedilmez, "seri tehlikede" bildirimi (Plan 2.7) Android'e hiç gitmez. Yerel hatırlatıcı çalışmaya devam eder.
- **Öneri:** Firebase projesi → Android uygulaması `com.maziturkiye.app` → `google-services.json` EAS'e dosya değişkeni olarak (`npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --visibility secret`), `android.googleServicesFile: process.env.GOOGLE_SERVICES_JSON`; FCM V1 service account anahtarı `npx eas-cli@latest credentials` ile EAS'e.

#### O7. Takma adlar için içerik denetimi yok (App Store 1.2, Play UGC); `age-rating.md` ile çelişiyor
- **Dosya:** `supabase/migrations/20261104000200_game.sql` (`update_profile`, sadece karakter kümesi kontrolü), `app/src/app/leaderboard.tsx:47-55`, `app/src/app/settings.tsx:75-79`, `store/age-rating.md` ("kaba takma adlar filtrelenir")
- **Sorun:** Takma adlar sıralamada ve meydan okumalarda herkese görünüyor; küfür filtresi, bildirme veya engelleme yok. `age-rating.md` filtre varmış gibi yazıyor. Kullanıcı içeriği barındıran uygulamalarda Apple filtre + bildir + engelle + iletişim ister.
- **Öneri:** `update_profile`'a Türkçe/İngilizce yasaklı kelime listesi (normalize edilmiş, `ı/i`, `0/o` vb. eşlenmiş) → `bad_nickname`. Sıralama satırına uzun basınca "Takma adı bildir" (`report_nickname` RPC; 3 bildirimde ad "Oyuncu" yapılır ve admin'e Telegram). Bu yapılana kadar `age-rating.md` cümlesi düzeltilir.

#### O8. "Apple ile giriş yap" düğmesi Apple'ın standart düğmesi değil
- **Dosya:** `app/src/app/settings.tsx:101`
- **Sorun:** Özel Font (Inter) içinde `` (U+F8FF) logosuyla çizilmiş genel bir düğme. Apple HIG resmi düğmeyi (veya birebir kurallara uyan özel düğmeyi) ister; inceleme bunu 4.0/4.8 kapsamında reddedebilir.
- **Öneri:** `<AppleAuthentication.AppleAuthenticationButton buttonType={SIGN_IN} buttonStyle={scheme === "dark" ? WHITE : BLACK} cornerRadius={27} style={{ height: 54 }} onPress={() => signIn(signInWithApple)} />`

#### O9. İnternetsiz ilk açılışta RevenueCat ve PostHog kimliği hiç kurulmuyor
- **Dosya:** `app/src/lib/appState.tsx:33-38`
- **Sorun:** `ensureSession` ilk denemede başarısız olursa `identify` ve `configurePurchases` bir daha çağrılmaz; kullanıcı internet gelince oynar ama uygulama yeniden başlatılana kadar Pro ekranı "Mağaza bağlantısı kurulamadı" der ve olaylar kimliksiz gider.
- **Öneri:** K1/K2'deki `onAuthStateChange` + `syncIdentity` çözümü bunu da kapatır; ya da `refresh` başarılı olduğunda `if (!purchasesReady()) configurePurchases(m.id)`.

#### O10. Bildirim izni ve push token sadece dar bir anda isteniyor/kaydediliyor
- **Dosya:** `app/src/app/summary.tsx:43` (`m.days_completed === 1`), `app/src/lib/notifications.ts:58-78`
- **Sorun:** İzin sadece tamamlanan gün sayısı tam 1 iken soruluyor: başka cihazda giriş yapan (gün sayısı >1) veya ilk turu meydan okumayla bitiren kullanıcıya hiç sorulmayabilir. Push token yalnızca izin anında kaydediliyor; token yenilenirse, izin sonradan Ayarlar'dan verilirse veya kullanıcı giriş yapıp kimliği değişirse sunucudaki token eskir.
- **Öneri:** `if (m && m.days_completed >= 1 && !(await prefs.notifAsked()))`. Uygulama her açıldığında izin verilmişse `registerPushToken()` çağır (ucuz, idempotent); `Notifications.addPushTokenListener` ile yenilemeleri yakala.

#### O11. Metin kontrastı WCAG AA altında (Plan 5.2)
- **Dosya:** `app/src/lib/theme.ts:9` (`inkFaint #9C8E79` açık zeminde **2,68:1**), `:33` (karanlıkta `#7D705E` 3,90:1), `accent` üzerinde `accentSoft` 3,92:1 (Pro rozeti, etkin ipucu çipi)
- **Sorun:** `faint` metinler (alt bilgi, geri sayım altı notlar, harita yıl etiketleri, yer tutucular) küçük puntoda 4,5:1'in altında.
- **Öneri:** Açık `inkFaint: "#756751"` (4,60:1), karanlık `inkFaint: "#908370"` (5,08:1). `accentSoft` zemindeki metin için açıkta `#963520` (5,38:1) veya `ink`.

#### O12. Harita ekran okuyucuyla kullanılamıyor
- **Dosya:** `app/src/components/TurkeyMap.tsx:167-195`, `app/src/app/play.tsx` (harita alanı)
- **Sorun:** İğne bırakmak sadece dokunma hareketiyle mümkün; VoiceOver/TalkBack kullanıcısı tahmin yapamaz, "Tahmin et" hep pasif kalır.
- **Öneri:** `AccessibilityInfo.isScreenReaderEnabled()` true ise haritanın altında "İl seç" düğmesi: 81 ilin listesi (`MAP.provinces` + il merkezi koordinatı) → seçilen ilin merkezine iğne. Haritaya `accessibilityLabel="Türkiye haritası. İğne bırakmak için il seç düğmesini kullan."`

#### O13. Pro ekranı mağaza fiyatı gelmeden "6 $" gösteriyor
- **Dosya:** `app/src/app/pro.tsx:37`, `:40`, `:91`; `app/src/lib/config.ts:20`
- **Sorun:** Teklifler yüklenmeden düğme "Pro'yu aç · 6 $" der; Türkiye'de gerçek fiyat TL'dir ve farklıdır. Teklif hiç gelmezse (ürün "Ready to Submit" değil, ağ yok) inceleme ekibi satın alamaz ve sadece "Mağaza bağlantısı kurulamadı" görür.
- **Öneri:** `pkg` yokken düğmeyi pasif ve "Fiyat yükleniyor…" göster; hata durumunda "Tekrar dene" ile `proPackage()` yeniden çağrılsın. Sabit fiyat metnini kaldır.

### Düşük

| # | Dosya:satır | Sorun | Öneri |
| --- | --- | --- | --- |
| D1 | `app/src/app/play.tsx:254-257` | "Bu bilgi yanlış mı?" bildirimi başarısız olsa da "Bildirimin bize ulaştı" deniyor | `catch`'te "Gönderilemedi, tekrar dene" göster; `setSent(true)` sadece başarıda |
| D2 | `app/src/app/summary.tsx:57` | Hata ekranındaki "Tekrar dene" `challenge` parametresini düşürüyor; meydan okuma karşılaştırması kayboluyor | `params: { day: dayParam ?? "", challenge: challenge ?? "" }` |
| D3 | `app/src/app/summary.tsx:31-52` | Sıralama/meydan okuma/istatistik isteklerinden biri hata verirse tüm özet ekranı hata olur | Zorunlu olan sadece `api.day`; diğerlerini ayrı `try` ile sar |
| D4 | `app/src/app/index.tsx:48-54` | Ana ekrandaki "Meydan oku" hatası `catch {}` ile yutuluyor; kullanıcı hiçbir şey görmüyor | `Alert.alert("Meydan okuma", errorText(e))` |
| D5 | `app/src/app/index.tsx:36-38` | Gün dönüşünden sonra `refresh` başarısızsa (internet yok) her saniye yeniden deneniyor | Son deneme zamanını `useRef`'te tut, en çok 15 sn'de bir dene |
| D6 | `app/src/app/settings.tsx:82`, `:42-46`, `:114` | "Sıralamada görün" anahtarı, saat seçimi ve `mailto` hataları yakalanmıyor (sessiz başarısızlık) | `try/catch` + `setErr`; `mailto` açılamazsa `WebBrowser.openBrowserAsync(LINKS.support)` |
| D7 | `app/src/app/settings.tsx:51-61`, `app/src/lib/api.ts:40-45` | Hesap silmede yükleniyor durumu yok (çift dokunma), eski `me` ekranda kalıyor; Edge Function hata mesajı "Bir şeyler ters gitti"e düşüyor; RevenueCat/PostHog kayıtları silinmiyor | Düğmede `loading`; silme sonrası `me`'yi temizle; fonksiyonda RevenueCat `DELETE /v1/subscribers/{id}` ve PostHog kişi silme (gizlilik politikasıyla tutarlı) |
| D8 | `app/src/app/_layout.tsx:31-39`, `app/src/lib/notifications.ts:51`, `supabase/functions/push-notify/index.ts:29` | Bildirim verisi `url` anahtarıyla gönderiliyor, dinleyici `path` okuyor; uygulama kapalıyken dokunulan bildirim yakalanmıyor (`notification_opened` eksik sayılır); fontlar yüklenmeden `router.push` çağrılabilir | Tek anahtar (`url`) + `Linking.openURL`/`router.push`; `Notifications.useLastNotificationResponse()` kullan |
| D9 | `app/src/lib/notifications.ts:40-45` | 00:00–04:00 arası oynayan kullanıcı için (oyun günü hâlâ dün) bugünkü hatırlatıcı atlanıyor; cihaz saati yurt dışında Türkiye saatinden farklı | Hedef zamanı sunucudaki `me.next_rollover`'a göre hesapla: oynandıysa ilk hatırlatma `next_rollover` sonrası, oynanmadıysa `next_rollover`'dan önceki ilk uygun saat |
| D10 | `app/src/app/play.tsx:130`, `app/src/app/duel/index.tsx:70`, `app/src/app/duel/[id].tsx:134`, `app/src/app/pro.tsx:33` | `paywall_viewed` iki kez gönderiliyor (hem tetikleyen ekranda hem Pro ekranında); Pro dönüşüm hunisi şişer | Sadece `pro.tsx`'te gönder (`from` zaten taşınıyor) |
| D11 | `app/src/app/duel/index.tsx:25` | `duel_matched` olayında Plan 10.2'nin istediği rakip türü (oyuncu/admin/bot) yok | Bot bilgisini istemciye açmamak için olayı sunucudan (PostHog capture API) gönder |
| D12 | `app/src/app/challenge/[code].tsx:16` | `challenge_opened` kendi meydan okuman ve elle girilen kod için de `source: "link"` ile gidiyor | `source` parametresini rotadan al (`m/[code]` → link, `code` → manual), `is_mine` iken gönderme |
| D13 | `app/src/app/index.tsx:28-33`, `app/src/lib/prefs.ts:7` | `pendingChallenge` hiçbir yerde yazılmıyor (ölü kod) | Kaldır veya karşılamada "sonra" seçeneği için kullan |
| D14 | `app/src/components/YearSlider.tsx:14`, `:20` | `last` ref'i dışarıdan gelen `value` ile eşitlenmiyor; yeni fotoğrafta yıl sıfırlanınca, kullanıcı önceki yıla sürüklerse `onChange` tetiklenmiyor | Her render'da `last.current = value` (veya `useEffect`) |
| D15 | `app/src/lib/share.ts:26` | iOS'ta hem `message` (link içinde) hem `url` veriliyor; bazı hedefler metni atıp sadece linki paylaşıyor veya linki iki kez gösteriyor | `Share.share({ message })` (link zaten mesajda) |
| D16 | `app/src/components/ui.tsx:119` | `ErrorState` başlığı her hatada "Bağlantı kurulamadı" (ör. "Bugünün fotoğrafları hazırlanıyor" için yanlış) | `title` prop'u; ağ hatası değilse "Bir sorun oluştu" |
| D17 | `app/src/components/Photo.tsx:26`, `app/src/app/summary.tsx:103`, `app/src/app/archive.tsx:31`, `app/src/app/duel/index.tsx:43-49` | İnternetsiz: fotoğraf siyah kutu kalıyor (hata/yeniden dene yok); arşiv `me` yoksa sonsuz yükleniyor; 1v1 aramasında yoklama hataları sessiz, uygulama arka plana gidince sıra iptal edilmiyor | `Image onError` → "Fotoğraf yüklenemedi · Tekrar dene"; arşivde `ErrorState`; arama ekranında 3 ardışık hatada uyarı, `AppState` "background"da `duelCancel` |
| D18 | Erişilebilirlik: `app/src/app/settings.tsx:153` (çip 36 pt, hitSlop yok), `app/src/app/leaderboard.tsx:65` (sekme 40 pt), `app/src/components/Reveal.tsx:66` ve `:79-86` (12 pt satır içi linkler, ~40 pt), `app/src/app/play.tsx:288` (ipucu çipi 36+4), `app/src/app/_layout.tsx:21-28` (font hatası yok sayılıyor), `app/src/app/duel/[id].tsx` (düelloda çıkış yok; Android geri tuşu onaysız çıkarıyor) | Plan 5.2: en az 44 pt. Font yükleme hatasında splash'te takılma. Büyük yazı boyutunda (`allowFontScaling`) oyun paneli taşabilir | `minHeight: 44` veya `hitSlop`; `const [loaded, fontErr] = useFonts(…); if (!loaded && !fontErr) return null;`; düelloya onaylı "Maçtan çık" + `BackHandler`; büyük metinde `maxFontSizeMultiplier={1.3}` |

---

## 4. Mağaza kuralları matrisi

| Kural | Durum | Not |
| --- | --- | --- |
| Apple 5.1.1(v) hesap silme | ⚠️ | Uygulama içi silme var (Ayarlar → Hesabı sil), web talebi var. **Apple token iptali yok (Y2).** RevenueCat kimliği silme sonrası eski kalıyor (K2). |
| Apple 3.1.1 IAP + geri yükleme | ⚠️ | RevenueCat, tüketilmeyen `pro_lifetime`, "Satın alımı geri yükle" Pro ekranında. Kimlik ve webhook sorunları (K1, K2, Y1) inceleme sırasında "satın aldım ama açılmadı" sonucunu doğurabilir. IAP sürüm sayfasına eklenmeli (checklist A9). |
| Apple 4.8 Sign in with Apple | ✅ / ⚠️ | Google sunulduğunda iOS'ta Apple da sunuluyor. Düğme standart değil (O8). |
| Apple 2.1 tamlık | ⚠️ | İnceleme günlerinde program dolu olmalı (checklist 0); teklifler yüklenemezse satın alma çalışmaz (O13). Demo modu (`EXPO_PUBLIC_DEMO`) production'a girmemeli. |
| Apple 1.2 kullanıcı içeriği | ⚠️ | Takma adlar: filtre/bildir/engelle yok (O7). |
| Apple 5.1.2 / gizlilik, ATT | ✅ | İzleme yok, ATT gerekmiyor, gizlilik manifesti var. Analitik için uygulama içi "kapat" seçeneği yok; KVKK açısından Ayarlar'a "Anonim kullanım verisi gönder" anahtarı (`ph.optOut()`) önerilir. Crash Data beyanı Y3 düzelince gerçek olur. |
| Apple 4.2/4.3 | ✅ | Özgün içerik ve tasarım, inceleme notu açık. |
| Şifreleme (ITSAppUsesNonExemptEncryption) | ✅ | `false` |
| Play Data safety | ✅ / ⚠️ | Form tutarlı; "Kilitlenme günlükleri" Y3 düzelince doğru olur. AD_ID manifestte doğrulanmalı. |
| Play hesap silme | ✅ | Uygulama içi + `/hesap-silme/` |
| Play UGC | ⚠️ | O7 |
| Play hedef API, izinler | ✅ | SDK 58 güncel hedef API; mikrofon, medya, konum izinleri engelli |
| Play mağaza metni | ⚠️ | Uzun açıklama "Google ile giriş" diyor; production build'de Google girişi açık değilse metinden çıkarılmalı |

## 5. Plan 7.3 durum tablosu (kod incelemesine göre; cihaz testi bekliyor)

| Madde | Kod durumu | Engelleyen bulgu |
| --- | --- | --- |
| Gerçek cihazda günlük oyun, 04:00 gün dönüşü ve bildirim | Hazır | D9 (00–04 arası hatırlatıcı), O6 (Android push) |
| 1v1: gerçek oyuncu, admin (60 sn), bot (120 sn) | Hazır | O2 (hata görünmüyor), Y6 (admin linki AASA'ya bağlı) |
| Meydan okuma linki yüklüyken / yüklü değilken | Hazır | Y6, O3 |
| Pro satın alma ve geri yükleme (sandbox) | Riskli | K1, K2, Y1, O13 |
| Hesap silme | Kısmen | Y2, K2, D7 |
| Her fotoğrafın atfı | ✅ | Açılım, 1v1 açılımı ve Kaynaklar ekranında eser sahibi + kaynak linki + lisans linki |
| Gizlilik, koşullar, destek URL'leri | ✅ | Linkler `/gizlilik` biçiminde (sonda `/` yok); Vercel bir yönlendirme ekler, çalışır |
| İnternet yokken çökmüyor, anlaşılır mesaj | Kısmen | Çökme yolu bulunmadı; mesajlar Türkçe ve anlaşılır. Ama O1 (tekrar dene çalışmıyor), O2, D1, D17 |
| Çökme ve analitik olayları PostHog'a | Kısmen | Olaylar ✅ (Plan 10.2 listesinin tamamı tanımlı); çökme ❌ (Y3) |

## 6. Plan ile tutarlılık

| Plan maddesi | Durum |
| --- | --- |
| 2.1 Tam ekran, yakınlaştırılabilir fotoğraf; tahmin sonrası tekrar açma | ✅ (Android'de O5'i doğrula) |
| 2.1 Yıl aralığı havuzdaki en eski yıldan bu yıla | ✅ günlük oyunda sunucudan (`min_year`, `max_year`); 1v1'de sabit 1880–bu yıl |
| 2.2 Puanlama 500+500, tam isabet bonusu | ✅ sunucuda; `geo.ts`'teki kopya sadece demo için |
| 2.3 Seri ana ekranda büyük, Wordle tarzı paylaşım, günlük sıralama | ✅ |
| 2.4 Meydan okuma linki ve ertelenmiş derin link (6 haneli kod + pano) | ✅ |
| 2.5 1v1: 45 sn, "Tahmini bekleme: 1–2 dk", bot bildirimi | ✅ |
| 2.6 Pro sadece doğal anlarda; oyun ortasında ödeme ekranı yok | ✅ (ipucu çipi, arşiv, 3. maç; Ayarlar ve İstatistik'te pasif bağlantı) |
| 2.7 Hatırlatıcı saati son 7 günün ortancası, 09:00–24:00, yoksa 20:00; izin ilk turun sonunda | ✅ (D9, O10) |
| 2.7 Sunucu bildirimleri: "meydan okuma geldi", "arkadaşın skorunu geçti" | ❌ Sadece "seri tehlikede" var (`push-notify`); 1.1'e alınabilir, `DECISIONS.md`'ye yazılmalı |
| 2.8 Anonim oyun, Apple + Google girişi, uygulama içi silme | ✅ (K1, K2, Y2) |
| 5.2 Dokunma alanı ≥44 pt, WCAG AA, karanlık mod | Kısmen (O11, D18); karanlık mod ✅ |
| 5.3 Ekran listesi | ✅ Tüm ekranlar var. Karşılama 3 adımdan sonra ilk fotoğrafı oynatıyor |
| 6 Analitik kişiyi tanımlamaz | ✅ Olay özelliklerinde kişisel veri yok; kimlik rastgele Supabase UUID'si |
| 7.3 Çökmeler PostHog'a | ❌ Y3 |
| 8.4 Puan isteme: 3. gün + kendi ortalamasının üstü, puan kapısı yok | ✅ |
| 10.2 Olay listesi | ✅ (D10, D11, D12) |
| 13 "Bu bilgi yanlış mı?" düğmesi | ✅ (D1) |

## 7. Önerilen düzeltme sırası

1. K1 + K2 + O9 birlikte: `ensureSession` tekilleştirme + `onAuthStateChange` ile kimlik eşitleme (RevenueCat `logIn`, PostHog `identify`).
2. Y1 `sync-pro` Edge Function'ı.
3. Y3 PostHog error tracking + `ErrorBoundary`.
4. Y4 `projectId`/`owner` sabitleme; Y5 Supabase hız sınırı (panel ayarı) + `rate_limit` mesajı.
5. Y2 Apple token iptali.
6. Y6 AASA doğrulaması (alan adı bağlanınca).
7. O1, O2, O3 (küçük, hızlı düzeltmeler), O4, O5, O13.
8. O6 FCM, O7 takma ad denetimi, O8 Apple düğmesi, O10, O11, O12.
9. Düşük bulgular 1.0.x'te.
