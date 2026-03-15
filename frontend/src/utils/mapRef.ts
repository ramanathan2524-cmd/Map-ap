// ─────────────────────────────────────────────────────────────────────────────
// Module-level Leaflet Map reference — allows non-component code
// (e.g. breadcrumb navigation) to fly/zoom the map.
// ─────────────────────────────────────────────────────────────────────────────
import type { Map } from "leaflet";

let mapInstance: Map | null = null;

export function setMapRef(map: Map | null) {
  mapInstance = map;
}

export function getMapRef(): Map | null {
  return mapInstance;
}
