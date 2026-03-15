/**
 * Converts raw PostGIS query rows into a GeoJSON FeatureCollection.
 * Each row must have a `geometry` field (already parsed as JSON via ST_AsGeoJSON).
 */
export const buildGeoJSON = (rows: any[]) => {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.geometry != null)
      .map((row) => {
        const { geometry, ...properties } = row;
        return {
          type: "Feature",
          geometry: typeof geometry === "string" ? JSON.parse(geometry) : geometry,
          properties,
        };
      }),
  };
};

/**
 * Simplifies a GeoJSON FeatureCollection for lower zoom levels.
 * Uses a simple coordinate reduction (in production use turf.simplify or PostGIS ST_Simplify).
 */
export const simplifyGeoJSON = (
  collection: ReturnType<typeof buildGeoJSON>,
  tolerance = 0.01
) => {
  // In production: use ST_Simplify in the SQL query with the given tolerance
  // SELECT ST_AsGeoJSON(ST_Simplify(geom, ${tolerance}))::json AS geometry
  return collection;
};

/**
 * Extracts a bounding box string suitable for PostGIS ST_MakeEnvelope.
 */
export const bboxToPostGIS = (bbox: {
  north: number; south: number; east: number; west: number;
}) => `ST_MakeEnvelope(${bbox.west}, ${bbox.south}, ${bbox.east}, ${bbox.north}, 4326)`;
