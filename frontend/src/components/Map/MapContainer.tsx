import React, { useCallback, useEffect } from "react";
import {
  MapContainer as LeafletMap,
  TileLayer,
  ZoomControl,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { AP_MAP_CENTER, AP_BOUNDS, ZOOM_LEVELS } from "@shared/constants";
import { useMapStore } from "../../store/mapStore";
import { setMapRef } from "../../utils/mapRef";
import { GeoLayer } from "./GeoLayer";
import { BoothLayer } from "./BoothLayer";
import { Breadcrumb } from "./Breadcrumb";
import { ZoomLevelIndicator } from "./ZoomLevelIndicator";
import type { GeoLevel } from "@shared/types";
import styles from "./MapContainer.module.css";

// ── Zoom tracker ─────────────────────────────────────────────────────────────
const ZoomTracker: React.FC = () => {
  const { setCurrentZoom, setCurrentLevel } = useMapStore();

  useMapEvents({
    zoomend: (e) => {
      const z = e.target.getZoom();
      setCurrentZoom(z);

      let level: GeoLevel = "state";
      if (z >= ZOOM_LEVELS.BOOTH.min)           level = "booth";
      else if (z >= ZOOM_LEVELS.VILLAGE.min)    level = "village";
      else if (z >= ZOOM_LEVELS.MANDAL.min)     level = "mandal";
      else if (z >= ZOOM_LEVELS.MLA_CONSTITUENCY.min) level = "mla_constituency";
      else if (z >= ZOOM_LEVELS.MP_CONSTITUENCY.min)  level = "mp_constituency";
      else if (z >= ZOOM_LEVELS.DISTRICT.min)   level = "district";
      setCurrentLevel(level);
    },
  });

  return null;
};

// ── Map reference setter (for breadcrumb navigation) ──────────────────────────
const MapRefSetter: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    setMapRef(map);
    // Fit AP bounds on mount so the state fills the screen
    map.fitBounds(
      [
        [AP_BOUNDS.south, AP_BOUNDS.west],
        [AP_BOUNDS.north, AP_BOUNDS.east],
      ],
      { animate: false }
    );
    return () => setMapRef(null);
  }, [map]);
  return null;
};

// ── Main MapContainer ─────────────────────────────────────────────────────────
export const MapContainer: React.FC = () => {
  const { currentZoom } = useMapStore();

  const showBooths = currentZoom >= ZOOM_LEVELS.BOOTH.min;

  return (
    <div className={styles.container}>
      <LeafletMap
        center={[AP_MAP_CENTER.lat, AP_MAP_CENTER.lng]}
        zoom={AP_MAP_CENTER.defaultZoom}
        minZoom={7}
        maxZoom={18}
        maxBounds={[
          [AP_BOUNDS.south - 0.3, AP_BOUNDS.west - 0.3],
          [AP_BOUNDS.north + 0.3, AP_BOUNDS.east + 0.3],
        ]}
        maxBoundsViscosity={1.0}
        bounceAtZoomLimits={false}
        zoomSnap={0.5}
        zoomDelta={1}
        zoomControl={false}
        className={styles.map}
        preferCanvas={true}
      >
        {/* Light basemap tiles — no labels (district names come from our labels) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
          subdomains="abcd"
        />

        <ZoomControl position="bottomright" />
        <ZoomTracker />
        <MapRefSetter />

        {/* GeoJSON polygon layers — level-aware */}
        <GeoLayer />

        {/* Booth point markers — only at high zoom */}
        {showBooths && <BoothLayer />}
      </LeafletMap>

      {/* UI overlays */}
      <Breadcrumb />
      <ZoomLevelIndicator />
    </div>
  );
};
