import React, { useState, useMemo, useEffect } from "react";
import { Filter, ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react";
import { useMapStore } from "../../store/mapStore";
import { ELECTION_YEARS } from "@shared/constants";
import {
  getPartiesLookup,
  getDistrictsLookup,
  getMandalsLookup,
  getVillagesLookup,
} from "../../data/geoData";
import styles from "./FilterPanel.module.css";

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
}

const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = "All",
  disabled = false,
}) => (
  <div className={styles.fieldGroup}>
    <label className={styles.fieldLabel}>{label}</label>
    <div className={styles.selectWrapper}>
      <select
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className={styles.selectIcon} />
    </div>
  </div>
);

export const FilterPanel: React.FC = () => {
  const { filters, setFilters, clearFilters, filterPanelOpen, setFilterPanelOpen, selectedYear, setSelectedYear } =
    useMapStore();
  const [collapsed, setCollapsed] = useState(false);

  const parties = useMemo(() => getPartiesLookup(), []);

  // Async lookups
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);
  const [mandals, setMandals] = useState<{ id: string; name: string }[]>([]);
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getDistrictsLookup().then(setDistricts);
  }, []);

  useEffect(() => {
    if (filters.districtId) {
      getMandalsLookup(filters.districtId).then(setMandals);
    } else {
      setMandals([]);
    }
  }, [filters.districtId]);

  useEffect(() => {
    if (filters.mandalId) {
      getVillagesLookup(filters.mandalId).then(setVillages);
    } else {
      setVillages([]);
    }
  }, [filters.mandalId]);

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <aside className={`${styles.panel} ${collapsed ? styles.collapsed : ""}`}>
      {/* Panel header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitle}>
          <SlidersHorizontal size={14} className={styles.panelIcon} />
          <span>Filters</span>
        </div>
        <div className={styles.headerActions}>
          {hasActiveFilters && (
            <button className={styles.clearBtn} onClick={clearFilters} title="Clear all filters">
              <X size={12} /> Clear
            </button>
          )}
          <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          {/* Election year */}
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Election Year</label>
            <div className={styles.yearPills}>
              {ELECTION_YEARS.map((yr) => (
                <button
                  key={yr}
                  className={`${styles.yearPill} ${selectedYear === yr ? styles.active : ""}`}
                  onClick={() => setSelectedYear(yr)}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Party */}
          <Select
            label="Party"
            value={filters.partyId ?? ""}
            onChange={(v) => setFilters({ partyId: v || undefined })}
            options={parties.map((p: any) => ({ value: p.id, label: `${p.abbreviation} — ${p.name}` }))}
            placeholder="All Parties"
          />

          {/* District */}
          <Select
            label="District"
            value={filters.districtId ?? ""}
            onChange={(v) =>
              setFilters({ districtId: v || undefined, mandalId: undefined })
            }
            options={districts.map((d: any) => ({ value: d.id, label: d.name }))}
            placeholder="All Districts"
          />

          {/* Mandal */}
          <Select
            label="Mandal"
            value={filters.mandalId ?? ""}
            onChange={(v) => setFilters({ mandalId: v || undefined })}
            options={mandals.map((m: any) => ({ value: m.id, label: m.name }))}
            placeholder="All Mandals"
            disabled={!filters.districtId}
          />

          {hasActiveFilters && (
            <button className={styles.applyBtn} onClick={clearFilters}>
              <X size={12} /> Reset All Filters
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
