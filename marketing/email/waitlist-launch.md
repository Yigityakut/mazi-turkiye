# Bekleme listesi e-postaları

Bekleme listesine yalnız iki e-posta gider: **iOS lansmanı (24 Kasım)** ve **Android lansmanı (~3 Aralık)**. Ardından liste silinir.

## Gönderim bilgileri

| Alan | Değer |
| --- | --- |
| Araç | Resend → Broadcasts. Audience, Supabase'deki `public.waitlist` tablosundan CSV olarak içe aktarılır. |
| Gönderen | `Mazi Türkiye <merhaba@maziturkiye.com>`. Alan adı Resend'de doğrulanmış olmalı (SPF, DKIM, isteğe bağlı DMARC). |
| Yanıt adresi | `destek@maziturkiye.com` |
| Zaman | **Salı 24 Kasım 2026, 09:30 TSİ.** İlk gün 04:00'te açılmış olur, insanlar uyanmıştır. Android e-postası Play'de yayın görüldükten sonra, aynı gün 10:00–11:00 arası. |
| Abonelikten çıkma | `{{{RESEND_UNSUBSCRIBE_URL}}}` (Resend Broadcast değişkeni). Ayrıca List-Unsubscribe başlığı. |
| Ölçüm | Site linklerinde `utm_source=email&utm_medium=email&utm_campaign=launch-2026`; App Store linkinde `ct=email-launch-2026`. |
| Doldurulacaklar | `‹APP_ID›` ve `‹PT›` (App Store Connect → kampanya linki), `‹Ad›`, `‹VERİ SORUMLUSU ADI›` |

**Yasal not.** Kayıt formu "E-posta adresini sadece lansman duyurusu için kullanırız" diyor. Bu iki e-posta o sözün kapsamında.

- Bülten ya da kampanya gibi başka bir e-posta için ayrı açık onay gerekir (6563 sayılı Kanun, ticari elektronik ileti).
- İYS kaydının gerekip gerekmediği, yasal metinlerle birlikte avukata sorulur (HUMAN_TODO 13).
- **Android e-postasından sonra:** Resend Audience silinir. `public.waitlist` tablosu da boşaltılır (`delete from public.waitlist;`, onayla). Bu, KVKK'daki "amacı gerçekleşen veri" ilkesine uygun.

---

## 1. Lansman e-postası (24 Kasım)

### Konu satırı seçenekleri

1. **Mazi Türkiye yayında: bu fotoğraf nerede?** (41 karakter, önerilen)
2. Beklediğin oyun bugün App Store'da (34)
3. İlk 5 fotoğraf seni bekliyor (28)
4. Bugün başlıyoruz: nerede, hangi yıl? (36)
5. Söz verdiğimiz e-posta: Mazi Türkiye çıktı (42)

Resend A/B testine izin verirse 1 ile 3 denenir.

### Ön izleme metni

`Her gün 5 gerçek fotoğraf. Ücretsiz, reklamsız. iPhone'da bugün, Android'de Aralık başında.`

### Gövde

