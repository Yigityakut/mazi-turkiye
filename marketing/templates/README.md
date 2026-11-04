# Video şablonları (HyperFrames)

`make-video.mjs` — "Bil bakalım" 16 sn dikey video (1080×1920): giriş → fotoğraf + soru → 5'ten geri sayım → haritada cevap, yıl sayacı, yer adı, CTA. Atıf satırı her karede.

```bash
node marketing/templates/make-video.mjs marketing/videos/specs/bb-001.json   # → marketing/videos/bb-001/
cd marketing/videos/bb-001 && npx -y hyperframes@0.9.10 check && npx -y hyperframes@0.9.10 render --output bb-001.mp4
```

Spec: `{ id, image (spec dosyasına göre göreli yerel yol), year, location, lat, lng, author, source, license }`.
Kural: günün gerçek fotoğrafları asla kullanılmaz; sadece geçmiş günler veya `bonus` havuzu. Render ajan ortamında da çalışır (Chromium yerel).
Seslendirme (ElevenLabs) ve müzik henüz yok; eklenecekse `/media-use` skill'i ve platformun "AI ile oluşturuldu" etiketi.
