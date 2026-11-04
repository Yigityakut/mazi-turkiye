"""Natural Earth (kamu malı) il sınırlarından uygulama ve sunucu için harita verisi üretir.
Kullanım: python3 build_geo.py <basitleştirilmiş_iller.geojson> <ülke_sınırı.geojson>
Çıktı: app/src/data/turkeyMap.json, supabase/functions/_shared/geo.json
"""
import json, math, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from provinces import PROVINCES, CITIES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
prov_src, outline_src = sys.argv[1], sys.argv[2]

# Eşdikdörtgen projeksiyon, 39° enlemde kosinüs düzeltmesi. Türkiye ölçeğinde hata ihmal edilebilir.
LAT0 = 39.0
K = math.cos(math.radians(LAT0))
MIN_LNG, MAX_LNG, MIN_LAT, MAX_LAT = 25.6, 44.9, 35.75, 42.15
SCALE = 100.0  # 1 derece boylam*K = 100 birim
W = round((MAX_LNG - MIN_LNG) * K * SCALE, 1)
H = round((MAX_LAT - MIN_LAT) * SCALE, 1)

def proj(lng, lat):
    return (round((lng - MIN_LNG) * K * SCALE, 1), round((MAX_LAT - lat) * SCALE, 1))

def ring_path(ring):
    pts = [proj(*p[:2]) for p in ring]
    out, last = [], None
    for p in pts:
        if p != last:
            out.append(p)
            last = p
    return "M" + "L".join(f"{x:g},{y:g}" for x, y in out) + "Z"

def geom_path(g):
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    return "".join(ring_path(r) for poly in polys for r in poly)

def centroid(g):
    polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
    best = max((poly[0] for poly in polys), key=len)
    a = cx = cy = 0.0
    for (x1, y1), (x2, y2) in zip(best, best[1:] + best[:1]):
        c = x1 * y2 - x2 * y1
        a += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
    a *= 0.5
    return (cx / (6 * a), cy / (6 * a))

BOSPHORUS = [(41.235, 29.135), (41.205, 29.105), (41.175, 29.075), (41.145, 29.07), (41.115, 29.06),
             (41.085, 29.055), (41.06, 29.04), (41.04, 29.02), (41.02, 29.0), (41.005, 28.99), (40.99, 28.985)]

prov = json.load(open(prov_src))
provinces = []
for f in prov["features"]:
    ne = f["properties"]["name"]
    name, plate, region = PROVINCES[ne]
    lng, lat = centroid(f["geometry"])
    provinces.append({"name": name, "plate": plate, "region": region,
                      "lat": round(lat, 4), "lng": round(lng, 4), "d": geom_path(f["geometry"])})
provinces.sort(key=lambda p: p["plate"])
assert len(provinces) == 81

app_map = {
    "projection": {"lat0": LAT0, "minLng": MIN_LNG, "maxLat": MAX_LAT, "scale": SCALE, "k": K},
    "width": W, "height": H,
    "provinces": [{"n": p["name"], "r": p["region"], "d": p["d"]} for p in provinces],
    # Natural Earth ölçeğinde görünmeyen dar su yolları, deniz rengiyle çizilir
    "waterLines": [
        {"n": "İstanbul Boğazı", "w": 1.2, "d": "M" + "L".join("%g,%g" % proj(lo, la) for la, lo in BOSPHORUS)},
    ],
    "cities": [{"n": n, "lat": la, "lng": lo, "rank": r, "xy": proj(lo, la)} for n, la, lo, r in CITIES],
}
os.makedirs(f"{ROOT}/app/src/data", exist_ok=True)
json.dump(app_map, open(f"{ROOT}/app/src/data/turkeyMap.json", "w"), ensure_ascii=False, separators=(",", ":"))

outline = json.load(open(outline_src))
g = outline["features"][0]["geometry"] if "features" in outline else outline["geometries"][0]
polys = g["coordinates"] if g["type"] == "MultiPolygon" else [g["coordinates"]]
server = {
    "outline": [[[round(x, 3), round(y, 3)] for x, y in poly[0]] for poly in polys],
    "provinces": [{"name": p["name"], "plate": p["plate"], "region": p["region"], "lat": p["lat"], "lng": p["lng"]} for p in provinces],
}
os.makedirs(f"{ROOT}/supabase/functions/_shared", exist_ok=True)
json.dump(server, open(f"{ROOT}/supabase/functions/_shared/geo.json", "w"), ensure_ascii=False, separators=(",", ":"))
json.dump(server["provinces"], open(f"{ROOT}/pipeline/geo/provinces.json", "w"), ensure_ascii=False, indent=1)
print("map", W, "x", H, "outline polys", len(polys), "pts", sum(len(p[0]) for p in polys))