> Merhaba,
>
> Bir süre önce maziturkiye.com'a e-postanı bırakıp "çıkınca haber ver" demiştin. Bugün o gün: **Mazi Türkiye App Store'da.**
>
> Oyun basit. Her sabah 04:00'te Türkiye'den 5 gerçek fotoğraf geliyor. Fotoğrafa bakıyorsun, haritaya iğneni bırakıyorsun, yılı seçiyorsun. Ne kadar yakınsan o kadar puan: fotoğraf başına en çok 1.000.
>
> **[ App Store'dan indir ]**
>
> Başlamadan önce üç küçük not:
>
> - **Herkes aynı 5 fotoğrafı oynuyor.** Turu bitirince "Meydan oku"ya dokun ve linki WhatsApp'tan bir arkadaşına gönder. O da aynı fotoğrafları oynar, skorlarınız yan yana çıkar.
> - **Her fotoğrafın bir hikayesi var.** Tahminden sonra fotoğrafın kısa hikayesini ve kaynağını görüyorsun. Fotoğrafların hepsi kamu malı ya da açık lisanslı arşivlerden geliyor; yapay zekâyla üretilmiş tek bir kare yok.
> - **Ücretsiz ve reklamsız.** Hesap açmadan oynayabilirsin. İstersen tek seferlik Pro ile ipuçları, geçmiş günlerin arşivi ve sınırsız 1v1 açılıyor. Abonelik yok.
>
> ‹İlk gün tematikse bu paragraf eklenir: Bugün aynı zamanda Öğretmenler Günü. İlk günün fotoğrafları eski mekteplerden; bütün öğretmenlerimize selam olsun.›
>
> **Android kullanıyorsan:** Google Play sürümü Aralık başında geliyor. Çıktığı gün sana tek bir e-posta daha atacağım, sonra bu listeyi sileceğim. Söz verdiğimiz gibi, başka e-posta yok.
>
> Bir fotoğrafın bilgisi yanlışsa, bir şey bozuksa ya da sadece ne düşündüğünü söylemek istersen bu e-postayı yanıtlaman yeterli. Hepsini ben okuyorum.
>
> İyi tahminler,
> ‹Ad›
> Mazi Türkiye'yi yapan kişi
>
> ---
> Bu e-postayı maziturkiye.com'daki lansman listesine kaydolduğun için aldın. ‹VERİ SORUMLUSU ADI› · destek@maziturkiye.com · [Listeden çık]

### HTML (Resend'e yapıştırmaya hazır)

```html
<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mazi Türkiye yayında</title></head>
<body style="margin:0;padding:0;background:#F2EADB;">
<span style="display:none;max-height:0;overflow:hidden;">Her gün 5 gerçek fotoğraf. Ücretsiz, reklamsız. iPhone'da bugün, Android'de Aralık başında.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F2EADB;">
<tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FBF7EF;border:1px solid #DCCFB8;border-radius:20px;">
<tr><td style="padding:32px 32px 8px;font:600 13px/1 Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#B8432A;">Mazi Türkiye</td></tr>
<tr><td style="padding:8px 32px 0;font:700 30px/1.15 Georgia,'Times New Roman',serif;color:#1E1913;">Bu fotoğraf nerede, hangi yıl?</td></tr>
<tr><td style="padding:16px 32px 0;font:16px/1.6 Arial,Helvetica,sans-serif;color:#1E1913;">
<p style="margin:0 0 14px;">Merhaba,</p>
<p style="margin:0 0 14px;">Bir süre önce maziturkiye.com'a e-postanı bırakıp "çıkınca haber ver" demiştin. Bugün o gün: <b>Mazi Türkiye App Store'da.</b></p>
<p style="margin:0 0 20px;">Oyun basit. Her sabah 04:00'te Türkiye'den 5 gerçek fotoğraf geliyor. Fotoğrafa bakıyorsun, haritaya iğneni bırakıyorsun, yılı seçiyorsun. Ne kadar yakınsan o kadar puan: fotoğraf başına en çok 1.000.</p>
</td></tr>
<tr><td align="center" style="padding:4px 32px 24px;">
<a href="https://apps.apple.com/tr/app/id‹APP_ID›?pt=‹PT›&amp;ct=email-launch-2026&amp;mt=8" style="display:inline-block;background:#B8432A;color:#FFF8EE;text-decoration:none;font:700 17px/1 Arial,Helvetica,sans-serif;padding:17px 30px;border-radius:999px;">App Store'dan indir</a>
</td></tr>
<tr><td style="padding:0 32px;font:16px/1.6 Arial,Helvetica,sans-serif;color:#1E1913;">
<p style="margin:0 0 10px;">Başlamadan önce üç küçük not:</p>
<p style="margin:0 0 10px;"><b>Herkes aynı 5 fotoğrafı oynuyor.</b> Turu bitirince "Meydan oku"ya dokun ve linki WhatsApp'tan bir arkadaşına gönder. O da aynı fotoğrafları oynar, skorlarınız yan yana çıkar.</p>
<p style="margin:0 0 10px;"><b>Her fotoğrafın bir hikayesi var.</b> Tahminden sonra fotoğrafın kısa hikayesini ve kaynağını görüyorsun. Fotoğrafların hepsi kamu malı ya da açık lisanslı arşivlerden geliyor; yapay zekâyla üretilmiş tek bir kare yok.</p>
<p style="margin:0 0 18px;"><b>Ücretsiz ve reklamsız.</b> Hesap açmadan oynayabilirsin. İstersen tek seferlik Pro ile ipuçları, geçmiş günlerin arşivi ve sınırsız 1v1 açılıyor. Abonelik yok.</p>
<!-- İlk gün tematikse: <p style="margin:0 0 18px;">Bugün aynı zamanda Öğretmenler Günü. İlk günün fotoğrafları eski mekteplerden; bütün öğretmenlerimize selam olsun.</p> -->
<p style="margin:0 0 18px;padding:14px 16px;background:#EDE3D1;border-radius:12px;"><b>Android kullanıyorsan:</b> Google Play sürümü Aralık başında geliyor. Çıktığı gün sana tek bir e-posta daha atacağım, sonra bu listeyi sileceğim. Söz verdiğimiz gibi, başka e-posta yok.</p>
<p style="margin:0 0 18px;">Bir fotoğrafın bilgisi yanlışsa, bir şey bozuksa ya da sadece ne düşündüğünü söylemek istersen bu e-postayı yanıtlaman yeterli. Hepsini ben okuyorum.</p>
<p style="margin:0 0 28px;">İyi tahminler,<br>‹Ad›<br><span style="color:#6A5D4C;">Mazi Türkiye'yi yapan kişi</span></p>
</td></tr>
</table>
<p style="max-width:560px;margin:16px auto 0;font:12px/1.5 Arial,Helvetica,sans-serif;color:#6A5D4C;">Bu e-postayı <a href="https://maziturkiye.com/?utm_source=email&amp;utm_medium=email&amp;utm_campaign=launch-2026&amp;utm_content=footer" style="color:#6A5D4C;">maziturkiye.com</a>'daki lansman listesine kaydolduğun için aldın. ‹VERİ SORUMLUSU ADI› · destek@maziturkiye.com · <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#6A5D4C;">Listeden çık</a></p>
</td></tr>
</table>
</body>
</html>
```

### Düz metin

```
Merhaba,

Bir süre önce maziturkiye.com'a e-postanı bırakıp "çıkınca haber ver" demiştin. Bugün o gün: Mazi Türkiye App Store'da.

Oyun basit. Her sabah 04:00'te Türkiye'den 5 gerçek fotoğraf geliyor. Fotoğrafa bakıyorsun, haritaya iğneni bırakıyorsun, yılı seçiyorsun. Ne kadar yakınsan o kadar puan: fotoğraf başına en çok 1.000.

App Store'dan indir:
https://apps.apple.com/tr/app/id‹APP_ID›?pt=‹PT›&ct=email-launch-2026&mt=8

Başlamadan önce üç küçük not:

- Herkes aynı 5 fotoğrafı oynuyor. Turu bitirince "Meydan oku"ya dokun ve linki WhatsApp'tan bir arkadaşına gönder. O da aynı fotoğrafları oynar, skorlarınız yan yana çıkar.
- Her fotoğrafın bir hikayesi var. Tahminden sonra fotoğrafın kısa hikayesini ve kaynağını görüyorsun. Fotoğrafların hepsi kamu malı ya da açık lisanslı arşivlerden geliyor; yapay zekâyla üretilmiş tek bir kare yok.
- Ücretsiz ve reklamsız. Hesap açmadan oynayabilirsin. İstersen tek seferlik Pro ile ipuçları, geçmiş günlerin arşivi ve sınırsız 1v1 açılıyor. Abonelik yok.

Android kullanıyorsan: Google Play sürümü Aralık başında geliyor. Çıktığı gün sana tek bir e-posta daha atacağım, sonra bu listeyi sileceğim. Söz verdiğimiz gibi, başka e-posta yok.

Bir fotoğrafın bilgisi yanlışsa, bir şey bozuksa ya da sadece ne düşündüğünü söylemek istersen bu e-postayı yanıtlaman yeterli. Hepsini ben okuyorum.

İyi tahminler,
‹Ad›
Mazi Türkiye'yi yapan kişi

--
Bu e-postayı maziturkiye.com'daki lansman listesine kaydolduğun için aldın.
‹VERİ SORUMLUSU ADI› · destek@maziturkiye.com
Listeden çık: {{{RESEND_UNSUBSCRIBE_URL}}}
```

---

## 2. "Android geldi" (~3 Aralık, listenin son e-postası)

### Konu satırı seçenekleri

1. **Android geldi: Mazi Türkiye Google Play'de** (42, önerilen)
2. Beklediğin için teşekkürler, Android hazır (42)
3. Son e-posta: Google Play'de yayındayız (38)

### Ön izleme metni

`Aynı 5 fotoğraf, aynı oyun. Bu, listeden alacağın son e-posta.`

### Gövde

> Merhaba,
>
> Söz verdiğim son e-posta bu: **Mazi Türkiye artık Google Play'de.**
>
> **[ Google Play'den indir ]**
>
> iPhone kullanan arkadaşlarınla aynı 5 fotoğrafı oynuyorsun. Meydan okuma linkleri iki tarafta da çalışıyor, yani aile grubundaki turnuvaya artık herkes katılabilir.
>
> Zaten iPhone'dan oynuyorsan bu e-postayı Android kullanan bir arkadaşına iletebilirsin.
>
> Lansman listesi bu e-postayla birlikte siliniyor; benden başka e-posta gelmeyecek. Oyunla ilgili haberleri Instagram, TikTok, X ve YouTube'da **@maziturkiye** hesabından takip edebilirsin.
>
> Beklediğin için teşekkürler,
> ‹Ad›
>
> ---
> Bu e-postayı maziturkiye.com'daki lansman listesine kaydolduğun için aldın. ‹VERİ SORUMLUSU ADI› · destek@maziturkiye.com · [Listeden çık]

**Buton linki:** `https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Demail%26utm_medium%3Demail%26utm_campaign%3Dandroid-2026`

HTML için §1'deki şablon kullanılır: başlık "Android geldi", tek buton (Google Play) ve yukarıdaki paragraflar. Kutu içindeki Android notu çıkarılır.

### Düz metin

```
Merhaba,

Söz verdiğim son e-posta bu: Mazi Türkiye artık Google Play'de.

Google Play'den indir:
https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Demail%26utm_medium%3Demail%26utm_campaign%3Dandroid-2026

iPhone kullanan arkadaşlarınla aynı 5 fotoğrafı oynuyorsun. Meydan okuma linkleri iki tarafta da çalışıyor, yani aile grubundaki turnuvaya artık herkes katılabilir.

Zaten iPhone'dan oynuyorsan bu e-postayı Android kullanan bir arkadaşına iletebilirsin.

Lansman listesi bu e-postayla birlikte siliniyor; benden başka e-posta gelmeyecek. Oyunla ilgili haberleri Instagram, TikTok, X ve YouTube'da @maziturkiye hesabından takip edebilirsin.

Beklediğin için teşekkürler,
‹Ad›

--
Bu e-postayı maziturkiye.com'daki lansman listesine kaydolduğun için aldın.
‹VERİ SORUMLUSU ADI› · destek@maziturkiye.com
Listeden çık: {{{RESEND_UNSUBSCRIBE_URL}}}
```

## Gönderimden önce kontrol

- [ ] `‹APP_ID›`, `‹PT›`, `‹Ad›` ve `‹VERİ SORUMLUSU ADI›` dolduruldu.
- [ ] Linkler telefonda açılıp test edildi: App Store'da doğru uygulama açılıyor, UTM'ler yerinde.
- [ ] Resend'den kendine test gönderildi. Gmail ve iOS Mail'de ön izleme metni, buton ve Türkçe karakterler doğru görünüyor.
- [ ] Abonelikten çıkma linki çalışıyor.
- [ ] Sosyal hesap kullanıcı adları gerçekten `@maziturkiye` (açılışta başka bir ad alındıysa Android e-postası güncellenir).
