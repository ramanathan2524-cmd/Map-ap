/**
 * Format a number in Indian numbering system (lakhs, crores).
 */
export const formatIndian = (n: number): string => {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)}Cr`;
  if (n >= 1_00_000)    return `${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)       return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-IN");
};

/**
 * Format a percentage to 1 decimal place.
 */
export const formatPercent = (n: number): string => `${n.toFixed(1)}%`;

/**
 * Convert a GeoLevel key to a human-readable label.
 */
export const levelLabel = (level: string): string =>
  ({
    state:            "State",
    district:         "District",
    mp_constituency:  "MP Constituency",
    mla_constituency: "MLA Constituency",
    mandal:           "Mandal",
    village:          "Village",
    booth:            "Booth",
  }[level] ?? level);

/**
 * Abbreviate a long constituency name for display in tight spaces.
 */
export const abbreviate = (name: string, maxLen = 22): string => {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "…";
};
