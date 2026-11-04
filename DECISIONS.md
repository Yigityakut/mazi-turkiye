# Karar kaydı

Biçim: `tarih · karar · gerekçe`. Bir karar değişirse eski satır silinmez, yeni satır eklenir.

| Tarih | Karar | Gerekçe |
| --- | --- | --- |
| 2026-11-04 | İsim: **Mazi Türkiye**. Mağaza başlığı "Mazi Türkiye: Tarih Tahmini". | "Neredeydi" başka bir Türk coğrafya oyununda kullanılıyor (kuthaygumus.github.io/neredeydi). Kullanıcı "Mazi"yi tek başına zayıf buldu, isimde "Türkiye" geçmesini istedi ve "Mazi Türkiye"yi önerdi. 12 karakter, iOS ana ekranında kesilmez. Aramada aynı adlı app bulunamadı. |
| 2026-11-04 | Kod adları: bundle ID / paket adı `com.maziturkiye.app`, URL şeması `maziturkiye`, alan adı hedefi `maziturkiye.com`, sosyal kullanıcı adı `@maziturkiye`. | Türkçe karakter içermeyen tek biçim; tüm platformlarda aynı. Alan adı ve kullanıcı adı müsaitliği konteynerden kontrol edilemedi (ağ kısıtı), HUMAN_TODO'da. |
| 2026-11-04 | Harita: MapLibre + OpenFreeMap yerine uygulamaya gömülü SVG Türkiye haritası (Natural Earth 1:10m il sınırları, kamu malı), pinch-zoom ile. | Çevrimdışı çalışır, üçüncü taraf kesinti riski (Bölüm 13) tamamen kalkar, Expo Go ve web'de çalışır (ekran görüntüsü üretimi), kağıt temalı tasarıma uyar, plan "sade harita: il sınırları + büyük şehirler" diyor. Doğruluk ~1 km; 5 km'lik oyun hassasiyetine yeter. İstanbul Boğazı elle eklendi. |
| 2026-11-04 | Supabase projesi: mevcut `timeguessr` (ref `ybhiddgwunzyquzrbzaf`, eu-central-1 Frankfurt). | Kullanıcı tarafından açılmış, boş, KVKK planına uygun AB bölgesinde. Yeni proje açmak ek ücret doğururdu. |
| 2026-11-04 | Gün sınırı SQL'de hesaplanır: `oyun_günü = (now() at time zone 'Europe/Istanbul' - 4 saat)::date`. pg_cron sadece programı doldurur ve uyarı verir. | Cron gecikse bile gün dönüşü saniyesinde doğru olur; tek doğruluk kaynağı. |
| 2026-11-04 | Fotoğraf toplama hattı Supabase Edge Function olarak çalışır (`pipeline-harvest`, `pipeline-ingest`). | Ajan konteyneri Wikimedia'ya erişemiyor; hat zaten haftalık otomatik çalışmalı (Bölüm 3.3), en doğal yeri sunucu. |
| 2026-11-04 | Görseller Wikimedia'nın 1600 px küçültme servisinden JPEG olarak alınır, Storage'a uuid adıyla yazılır; WebP'ye dönüşümü Supabase görsel dönüştürme (Pro) teslimatta yapar. | Edge function'da WebP kodlamak CPU limitine takılır; sonuç kullanıcı için aynı (WebP teslimat). Dosya adı uuid olduğu için cevap sızmaz. |
| 2026-11-04 | Bot tahmini il merkezlerine yuvarlanır (doğru cevap + Gauss sapma → en yakın il merkezi). | Bot asla denize veya yurt dışına iğne bırakmaz; insan gibi görünür. |
| 2026-11-04 | Anonim → Apple/Google hesabına geçişte "birleştirme bileti" kullanılır (anonim kullanıcı bilet alır, girişten sonra bileti bozdurur, veriler taşınır). | Supabase'in kimlik bağlama özelliğine bağımlı kalmadan güvenli veri taşıma. |
| 2026-11-04 | Pro durumu sunucuda `profiles.is_pro`; RevenueCat webhook'u yazar. İpucu sunucudan sadece Pro'ya döner. | İstemciye güvenilmez; ipucu cevabın parçasıdır. |
| 2026-11-04 | Pro fiyatı: Apple Tier $5.99 / Google 5,99 $ karşılığı. | Plan "6 $'a en yakın fiyat noktası". |
| 2026-11-04 | Font: Fraunces (başlık, sayılar) + Inter (metin). İkisi de SIL OFL, Türkçe karakter tam. | Arşiv sıcaklığı + modern okunurluk; ticari kullanım serbest. |
| 2026-11-04 | Web: `/web` altında bağımlılıksız statik site, Vercel'e deploy (`vercel.json`). Alan adı alınana kadar `maziturkiye.vercel.app`. | Framer'a ajan erişimi yok; statik site repo içinde sürümlenir. |
| 2026-11-04 | Ertelenmiş derin link: Meydan okuma linki `https://maziturkiye.com/m/<KOD>`; app yüklüyse universal link ile açılır, değilse web sayfası 6 haneli kodu gösterir ve panoya kopyalar; app ilk açılışta panoda veya elle girilen kodu sorar. | Planın önerdiği basit çözüm + pano kolaylığı. Üçüncü taraf SDK gerekmez. |
