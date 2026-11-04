# Mazi Türkiye · Expo uygulaması

Expo SDK 58 · Expo Router · React Native 0.88 · TypeScript. iOS (sadece iPhone), Android ve web önizleme.
Build, mağazaya gönderim ve OTA güncelleme EAS ile yapılır; Mac veya Android Studio gerekmez.

> Expo her SDK'da değişiyor. Bir Expo/EAS API'sine dokunmadan önce `https://docs.expo.dev/versions/v58.0.0/` belgelerine bak (bkz. `AGENTS.md`). Paket eklerken her zaman `npx expo install <paket>` kullan.

---

## 1. Yerel geliştirme

Gereksinim: Node 22 (EAS de `22.16.0` kullanır, bkz. `eas.json`), npm.

```bash
cd app
npm install
npx expo start            # QR kod: Expo Go veya development build; "w" ile web
npx expo start --web      # sadece web önizleme
```

- **Ortam değişkeni olmadan da açılır:** `src/lib/config.ts` Supabase URL'si ve publishable key için varsayılan değer taşır. Analitik, satın alma ve Google girişi ilgili anahtarlar yoksa sessizce kapalı kalır.
- **Yerelde EAS'teki değerleri kullanmak için:** `npx eas-cli@latest env:pull --environment development` → `app/.env.local` yazar (`.env.*` git'e girmez). Expo CLI `.env.local`'ı otomatik okur.
- **Expo Go sınırları:** Harita, oyun, açılım, sıralama Expo Go'da çalışır. Google ile giriş, Apple ile giriş ve gerçek satın alma için **development build** gerekir (RevenueCat Expo Go'da sadece önizleme modunda çalışır):

  ```bash
  npx eas-cli@latest build -p ios --profile development       # simülatör için: eas.json'a "ios": { "simulator": true } eklenebilir
  npx eas-cli@latest build -p android --profile development
  npx expo start --dev-client
  ```

- **Demo modu (sadece mağaza ekran görüntüleri):** `EXPO_PUBLIC_DEMO=1 npx expo start --web`. Sunucusuz, sabit verili oyun; ayrıntılar `src/lib/demo.ts` başındaki açıklamada. **Bu değişken hiçbir EAS ortamına (özellikle `production`) eklenmez.**

### Kontroller

```bash
npx tsc --noEmit          # veya: npm run typecheck
npx expo lint             # veya: npm run lint (ilk çalıştırmada ESLint yapılandırmasını kurar ve package.json'a ekler)
npx expo-doctor           # bağımlılık ve yapılandırma teşhisi (expo.dev ve reactnative.directory'ye ağ erişimi ister)
npx expo config --type public          # çözümlenmiş app.config çıktısı (ortam değişkenleri doğru okunuyor mu?)
npx expo export --platform web --output-dir /tmp/mazi-web   # JS paketinin derlendiğini doğrular
```

---

## 2. Ortam değişkenleri

`app.config.ts` aşağıdaki değişkenleri okur ve `extra` alanına koyar; uygulama bunları `src/lib/config.ts` üzerinden kullanır.

> **`EXPO_PUBLIC_` ile başlayanlar JS paketine gömülür, yani gizli değildir.** Bu yüzden buraya sadece istemcinin zaten bilmesi gereken *public* anahtarlar girer. Supabase `service_role`/secret key, RevenueCat secret key, Google OAuth client secret gibi değerler **asla** buraya yazılmaz.

