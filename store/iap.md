# Uygulama içi ürün

| Alan | App Store | Google Play |
| --- | --- | --- |
| Tür | Non-Consumable | Tek seferlik ürün (yönetilen) |
| Product ID | `pro_lifetime` | `pro_lifetime` |
| Referans adı | Mazi Türkiye Pro (ömür boyu) | — |
| Fiyat | 5,99 $ fiyat noktası; ülke fiyatları Apple otomatik eşitleme | 5,99 $ taban; Play otomatik dönüşüm |
| Görünen ad (TR) | Mazi Türkiye Pro | Mazi Türkiye Pro |
| Açıklama (TR, ≤45/80) | İpuçları, arşiv, sınırsız 1v1, tam istatistik | İpuçları, geçmiş günler, sınırsız 1v1 ve detaylı istatistik — tek seferlik |
| İnceleme görseli | `store/screenshots/iap-review.png` (Pro ekranının görüntüsü, 1290×2796) | — |

**RevenueCat:** Entitlement `pro`; Offering `default` → Package `$rc_lifetime` → her iki mağazada `pro_lifetime`.
Webhook: `https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1/revenuecat-webhook`, Authorization başlığı = `REVENUECAT_WEBHOOK_AUTH` gizli değeri.
**Türkiye fiyatı:** İlk ayın dönüşüm verisine göre gözden geçirilir (karar kaydına yazılır).
