import React from "react";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";
import { useMapStore } from "../../store/mapStore";
import { getMapRef } from "../../utils/mapRef";
import { AP_BOUNDS } from "@shared/constants";
import styles from "./Breadcrumb.module.css";

export const Breadcrumb: React.FC = () => {
  const { breadcrumb, navigateToLevel } = useMapStore();

  const flyToAP = () => {
    const map = getMapRef();
    if (map) {
      map.flyToBounds(
        [
          [AP_BOUNDS.south, AP_BOUNDS.west],
          [AP_BOUNDS.north, AP_BOUNDS.east],
        ],
        { duration: 0.5, padding: [20, 20] }
      );
    }
  };

  const flyToBounds = (bounds: [[number, number], [number, number]] | undefined) => {
    const map = getMapRef();
    if (bounds && map) {
      map.flyToBounds(bounds, { padding: [40, 40], paddingBottomRight: [360, 40], duration: 0.5 });
    }
  };

  const handleCrumbClick = (index: number) => {
    if (index === 0) {
      navigateToLevel(0);
      flyToAP();
      return;
    }
    const crumb = breadcrumb[index];
    navigateToLevel(index);
    flyToBounds(crumb.bounds);
  };

  const handleBack = () => {
    if (breadcrumb.length <= 1) return;
    const targetIndex = breadcrumb.length - 2;
    if (targetIndex === 0) {
      navigateToLevel(0);
      flyToAP();
    } else {
      const crumb = breadcrumb[targetIndex];
      navigateToLevel(targetIndex);
      flyToBounds(crumb.bounds);
    }
  };

  return (
    <div className={styles.breadcrumb}>
      {/* Back button — only show when drilled in */}
      {breadcrumb.length > 1 && (
        <button
          className={styles.backBtn}
          onClick={handleBack}
          title="Go back one level"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <button
        className={styles.homeBtn}
        onClick={() => handleCrumbClick(0)}
        title="Back to Andhra Pradesh"
      >
        <Home size={14} />
      </button>
      {breadcrumb.map((crumb, idx) => (
        <React.Fragment key={crumb.id}>
          <ChevronRight size={12} className={styles.separator} />
          <button
            className={`${styles.crumb} ${
              idx === breadcrumb.length - 1 ? styles.active : ""
            }`}
            onClick={() => handleCrumbClick(idx)}
          >
            {crumb.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
