import { PARTY_COLORS } from "@shared/constants";

const MAIN_PARTIES = new Set(["TDP", "YSRCP", "JSP", "BJP"]);

/**
 * Returns the hex color for a party code.
 * Non-main parties are grouped as "OTH" (gray).
 */
export const getPartyColor = (partyCode?: string): string => {
  if (!partyCode) return PARTY_COLORS.OTH;
  const code = partyCode.toUpperCase();
  if (MAIN_PARTIES.has(code)) return PARTY_COLORS[code];
  return PARTY_COLORS.OTH;
};

/**
 * Returns a semi-transparent fill color for GeoJSON polygons.
 */
export const getPartyFillColor = (partyCode?: string, opacity = 0.5): string => {
  const hex = getPartyColor(partyCode);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

/**
 * Darken a hex color by a given amount (0–255).
 */
export const darkenColor = (hex: string, amount: number): string => {
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  const r = clamp(parseInt(hex.slice(1, 3), 16) - amount);
  const g = clamp(parseInt(hex.slice(3, 5), 16) - amount);
  const b = clamp(parseInt(hex.slice(5, 7), 16) - amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};
