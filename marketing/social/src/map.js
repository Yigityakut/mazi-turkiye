// Türkiye il haritası yardımcıları (veri: map-data.js ← app/src/data/turkeyMap.json, Natural Earth, kamu malı).
// TRMap.svg(opts)  → il sınırlarıyla <g> işaretlemesi (harita koordinatlarında: 0..width × 0..height)
// TRMap.xy(lat,lng) → harita koordinatı; TRMap.city("İzmir") → şehrin harita koordinatı
// TRMap.pin(x, y, s, color, dot) → markanın iğne şekli (ucu x,y noktasında)
(function () {
  const M = window.TR_MAP;
  const P = M.projection;
  const xy = (lat, lng) => [(lng - P.minLng) * P.k * P.scale, (P.maxLat - lat) * P.scale];
  const city = (n) => (M.cities.find((c) => c.n === n) || {}).xy;
  function svg(o = {}) {
    const land = o.land ?? "#FBF7EF", stroke = o.stroke ?? "#C9B596", sw = o.strokeWidth ?? 1;
    const coast = o.coast ?? stroke, cw = o.coastWidth ?? sw * 3;
    const hi = o.highlight || {}; // { "İzmir": "#F1D6C9" }
    const paths = M.provinces.map((p) => `<path d="${p.d}" fill="${hi[p.n] ?? land}"/>`).join("");
    const outline = M.provinces.map((p) => `<path d="${p.d}"/>`).join("");
    const water = (M.waterLines || []).map((w) => `<path d="${w.d}" fill="none" stroke="${o.water ?? "#CFD9D4"}" stroke-width="${(w.w ?? 1.2) * (o.waterScale ?? 1.6)}" stroke-linecap="round"/>`).join("");
    return `<g fill="none" stroke="${coast}" stroke-width="${cw}" stroke-linejoin="round">${outline}</g>` +
      `<g stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round">${paths}</g>` + water;
  }
  // İğne: 0,0 ucu; baş yarıçapı 1 birim; s ölçek
  function pin(x, y, s, color, dot = "#FBF7EF", clock = false) {
    const head = `<path d="M0 0 C-0.25 -0.32 -1 -1.15 -1 -1.95 A1 1 0 1 1 1 -1.95 C1 -1.15 0.25 -0.32 0 0Z" fill="${color}"/>`;
    const inner = clock
      ? `<circle cy="-1.95" r="0.56" fill="${dot}"/><path d="M0 -1.95 V-2.3 M0 -1.95 L0.24 -1.79" stroke="${color}" stroke-width="0.11" stroke-linecap="round"/>`
      : `<circle cy="-1.95" r="0.4" fill="${dot}"/>`;
    return `<g transform="translate(${x} ${y}) scale(${s})">${head}${inner}</g>`;
  }
  window.TRMap = { data: M, xy, city, svg, pin, width: M.width, height: M.height };
})();
