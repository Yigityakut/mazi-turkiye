# In-app product

| Field | App Store | Google Play |
| --- | --- | --- |
| Type | Non-Consumable | One-time product (managed) |
| Product ID | `pro_lifetime` | `pro_lifetime` |
| Reference name | Mazi Türkiye Pro (ömür boyu) | — |
| Price | $5.99 price point; country prices via Apple automatic equalization | $5.99 base; Play automatic conversion |
| Display name (TR) | Mazi Türkiye Pro | Mazi Türkiye Pro |
| Description (TR, ≤45/80) | İpuçları, arşiv, sınırsız 1v1, tam istatistik | İpuçları, geçmiş günler, sınırsız 1v1 ve detaylı istatistik — tek seferlik |
| Review image | `store/screenshots/iap-review.png` (screenshot of the Pro screen, 1290×2796) | — |

**RevenueCat:** Entitlement `pro`; Offering `default` → Package `$rc_lifetime` → `pro_lifetime` in both stores.
Webhook: `https://ybhiddgwunzyquzrbzaf.supabase.co/functions/v1/revenuecat-webhook`, Authorization header = the `REVENUECAT_WEBHOOK_AUTH` secret.
**Türkiye price:** Reviewed based on the first month's conversion data (written to the decision log).
