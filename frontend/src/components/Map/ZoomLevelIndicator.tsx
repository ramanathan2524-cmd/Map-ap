import React from "react";
import { useMapStore } from "../../store/mapStore";
import { ZOOM_LEVELS } from "@shared/constants";
import styles from "./ZoomLevelIndicator.module.css";

const LEVEL_LABELS: Record<string, string> = {
  state: "State",
  district: "District",
  mp_constituency: "MP Constituency",
  mla_constituency: "MLA Constituency",
  mandal: "Mandal",
  village: "Village",
  booth: "Booth",
};

const LEVEL_ORDER = [
  "state",
  "district",
  "mp_constituency",
  "mla_constituency",
  "mandal",
  "village",
  "booth",
];

export const ZoomLevelIndicator: React.FC = () => {
  const { currentLevel, currentZoom } = useMapStore();
  const currentIdx = LEVEL_ORDER.indexOf(currentLevel);

  return (
    <div className={styles.container}>
      <div className={styles.label}>Zoom in to explore deeper</div>
      <div className={styles.levels}>
        {LEVEL_ORDER.map((lvl, i) => (
          <div
            key={lvl}
            className={`${styles.level} ${i === currentIdx ? styles.active : ""} ${i < currentIdx ? styles.done : ""}`}
          >
            <div className={styles.dot} />
            <span className={styles.name}>{LEVEL_LABELS[lvl]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
