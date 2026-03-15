import React, { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useMapStore } from "../../store/mapStore";
import { getPartyColor } from "../../utils/colors";
import { getBoothsInBBox } from "../../data/geoData";
import type { Booth } from "@shared/types";

const createBoothIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 14 : 9;
  const ring = isSelected ? `
    <circle cx="18" cy="18" r="15" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
    <circle cx="18" cy="18" r="12" fill="none" stroke="${color}" stroke-width="1" opacity="0.6"/>
  ` : "";

  return L.divIcon({
    html: `
      <svg width="${isSelected ? 36 : 18}" height="${isSelected ? 36 : 18}" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        ${ring}
        <circle cx="18" cy="18" r="${size / 2 + 3}" fill="${color}" opacity="0.9"/>
        <circle cx="18" cy="18" r="${size / 2}" fill="${color}"/>
        <circle cx="16" cy="16" r="2" fill="white" opacity="0.5"/>
      </svg>
    `,
    className: "",
    iconSize: [isSelected ? 36 : 18, isSelected ? 36 : 18],
    iconAnchor: [isSelected ? 18 : 9, isSelected ? 18 : 9],
  });
};

const buildPopupContent = (booth: Booth): string => {
  const partyRows = booth.partyResults
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 4) // Only top 4 parties
    .map(
      (p) => `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:10px;height:10px;border-radius:50%;background:${p.color};display:inline-block;flex-shrink:0"></span>
          <span style="font-size:12px;color:#1A202C">${p.partyCode}</span>
        </div>
        <div style="text-align:right">
          <span style="font-size:12px;color:#1A202C;font-weight:500">${p.votes.toLocaleString("en-IN")}</span>
          <span style="font-size:11px;color:#94A3B8;margin-left:6px">${p.voteSharePercent.toFixed(1)}%</span>
        </div>
      </div>`
    )
    .join("");

  return `
    <div style="padding:14px 16px;font-family:'Inter',sans-serif;min-width:220px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div>
          <div style="font-size:14px;font-weight:700;color:#1A202C">
            Booth #${booth.boothNumber}
          </div>
          <div style="font-size:12px;color:#94A3B8;margin-top:2px">${booth.villageName} · ${booth.mandalName}</div>
        </div>
        <span style="
          background:${getPartyColor(booth.winningParty)};
          color:white;padding:3px 8px;border-radius:4px;
          font-size:11px;font-weight:600
        ">${booth.winningParty}</span>
      </div>
      <div style="border-top:1px solid #E2E6EA;padding-top:10px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:11px;color:#94A3B8">Total Voters</span>
          <span style="font-size:11px;color:#1A202C;font-weight:500">${booth.totalVoters.toLocaleString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:11px;color:#94A3B8">Turnout</span>
          <span style="font-size:11px;color:#D97706;font-weight:500">${booth.voterTurnoutPercent.toFixed(1)}%</span>
        </div>
      </div>
      ${partyRows}
    </div>
  `;
};

export const BoothLayer: React.FC = () => {
  const map = useMap();
  const { filters, selectedBooth, setSelectedBooth } = useMapStore();
  const markersRef = useRef<L.Marker[]>([]);

  // Track bounds via map events — fires only after movement completes, not during animations
  const [bbox, setBbox] = useState(() => {
    const b = map.getBounds();
    return {
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    };
  });

  useEffect(() => {
    const updateBbox = () => {
      const b = map.getBounds();
      setBbox({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };
    map.on("moveend", updateBbox);
    return () => {
      map.off("moveend", updateBbox);
    };
  }, [map]);

  // Debounced booth loading
  const [booths, setBooths] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      getBoothsInBBox(bbox, 250).then((result) => {
        if (!cancelled) setBooths(result);
      });
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [bbox]);

  useEffect(() => {
    if (!map || !booths) return;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    booths.forEach((booth: any) => {
      const isSelected = selectedBooth?.id === booth.id;
      const color = getPartyColor(booth.winningParty);
      const icon = createBoothIcon(color, isSelected);

      const marker = L.marker([booth.latitude, booth.longitude], { icon });

      marker.bindPopup(buildPopupContent(booth), {
        maxWidth: 280,
        className: "ap-booth-popup",
      });

      marker.on("click", () => {
        setSelectedBooth(booth);
        marker.openPopup();
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((m) => map.removeLayer(m));
    };
  }, [map, booths, selectedBooth]);

  return null;
};