| Değişken | Ne | Nereden alınır | Zorunlu mu |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase proje adresi (`https://ybhiddgwunzyquzrbzaf.supabase.co`) | Supabase Dashboard → Project Settings → Data API → Project URL | Hayır (varsayılan `config.ts`'de), ama production'da açıkça girilmeli |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase **publishable** key (`sb_publishable_…`) | Supabase Dashboard → Project Settings → API Keys → Publishable key | Hayır (varsayılan var), production'da açıkça girilmeli |
| `EXPO_PUBLIC_DOMAIN` | Web alan adı, şemasız (`maziturkiye.com`). iOS `associatedDomains`, Android `intentFilters`, paylaşım linkleri ve yasal sayfa linkleri bundan üretilir | Alan adı (HUMAN_TODO madde 9). Alınana kadar `maziturkiye.vercel.app` | Hayır (varsayılan `maziturkiye.com`). **Değişirse yeni native build gerekir**, OTA yetmez |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Ayarlar → Destek'in e-posta adresi | Proje e-postası (HUMAN_TODO madde 9) | Hayır (varsayılan `destek@maziturkiye.com`) |
| `EXPO_PUBLIC_POSTHOG_KEY` | PostHog Project API key (`phc_…`) | PostHog (EU bölgesi) → Project settings → Project API key | Hayır. Yoksa analitik kapalı |
| `EXPO_PUBLIC_POSTHOG_HOST` | PostHog sunucusu | EU için `https://eu.i.posthog.com` | Hayır (varsayılan EU) |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat App Store uygulamasının public SDK anahtarı (`appl_…`) | RevenueCat → Project → API keys → App Store app | iOS'ta satın alma için evet |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat Play Store uygulamasının public SDK anahtarı (`goog_…`) | RevenueCat → Project → API keys → Play Store app | Android'de satın alma için evet |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Google OAuth **Web** istemcisinin Client ID'si (`…apps.googleusercontent.com`). ID token'ın hedefi; aynı ID Supabase Google sağlayıcısına da girilir | Google Cloud Console → APIs & Services → Credentials → OAuth client ID (Web application) | Hayır. **Boşsa Google ile giriş düğmesi gizlenir** (iOS'ta ayrıca aşağıdaki iki değişken de gerekir) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Google OAuth **iOS** istemcisinin Client ID'si (bundle ID `com.maziturkiye.app`) | Google Cloud Console → Credentials → OAuth client ID (iOS) | iOS'ta Google girişi için evet |
| `GOOGLE_IOS_URL_SCHEME` | iOS istemcisinin ters çevrilmiş ID'si: `com.googleusercontent.apps.<…>`. Sadece build sırasında okunur; **tanımlıysa** `@react-native-google-signin/google-signin` config plugin'i eklenir, URL şeması Info.plist'e yazılır ve `extra.googleIosUrlScheme: true` olur | Google Cloud Console → iOS OAuth istemcisi → "iOS URL scheme" | iOS'ta Google girişi için **evet**. iOS'ta düğme sadece Web client ID + iOS client ID + bu değişkenin üçü de varsa görünür (`src/lib/auth.ts` → `googleConfigured`); biri eksikse düğme gizlenir, uygulama çökmez |
| `GOOGLE_SERVICES_JSON` | Firebase `google-services.json` dosyası (EAS'te **dosya** türünde değişken; değeri build makinesindeki dosya yolu olur). Tanımlıysa `android.googleServicesFile` olarak eklenir | Firebase Console → Android uygulaması `com.maziturkiye.app` → `google-services.json` | Android'de sunucu bildirimi (Expo push, FCM V1) için **evet**. Yoksa Android'de sadece yerel hatırlatıcı çalışır |
| `EAS_PROJECT_ID` | Expo projesinin UUID'si. `updates.url` (OTA) ve `extra.eas.projectId` (Expo push token) bundan üretilir | `npx eas-cli@latest init` çıktısı veya expo.dev → proje → Overview → Project ID | **Evet.** Yoksa build'de OTA adresi olmaz ve push token kaydı atlanır (uygulama çökmez; `src/lib/notifications.ts` önce `extra.eas.projectId`'ye, sonra EAS build'in yazdığı `Constants.easConfig.projectId`'ye bakar, ikisi de yoksa sadece yerel hatırlatıcı çalışır). EAS build sırasında eksikse `app.config.ts` build günlüğüne uyarı yazar |
| `EXPO_OWNER` | Projenin sahibi olan Expo hesabı veya organizasyon kullanıcı adı | expo.dev hesabı | Evet (EAS projeyi bu sahiplikle bulur) |

Uygulama koduna dışarıdan giren tek diğer değişken `EXPO_PUBLIC_DEMO` (yukarıda, sadece ekran görüntüsü için).

### EAS ortam değişkeni olarak tanımlamak

EAS'te üç ortam var: `development`, `preview`, `production`. `eas.json`'daki her build profili kendi ortamını kullanır (`"environment": "production"` vb.), `eas update` de `--environment` ile aynı değerleri okur.

Görünürlük seçimi:
- `EXPO_PUBLIC_*` → `--visibility plaintext` (pakete gömüldükleri için gizlemek anlamsız; `secret` görünürlüğü yerel `eas update` sırasında okunamaz).
- `EAS_PROJECT_ID`, `EXPO_OWNER`, `GOOGLE_IOS_URL_SCHEME` → `plaintext` veya `sensitive`.

Her ortamda aynı değeri alacak değişkenler (önce `cd app`):

```bash
P=(--environment development --environment preview --environment production --visibility plaintext --scope project --non-interactive)

npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL           --value "https://ybhiddgwunzyquzrbzaf.supabase.co" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_KEY           --value "sb_publishable_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_DOMAIN                 --value "maziturkiye.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPPORT_EMAIL          --value "destek@maziturkiye.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_HOST           --value "https://eu.i.posthog.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_IOS_KEY     --value "appl_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value "goog_…" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID   --value "….apps.googleusercontent.com" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID   --value "….apps.googleusercontent.com" "${P[@]}"
npx eas-cli@latest env:create --name GOOGLE_IOS_URL_SCHEME              --value "com.googleusercontent.apps.…" "${P[@]}"
npx eas-cli@latest env:create --name EAS_PROJECT_ID                     --value "<uuid>" "${P[@]}"
npx eas-cli@latest env:create --name EXPO_OWNER                         --value "<expo-kullanıcı-adı>" "${P[@]}"

# Android push (FCM V1): dosya türünde, sadece build ortamlarında
npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --environment production --environment preview --visibility secret --scope project --non-interactive
```

Ortama göre farklı değer alacak değişkenler ayrı ayrı girilir. Örnek: development ve preview'daki analitik olaylarının üretim verisini kirletmemesi için PostHog'da ayrı bir "Mazi Türkiye (dev)" projesi:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_DEV…"  --environment development --visibility plaintext --non-interactive
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_DEV…"  --environment preview     --visibility plaintext --non-interactive
npx eas-cli@latest env:create --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_PROD…" --environment production  --visibility plaintext --non-interactive
```

Kontrol ve değiştirme:

```bash
npx eas-cli@latest env:list --environment production
npx eas-cli@latest env:update --environment production                             # etkileşimli: değişkeni seç, yeni değeri gir
npx eas-cli@latest env:pull --environment development                               # .env.local'a indirir
```

Aynı arayüz expo.dev → proje → **Environment variables** sayfasında da var.

> **Tavuk-yumurta notu (`EAS_PROJECT_ID`, `EXPO_OWNER`):** EAS CLI, sunucudaki ortam değişkenlerini indirebilmek için önce projeyi tanımalıdır; proje kimliğini de `app.config.ts`'den okur. Bu iki değer sadece EAS'te tanımlıysa CLI projeyi bulamaz ve yeni proje açmayı önerebilir. Çözüm: eas komutlarını çalıştırdığın terminalde de tanımla
> (`export EAS_PROJECT_ID=<uuid> EXPO_OWNER=<kullanıcı>`) veya (önerilen) bu iki değeri gizli olmadıkları için `app.config.ts`'e sabit yaz (bkz. `store/qa-report.md`).

---

## 3. EAS Build

İlk kurulum (bir kez; Apple ve Google adımları HUMAN_TODO madde 5–6):

```bash
cd app
npx eas-cli@latest login
npx eas-cli@latest init            # dinamik config olduğu için projectId'yi yazdırır → EAS_PROJECT_ID
npx eas-cli@latest credentials     # iOS: dağıtım sertifikası + provisioning profile (Apple ID + 2FA ister)
                                   # Android: ilk build'de upload keystore'u EAS üretir ve saklar
```

- iOS App ID'nin yetenekleri (Sign in with Apple, Associated Domains, Push Notifications) EAS build sırasında `app.config.ts`'den eşitlenir.
- Sürüm numaraları: `eas.json` → `appVersionSource: "remote"` ve production'da `autoIncrement: true`. Yani `buildNumber` / `versionCode` EAS sunucusunda tutulur ve her production build'de artar; `app.config.ts`'deki `buildNumber: "1"` ve `versionCode: 1` dikkate alınmaz. Mağazada görünen sürüm `app.config.ts` → `version` (`1.0.0`); her mağaza sürümünde elle artırılır.

Build komutları:

```bash
# Production (mağaza): iOS .ipa, Android .aab
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest build -p android --profile production
npx eas-cli@latest build -p all --profile production

# Preview (dahili dağıtım: Android .apk, iOS ad hoc; iOS için cihazları önce kaydet: npx eas-cli@latest device:create)
npx eas-cli@latest build -p android --profile preview

# Development client
npx eas-cli@latest build -p ios --profile development
```

Expo bağlantısı (MCP) üzerinden aynı işler `build_run` ve `build_submit` ile yapılabilir.

---

## 4. Mağazaya gönderim (EAS Submit)

Önce:
- `eas.json` → `submit.production.ios.ascAppId` içindeki `SET_AFTER_APP_STORE_CONNECT_RECORD` yerine App Store Connect'teki **Apple ID** (App Information sayfasındaki 10 haneli sayı) yazılır.
- iOS: App Store Connect API anahtarı (Users and Access → Integrations → App Store Connect API, rol "App Manager"). EAS ilk `submit`'te ister ve saklar.
- Android: Google Play **service account JSON** anahtarı (Google Cloud'da service account → Play Console → Users and permissions'ta davet, sürüm yayınlama izni). EAS ilk `submit`'te ister.
- **Android'de ilk AAB Play Console'a elle yüklenir** (Google API'si ilk yüklemeyi kabul etmez). İlk production build'in `.aab` dosyasını EAS'ten indirip Play Console → Test and release → Internal testing → Create release ile yükle; sonrakiler `eas submit` ile gider.

```bash
# iOS: en son production build'i App Store Connect'e (TestFlight) yükler
npx eas-cli@latest submit -p ios --profile production --latest

# Android: eas.json'a göre "internal" kanalına taslak (draft) olarak yükler
npx eas-cli@latest submit -p android --profile production --latest

# Build ve gönderim tek komutta
npx eas-cli@latest build -p ios --profile production --auto-submit
```

Android kapalı test ve production kanalları Play Console'da, iç testten "promote" edilerek yönetilir (bkz. `store/release-checklist.md`).

---

## 5. OTA güncellemeler (EAS Update)

Sadece JS ve asset değişiklikleri OTA ile gönderilebilir. `runtimeVersion: { policy: "appVersion" }` olduğu için bir güncelleme yalnızca **aynı `version`** (ör. `1.0.0`) ile build edilmiş uygulamalara ulaşır.

```bash
cd app
npx eas-cli@latest update --channel production --environment production --message "Açılım ekranında yazım düzeltmesi"
npx eas-cli@latest update --channel preview    --environment preview    --message "…"   # önce preview kanalında dene
npx eas-cli@latest update:list
npx eas-cli@latest update:rollback                                              # sorunlu güncellemeyi geri al
```

- `--environment production` vermek önemlidir: `EXPO_PUBLIC_*` değerleri güncellemenin JS paketine o anda gömülür. Unutulursa güncelleme varsayılan değerlerle (analitik/satın alma anahtarı olmadan) yayınlanır.
- `updates.url` sadece build sırasında `EAS_PROJECT_ID` tanımlıysa yapılandırmaya girer. Build'den önce kontrol: `EAS_PROJECT_ID=<uuid> npx expo config --type public | grep -A2 updates`.
- **Yeni native build gerektiren değişiklikler:** yeni paket veya config plugin, izinler, `app.config.ts`'deki native alanlar (`associatedDomains`, `intentFilters`, `infoPlist`, ikon, splash), `EXPO_PUBLIC_DOMAIN` veya `GOOGLE_IOS_URL_SCHEME` değişikliği, Expo SDK yükseltmesi. Bunlarda `version` artırılır ve mağazaya yeni build gönderilir.

---

## 6. Evrensel linkler (iOS) ve App Links (Android)

Uygulama iki https link türünü açar:
- `https://<DOMAIN>/m/<KOD>`: arkadaşa meydan okuma (`src/app/m/[code].tsx` → `/challenge/<KOD>`)
- `https://<DOMAIN>/d/<token>`: admin'in Telegram'dan 1v1'e katılma linki (`src/app/d/[token].tsx`). Telegram butonları sadece https kabul ettiği için evrensel link şarttır.

Özel şema `maziturkiye://` de çalışır ama paylaşımda https link kullanılır. App yüklü değilse aynı adres web sayfasını açar; sayfa 6 haneli kodu gösterir ve panoya kopyalar, uygulama ilk açılışta kodu sorar (ertelenmiş derin link, `DECISIONS.md`).

### iOS (Associated Domains)

1. `app.config.ts` → `ios.associatedDomains: ["applinks:<DOMAIN>"]` (otomatik, `EXPO_PUBLIC_DOMAIN`'den).
2. `web/.well-known/apple-app-site-association` içindeki **`APPLE_TEAM_ID`** yer tutucusu, Apple Developer → Membership details → Team ID (10 karakter) ile değiştirilir. Sonuç: `"appIDs": ["ABCDE12345.com.maziturkiye.app"]`.
3. Dosya `https://<DOMAIN>/.well-known/apple-app-site-association` adresinden **HTTPS, 200, yönlendirmesiz** ve `Content-Type: application/json` ile dönmelidir. Apple'ın CDN'i yönlendirme takip etmez:

   ```bash
   curl -sI https://maziturkiye.com/.well-known/apple-app-site-association   # 200 + application/json olmalı, 301/308 olmamalı
   curl -s  https://app-site-association.cdn-apple.com/a/v1/maziturkiye.com # Apple'ın önbelleğe aldığı kopya
   ```

   `web/vercel.json`'daki `"trailingSlash": true` uzantısız dosyaları `/…/` adresine yönlendirebilir; yayından sonra mutlaka kontrol et (QA raporu).
4. Apple dosyayı kendi CDN'i üzerinden, uygulama yüklenirken ve sonra periyodik olarak çeker; değişikliğin yansıması saatler sürebilir. Değişiklik sonrası uygulamayı silip yeniden yükle ve TestFlight build'iyle test et.
5. Notlarda bir linke uzun basınca "Mazi Türkiye'de aç" çıkmalı; Safari'nin adres çubuğuna yazılan link evrensel link tetiklemez.

### Android (App Links)

1. `app.config.ts` → `android.intentFilters` (`autoVerify: true`, `https://<DOMAIN>/m/…` ve `/d/…`).
2. `web/.well-known/assetlinks.json` içindeki **`PLAY_APP_SIGNING_SHA256_FINGERPRINT`**, Play Console → Test and release → Setup → **App integrity** → App signing key certificate → **SHA-256** ile değiştirilir. Play'den yüklenen uygulamayı Google'ın imzası imzalar; EAS'in upload key'i değil.
3. Play dışından kurulan build'lerde (preview APK) de çalışması için EAS upload/keystore SHA-256'sı da diziye eklenir: `npx eas-cli@latest credentials -p android` → Keystore → SHA256 Fingerprint. Dizide birden fazla parmak izi olabilir.
4. Doğrulama:

   ```bash
   adb shell pm verify-app-links --re-verify com.maziturkiye.app
   adb shell pm get-app-links com.maziturkiye.app          # maziturkiye.com: verified olmalı
   ```

   Google'ın aracı: `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://maziturkiye.com&relation=delegate_permission/common.handle_all_urls`
5. Aynı Play imza **SHA-1**'i Google Cloud'daki Android OAuth istemcisine de girilir (Google ile giriş için).

> Alan adı değişirse (`maziturkiye.vercel.app` → `maziturkiye.com`): `EXPO_PUBLIC_DOMAIN` güncellenir, **yeni native build** alınır ve `.well-known` dosyaları yeni alan adında yayında olmalıdır.

---

## 7. Notlar ve sık takılınan yerler

- **Supabase'de anonim giriş açık olmalı.** Günlük oyun hesapsız oynanır; uygulama ilk RPC'den önce `signInAnonymously()` çağırır (`src/lib/supabase.ts`). Dashboard → Authentication → Sign In / Providers → **Allow anonymous sign-ins** kapalıysa her ekran "Bağlantı kurulamadı" gösterir. Lansmandan önce Authentication → **Rate Limits**'te anonim giriş sınırını yükselt: varsayılan IP başına saatte 30'dur ve Türkiye'deki mobil operatörlerin ortak IP'leri (CGNAT) yüzünden lansman günü yeni kullanıcılar takılabilir. İstenirse CAPTCHA (Cloudflare Turnstile) eklenir.
  - `ensureSession()` tek uçuşludur: aynı anda gelen çağrılar tek bir anonim oturum açar (eskiden ilk açılışta iki anonim kullanıcı açılabiliyordu). Hız sınırına (HTTP 429) takılırsa 1,5 / 4 / 9 sn bekleyip yeniden dener; yine olmazsa ekranda "Şu an çok yoğunuz…" yazar ve "Tekrar dene" çıkar. İnternet yoksa beklemeden "İnternet bağlantısı yok gibi görünüyor…" der.
- **Kimlik eşitleme (`src/lib/identity.ts`):** Supabase kullanıcı kimliği her değiştiğinde (ilk anonim oturum, Apple/Google girişi, hesap silme sonrası yeni anonim oturum) `onAuthStateChange` ile PostHog `identify`, RevenueCat `configure`/`Purchases.logIn` ve push token kaydı aynı kimlikle yapılır. Hesap silinince (`SIGNED_OUT`) PostHog `reset` ve RevenueCat `logOut` çağrılır, ekrandaki eski veri temizlenir ve yeni anonim oturum açılır. İnternetsiz ilk açılışta kimlik, ilk başarılı `refresh`'te bağlanır.
- **Google ile giriş eklentisi sadece `GOOGLE_IOS_URL_SCHEME` tanımlıysa eklenir** (`app.config.ts`). Düğme Android'de `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` ile, iOS'ta ayrıca `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` ve `GOOGLE_IOS_URL_SCHEME` de tanımlıysa görünür; biri eksikse düğme gizlenir (eskiden iOS'ta görünüp URL şeması olmadığı için Google SDK uygulamayı çökertebiliyordu). Android için Google Cloud'da paket adı `com.maziturkiye.app` + Play imza SHA-1 (ve EAS keystore SHA-1) ile bir Android OAuth istemcisi gerekir; Android'de `google-services.json` gerekmez. Supabase → Authentication → Providers → Google: Web client ID + secret; "Authorized Client IDs" alanına iOS ve Android client ID'leri de eklenir. iOS'ta nonce hatası alınırsa "Skip nonce checks" açılır.
- **Apple ile giriş:** `ios.usesAppleSignIn: true`. Supabase → Providers → Apple → **Client IDs** alanına bundle ID `com.maziturkiye.app` eklenmelidir (native girişte token'ın hedefi budur); web için Services ID + key ayrıca girilir. Apple, Google girişi sunan uygulamada Apple ile girişi de zorunlu tutar (Kural 4.8); düğme iOS'ta her zaman görünür ve Apple'ın resmi `AppleAuthenticationButton`'ıdır.
  - **Hesap silmede Apple token iptali (App Store 5.1.1(v)):** Kullanıcı Apple ile bağlıysa, silme onayından sonra uygulama `AppleAuthentication.signInAsync()` ile taze bir `authorizationCode` alır ve `delete-account` fonksiyonuna gövdede `{ apple_authorization_code }` olarak gönderir; fonksiyon kodu refresh token'a çevirip Apple'da iptal eder. Bunun için Supabase secret'ları `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (Sign in with Apple anahtarının .p8 içeriği), isteğe bağlı `APPLE_CLIENT_ID` tanımlı olmalı. Kullanıcı Apple penceresini kapatırsa uygulama onay ister ve hesabı yine siler (Apple bağlantısı iPhone Ayarlar'ından kaldırılabilir).
- **Anonim → hesaplı geçiş:** Giriş öncesi "birleştirme bileti" alınır, girişten sonra bozdurulur ve skorlar, seri, Pro yeni hesaba taşınır (`src/lib/auth.ts`, `redeem_merge_ticket`).
- **RevenueCat:** Entitlement `pro`, Offering `default` → `$rc_lifetime` paketi → her iki mağazada `pro_lifetime` (bkz. `store/iap.md`). RevenueCat'te kullanıcı kimliği Supabase kullanıcı kimliğidir (girişte `logIn`, silmede `logOut`; bkz. kimlik eşitleme). Sunucudaki `profiles.is_pro`'yu `revenuecat-webhook` yazar; webhook URL'si ve Authorization başlığı RevenueCat panelinde tanımlı olmalıdır.
  - **İstemcide Pro = sunucu `is_pro` VEYA mağaza yetkisi:** `appState` her `refresh`'te, sunucu `is_pro: false` derse RevenueCat'e (`hasProLocally`, aynı kullanıcı kimliğiyle) sorar. Satın alma/geri yükleme sonrası Pro hemen açılır ve sunucu onaylayana kadar 2 sn → 90 sn arası artan aralıklarla yenilenir; webhook gecikse de ekran "Pro'yu aç"a geri dönmez. Sunucuda kapılanan özellikler (ipucu, arşiv, sınırsız 1v1) webhook gelince açılır; o arada ipucu "Pro'n etkinleştiriliyor…" der. Kalıcı çözüm için sunucu tarafı `sync-pro` fonksiyonu QA raporunda (Y1) açık iş.
  - Pro ekranı fiyatı mağazadan gelmeden sabit fiyat göstermez ("Fiyat yükleniyor…"); teklif gelmezse "Tekrar dene" çıkar. `PRO_PRICE_DEMO` sadece demo derlemesinde (ekran görüntüleri) kullanılır.
- **Bildirimler:** Günlük hatırlatıcı cihazda planlanan yerel bildirimdir (izin ilk turun sonunda istenir). Sunucu bildirimleri (seri tehlikede) Expo Push ile gider ve `EAS_PROJECT_ID` ister. iOS'ta push anahtarı `npx eas-cli@latest credentials` → Push Notifications ile eklenir. Android'de Expo push token'ı için Firebase (FCM V1) yapılandırması gerekir: Firebase projesi → Android uygulaması `com.maziturkiye.app` → `google-services.json` (`android.googleServicesFile`, EAS'e `--type file` ortam değişkeni olarak) ve FCM V1 service account anahtarı EAS credentials'a. `app.config.ts` bunu `GOOGLE_SERVICES_JSON` ortam değişkeni tanımlıysa ekler; Firebase projesi henüz açılmadı (QA raporu O6). Push token, izin verilmişse her kimlik değişiminde ve uygulama açılışında yeniden kaydedilir.
- **Harita ve fontlar uygulamaya gömülüdür;** internet yokken de açılır. Fotoğraflar Supabase Storage'ın görsel dönüştürme adresinden (WebP) gelir. İnternetsiz her ekranın yükleme yolu "Bağlantı kurulamadı" + "Tekrar dene" gösterir; yüklenemeyen fotoğraf siyah kutu yerine "Fotoğraf yüklenemedi · Tekrar dene" der.
- **Hata takibi:** PostHog `errorTracking.autocapture` (yakalanmamış hatalar ve reddedilen promise'ler; konsol kayıtları hariç) açıktır. Render hataları `src/app/_layout.tsx` → `ErrorBoundary` ile yakalanır: uygulama kapanmaz, "Beklenmeyen bir hata oldu" ekranı ("Tekrar dene", "Uygulamayı yeniden başlat") çıkar ve hata `captureException` ile gönderilir. Kişisel veri eklenmez. Native çökmeler için isteğe bağlı `@posthog/react-native-plugin` + `autocapture.nativeCrashes` (kurulu değil).
- **Takma ad süzgeci:** `src/lib/nickname.ts` Türkçe/İngilizce küfür ve hakaret listesini (Türkçe harf ve rakam ikameleri normalleştirilerek) kayıttan önce istemcide denetler. Sunucudaki `update_profile` henüz sadece uzunluk/karakter denetliyor; aynı listenin sunucuya eklenmesi açık iş (QA O7).
- **Web derlemesi** `<html lang="tr">` ile çıkar (`app.config.ts` → `web.lang`; statik çıktıya geçilirse `src/app/+html.tsx`). Büyük harfli etiketler bu sayede "İ" ile yazılır.
- **iPad yok:** `supportsTablet: false`. Sadece dikey yön.
- **Şifreleme beyanı:** `ITSAppUsesNonExemptEncryption: false` (sadece HTTPS). TestFlight'ta ihracat sorusu çıkmaz.
- **Gizlilik manifesti:** `ios.privacyManifests` (UserDefaults, CA92.1). Üçüncü taraf SDK'lar (PostHog, RevenueCat, Expo modülleri) kendi manifestlerini getirir. İzleme yok, ATT penceresi yok.
- **Android izinleri:** `RECORD_AUDIO`, `READ_MEDIA_IMAGES`, `ACCESS_FINE_LOCATION` engellenir. Build sonrası birleşik manifestte `com.google.android.gms.permission.AD_ID` olmadığını doğrula (Data safety formu reklam kimliği kullanılmıyor diyor).
