"""Mağaza alanlarının karakter sınırlarını kontrol eder."""
fields = {
    "Apple isim": ("Mazi Türkiye: Tarih Tahmini", 30),
    "Apple alt başlık": ("Eski fotoğraf, harita ve yıl", 30),
    "Apple anahtar": ("nostalji,bilgi,yarışması,quiz,coğrafya,osmanlı,istanbul,günlük,bulmaca,zeka,geçmiş,oyun,nerede", 100),
    "Apple tanıtım": ("Her sabah 04:00'te 5 yeni fotoğraf. Arkadaşına WhatsApp'tan meydan oku; aynı 5 fotoğrafta kim daha iyi, hemen gör.", 170),
    "Google başlık": ("Mazi Türkiye: Tarih Tahmini", 30),
    "Google kısa": ("Eski fotoğraflarla tarih ve harita oyunu: nerede, hangi yıl? Her gün 5 fotoğraf.", 80),
}
for k, (v, lim) in fields.items():
    print(f"{'OK ' if len(v) <= lim else 'FAZLA'} {k}: {len(v)}/{lim}")
import re, pathlib
t = pathlib.Path(__file__).with_name("listing.tr.md").read_text()
long = t.split("### Tam açıklama (Google Play, ≤4.000 karakter)")[1].strip()
print(f"{'OK ' if len(long) <= 4000 else 'FAZLA'} Google uzun: {len(long)}/4000")
apple = t.split("### Açıklama (App Store)")[1].split("### Bu sürümde")[0].strip()
print(f"{'OK ' if len(apple) <= 4000 else 'FAZLA'} Apple açıklama: {len(apple)}/4000")
