import map from "../data/turkeyMap.json";

export const MAP = map as {
  projection: { lat0: number; minLng: number; maxLat: number; scale: number; k: number };
  width: number;
  height: number;
  provinces: { n: string; r: string; d: string }[];
  waterLines: { n: string; w: number; d: string }[];
  cities: { n: string; lat: number; lng: number; rank: number; xy: [number, number] }[];
};

const P = MAP.projection;
export type LatLng = { lat: number; lng: number };
export type XY = { x: number; y: number };

export function project({ lat, lng }: LatLng): XY {
  "worklet";
  return { x: (lng - P.minLng) * P.k * P.scale, y: (P.maxLat - lat) * P.scale };
}

export function unproject({ x, y }: XY): LatLng {
  "worklet";
  return { lng: x / (P.k * P.scale) + P.minLng, lat: P.maxLat - y / P.scale };
}

export function haversine(a: LatLng, b: LatLng) {
  const R = 6371, r = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const scoreLocation = (d: number) => (d < 1 ? 500 : Math.round(500 * Math.exp(-d / 150)));
export const scoreYear = (dy: number) => (dy === 0 ? 500 : Math.round(500 * Math.exp(-Math.abs(dy) / 10)));
