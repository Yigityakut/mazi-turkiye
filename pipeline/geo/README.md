# Harita verisi

Kaynak: [Natural Earth](https://www.naturalearthdata.com) 1:10m Admin-1 (kamu malı).

```bash
curl -sSLo /tmp/adm1.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson
python3 -c "import json;d=json.load(open('/tmp/adm1.geojson'));json.dump({'type':'FeatureCollection','features':[f for f in d['features'] if f['properties'].get('adm0_a3')=='TUR']},open('/tmp/tr.geojson','w'))"
npx mapshaper /tmp/tr.geojson -simplify 35% keep-shapes -filter-islands min-area=3km2 -o /tmp/tr_s.geojson precision=0.0005
npx mapshaper /tmp/tr.geojson -dissolve -simplify 6% keep-shapes -filter-islands min-area=40km2 -o /tmp/tr_outline.geojson precision=0.001
python3 build_geo.py /tmp/tr_s.geojson /tmp/tr_outline.geojson
```

Çıktılar: `app/src/data/turkeyMap.json` (projeksiyonlu SVG yolları), `supabase/functions/_shared/geo.json` (sunucu: ülke sınırı + il merkezleri), `provinces.json`.
