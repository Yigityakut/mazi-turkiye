# Waitlist emails

Only two emails go to the waitlist: **iOS launch (24 November)** and **Android launch (~3 December)**. The list is then deleted.

## Sending details

| Field | Value |
| --- | --- |
| Tool | Resend → Broadcasts. The Audience is imported as CSV from the `public.waitlist` table in Supabase. |
| Sender | `Mazi Türkiye <merhaba@maziturkiye.com>`. The domain must be verified in Resend (SPF, DKIM, optional DMARC). |
| Reply-to | `destek@maziturkiye.com` |
| Time | **Tuesday 24 November 2026, 09:30 TRT.** The first day has opened at 04:00 and people are awake. The Android email goes out once the release is visible on Play, between 10:00–11:00 the same day. |
| Unsubscribe | `{{{RESEND_UNSUBSCRIBE_URL}}}` (Resend Broadcast variable). Plus the List-Unsubscribe header. |
| Tracking | `utm_source=email&utm_medium=email&utm_campaign=launch-2026` on site links; `ct=email-launch-2026` on the App Store link. |
| To fill in | `‹APP_ID›` and `‹PT›` (App Store Connect → campaign link), `‹Ad›`, `‹VERİ SORUMLUSU ADI›` |

**Legal note.** The signup form says "E-posta adresini sadece lansman duyurusu için kullanırız" (we only use your email for the launch announcement). These two emails are within that promise.

- Any other email, such as a newsletter or campaign, needs separate explicit consent (Law No. 6563, commercial electronic messages).
- Whether İYS registration is required is asked to the lawyer together with the legal texts (HUMAN_TODO 13).
- **After the Android email:** the Resend Audience is deleted. The `public.waitlist` table is emptied too (`delete from public.waitlist;`, with approval). This complies with the KVKK principle of deleting data once its purpose is fulfilled.

---

## 1. Launch email (24 November)

### Subject line options

> English summary: variations on "Mazi Türkiye is live: where was this photo taken?"; option 1 recommended.

1. **Mazi Türkiye yayında: bu fotoğraf nerede?** (41 characters, recommended)
2. Beklediğin oyun bugün App Store'da (34)
3. İlk 5 fotoğraf seni bekliyor (28)
4. Bugün başlıyoruz: nerede, hangi yıl? (36)
5. Söz verdiğimiz e-posta: Mazi Türkiye çıktı (42)

If Resend allows A/B testing, try 1 vs 3.

### Preview text

`Her gün 5 gerçek fotoğraf. Ücretsiz, reklamsız. iPhone'da bugün, Android'de Aralık başında.`

### Body

> English summary: "You asked to be told when it launched; today it's on the App Store", how the game works, three notes (same 5 photos for everyone + challenge link, each photo has a story and source with no AI images, free/ad-free with optional one-time Pro), Android coming in early December with one last email, reply to give feedback.

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

### HTML (ready to paste into Resend)

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

### Plain text

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

## 2. "Android geldi" (~3 December, the list's last email)

### Subject line options

> English summary: variations on "Android is here: Mazi Türkiye on Google Play"; option 1 recommended.

1. **Android geldi: Mazi Türkiye Google Play'de** (42, recommended)
2. Beklediğin için teşekkürler, Android hazır (42)
3. Son e-posta: Google Play'de yayındayız (38)

### Preview text

`Aynı 5 fotoğraf, aynı oyun. Bu, listeden alacağın son e-posta.`

### Body

> English summary: the promised last email: the game is now on Google Play, challenge links work across iPhone and Android, forward it to an Android friend, the list is being deleted, follow @maziturkiye for news.

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

**Button link:** `https://play.google.com/store/apps/details?id=com.maziturkiye.app&referrer=utm_source%3Demail%26utm_medium%3Demail%26utm_campaign%3Dandroid-2026`

For HTML, use the template from §1: heading "Android geldi", a single button (Google Play) and the paragraphs above. Remove the boxed Android note.

### Plain text

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

## Pre-send checklist

- [ ] `‹APP_ID›`, `‹PT›`, `‹Ad›` and `‹VERİ SORUMLUSU ADI›` are filled in.
- [ ] Links opened and tested on a phone: the right app opens in the App Store, UTMs are in place.
- [ ] Test sent to yourself from Resend. Preview text, button and Turkish characters look right in Gmail and iOS Mail.
- [ ] The unsubscribe link works.
- [ ] Social account usernames really are `@maziturkiye` (if a different name was taken at signup, update the Android email).
