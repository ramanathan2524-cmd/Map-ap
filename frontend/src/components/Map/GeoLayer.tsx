import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../../store/mapStore";
import { getPartyColor } from "../../utils/colors";
import { ZOOM_LEVELS } from "@shared/constants";
import {
  getDistrictsGeoJSON,
  getMandalsGeoJSON,
  getVillagesGeoJSON,
} from "../../data/geoData";
import type { GeoLevel } from "@shared/types";

interface LayerConfig {
  level: GeoLevel;
  minZoom: number;
  maxZoom: number;
  getData: (filters: any) => Promise<any>;
  queryKey: string;
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    level: "district",
    minZoom: ZOOM_LEVELS.DISTRICT.min,
    maxZoom: ZOOM_LEVELS.DISTRICT.max,
    getData: getDistrictsGeoJSON,
    queryKey: "districts",
  },
  {
    level: "mandal",
    minZoom: ZOOM_LEVELS.MANDAL.min,
    maxZoom: ZOOM_LEVELS.MANDAL.max,
    getData: getMandalsGeoJSON,
    queryKey: "mandals",
  },
  {
    level: "village",
    minZoom: ZOOM_LEVELS.VILLAGE.min,
    maxZoom: ZOOM_LEVELS.VILLAGE.max,
    getData: getVillagesGeoJSON,
    queryKey: "villages",
  },
];

// ── Compute centroid of a GeoJSON polygon ────────────────────────────────────
function getPolygonCentroid(feature: any): [number, number] | null {
  try {
    const geom = feature.geometry;
    let coords: number[][];

    if (geom.type === "MultiPolygon") {
      // Use the largest polygon's outer ring
      let maxLen = 0;
      let biggest: number[][] = geom.coordinates[0][0];
      for (const poly of geom.coordinates) {
        if (poly[0].length > maxLen) {
          maxLen = poly[0].length;
          biggest = poly[0];
        }
      }
      coords = biggest;
    } else {
      coords = geom.coordinates[0]; // outer ring
    }

    let latSum = 0,
      lngSum = 0;
    const n = coords.length - 1; // skip closing duplicate
    for (let i = 0; i < n; i++) {
      lngSum += coords[i][0];
      latSum += coords[i][1];
    }
    return [latSum / n, lngSum / n];
  } catch {
    return null;
  }
}

// ── Label font size based on zoom and level ──────────────────────────────────
function getLabelSize(level: GeoLevel, zoom: number): number {
  if (level === "district") return zoom <= 8 ? 10 : 11;
  if (level === "mandal") return 9;
  if (level === "village") return 8;
  return 8;
}

