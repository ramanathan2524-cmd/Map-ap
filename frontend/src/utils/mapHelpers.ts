import L from "leaflet";
import { ZOOM_LEVELS } from "@shared/constants";
import type { GeoLevel } from "@shared/types";

/**
 * Returns the appropriate geo level for a given Leaflet zoom value.
 */
export const zoomToLevel = (zoom: number): GeoLevel => {
  if (zoom >= ZOOM_LEVELS.BOOTH.min)              return "booth";
  if (zoom >= ZOOM_LEVELS.VILLAGE.min)            return "village";
  if (zoom >= ZOOM_LEVELS.MANDAL.min)             return "mandal";
  if (zoom >= ZOOM_LEVELS.MLA_CONSTITUENCY.min)   return "mla_constituency";
  if (zoom >= ZOOM_LEVELS.MP_CONSTITUENCY.min)    return "mp_constituency";
  if (zoom >= ZOOM_LEVELS.DISTRICT.min)           return "district";
  return "state";
};

/**
 * Returns the target zoom level when drilling into a region.
 */
export const drillZoom = (level: GeoLevel): number => {
  const map: Record<GeoLevel, number> = {
    state:            7,
    district:         9,
    mp_constituency:  10,
    mla_constituency: 12,
    mandal:           13,
    village:          15,
    booth:            17,
  };
  return map[level];
};

/**
 * Converts a Leaflet LatLngBounds to a flat bbox object.
 */
export const boundsTobbox = (bounds: L.LatLngBounds) => ({
  north: bounds.getNorth(),
  south: bounds.getSouth(),
  east:  bounds.getEast(),
  west:  bounds.getWest(),
});

/**
 * Checks whether two bbox objects are materially different
 * (used to decide whether to re-fetch booth data).
 */
export const bboxChanged = (
  a: ReturnType<typeof boundsTobbox>,
  b: ReturnType<typeof boundsTobbox>,
  threshold = 0.05
): boolean =>
  Math.abs(a.north - b.north) > threshold ||
  Math.abs(a.south - b.south) > threshold ||
  Math.abs(a.east  - b.east)  > threshold ||
  Math.abs(a.west  - b.west)  > threshold;