// ── Single layer component ───────────────────────────────────────────────────
const SingleGeoLayer: React.FC<LayerConfig> = ({
  level,
  minZoom,
  maxZoom,
  getData,
}) => {
  const map = useMap();
  const { currentZoom, filters, setSelectedRegion, setHoveredRegionId, pushBreadcrumb, setFilters } =
    useMapStore();

  const layerRef = useRef<L.GeoJSON | null>(null);
  const labelsRef = useRef<L.LayerGroup | null>(null);
  const isVisible = currentZoom >= minZoom && currentZoom < maxZoom;
  const [data, setData] = useState<any>(null);

  // Stable filter key — only re-fetch when actual filter values change
  const filterKey = `${filters.districtId || ""}-${filters.mandalId || ""}-${filters.villageId || ""}-${filters.partyId || ""}`;

  // Fetch data asynchronously when the layer becomes visible or filters change
  useEffect(() => {
    if (!isVisible) {
      setData(null);
      return;
    }

    let cancelled = false;
    getData(filters).then((result) => {
      if (!cancelled) setData(result);
    });

    return () => {
      cancelled = true;
    };
  }, [isVisible, filterKey]);

  useEffect(() => {
    if (!map) return;

    // Remove existing layers
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    if (labelsRef.current) {
      map.removeLayer(labelsRef.current);
      labelsRef.current = null;
    }

    if (!isVisible || !data) return;

    const labelGroup = L.layerGroup();
    const fontSize = getLabelSize(level, currentZoom);

    const geoLayer = L.geoJSON(data as any, {
      style: (feature) => {
        const winningParty = feature?.properties?.winning_party ?? "OTH";
        const color = getPartyColor(winningParty);

        return {
          fillColor: color,
          fillOpacity: 0.65,
          color: "#ffffff",
          weight: 2,
          opacity: 1,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const props = feature.properties;

        // ── Add district name label at centroid ──────────────────────────
        const centroid = getPolygonCentroid(feature);
        if (centroid) {
          const displayName = props.name.length > 16
            ? props.name.split(" ").slice(0, 2).join(" ")
            : props.name;

          const label = L.marker(centroid as L.LatLngExpression, {
            icon: L.divIcon({
              className: "district-label",
              html: `<div style="
                font-family: 'Inter', system-ui, sans-serif;
                font-size: ${fontSize}px;
                font-weight: 700;
                color: #1a1a2e;
                text-shadow: 0 0 3px rgba(255,255,255,0.95), 0 0 6px rgba(255,255,255,0.8), 1px 1px 2px rgba(255,255,255,0.9);
                white-space: nowrap;
                pointer-events: none;
                text-align: center;
                line-height: 1.15;
                letter-spacing: 0.2px;
              ">${displayName}<br/><span style="
                font-size: ${Math.max(fontSize - 2, 7)}px;
                font-weight: 600;
                color: ${getPartyColor(props.winning_party)};
                text-shadow: 0 0 2px rgba(255,255,255,0.95), 0 0 5px rgba(255,255,255,0.8);
              ">${props.winning_party ?? ""}</span></div>`,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            }),
            interactive: false,
          });
          labelGroup.addLayer(label);
        }

        // ── Hover effects ────────────────────────────────────────────────
        featureLayer.on("mouseover", (e) => {
          const l = e.target as L.Path;
          l.setStyle({ fillOpacity: 0.85, weight: 3 });
          l.bringToFront();
          setHoveredRegionId(props.id);
        });

        featureLayer.on("mouseout", (e) => {
          const l = e.target as L.Path;
          l.setStyle({ fillOpacity: 0.65, weight: 2 });
          setHoveredRegionId(null);
        });

        featureLayer.on("click", () => {
          // Set drill-down filters so child layers show only relevant features
          if (level === "district") {
            setFilters({ districtId: props.id, mandalId: undefined, villageId: undefined });
          } else if (level === "mandal") {
            setFilters({ mandalId: props.id, villageId: undefined });
          } else if (level === "village") {
            setFilters({ villageId: props.id });
          }

          setSelectedRegion({
            id: props.id,
            name: props.name,
            level,
            parentId: props.parent_id,
            totalVoters: props.total_voters ?? 0,
            winningParty: props.winning_party,
            winningPartyColor: getPartyColor(props.winning_party),
            marginOfVictory: props.margin ?? 0,
            partyResults: props.party_results ?? [],
          });

          // Fly to clicked region and record bounds for breadcrumb back-navigation
          const bounds = (featureLayer as L.Polygon).getBounds();
          pushBreadcrumb({
            id: props.id,
            name: props.name,
            level,
            bounds: [
              [bounds.getSouth(), bounds.getWest()],
              [bounds.getNorth(), bounds.getEast()],
            ],
          });

          map.flyToBounds(bounds, { padding: [40, 40], paddingBottomRight: [360, 40], duration: 0.5 });
        });

        // ── Tooltip on hover — richer detail ─────────────────────────────
        const partyColor = getPartyColor(props.winning_party);
        const margin = (props.margin ?? 0).toLocaleString("en-IN");
        featureLayer.bindTooltip(
          `<div style="font-family:'Inter',system-ui,sans-serif;padding:6px 10px;min-width:120px">
            <strong style="font-size:13px;color:#1A202C">${props.name}</strong>
            <div style="margin-top:3px;display:flex;align-items:center;gap:6px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${partyColor}"></span>
              <span style="font-weight:600;font-size:12px;color:${partyColor}">${props.winning_party ?? "—"}</span>
            </div>
            <div style="margin-top:3px;color:#6B7280;font-size:11px">
              Voters: ${(props.total_voters ?? 0).toLocaleString("en-IN")}<br/>
              Margin: ${margin}
            </div>
          </div>`,
          { sticky: true, direction: "top", className: "ap-tooltip" }
        );
      },
    });

    geoLayer.addTo(map);
    labelGroup.addTo(map);
    layerRef.current = geoLayer;
    labelsRef.current = labelGroup;

    return () => {
      if (layerRef.current) map.removeLayer(layerRef.current);
      if (labelsRef.current) map.removeLayer(labelsRef.current);
    };
  }, [map, data, isVisible, currentZoom]);

  return null;
};

// ── GeoLayer — renders all layers ────────────────────────────────────────────
export const GeoLayer: React.FC = () => (
  <>
    {LAYER_CONFIGS.map((config) => (
      <SingleGeoLayer key={config.level} {...config} />
    ))}
  </>
);
