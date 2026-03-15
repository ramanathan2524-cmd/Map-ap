import React from "react";
import { useQuery } from "@tanstack/react-query";
import { resultsService } from "../../services/api";
import { useMapStore } from "../../store/mapStore";
import styles from "./StateSummaryBar.module.css";

export const StateSummaryBar: React.FC = () => {
  const { selectedYear } = useMapStore();

  const { data: summary } = useQuery({
    queryKey: ["state-summary", selectedYear],
    queryFn: async () => {
      const res = await resultsService.getRegionStats("ap", "state", selectedYear);
      return res.data.data ? [res.data.data] : [];
    },
    staleTime: 30 * 60 * 1000,
  });

  if (!summary?.length) return null;

  const totalMLA = summary.reduce((s: number, p: any) => s + (p.mlaSeats ?? 0), 0);

  return (
    <div className={styles.bar}>
      {summary.slice(0, 5).map((party: any) => (
        <div key={party.party} className={styles.partyBlock}>
          <div
            className={styles.colorBar}
            style={{
              background: party.color,
              width: `${((party.mlaSeats / totalMLA) * 100).toFixed(1)}%`,
            }}
          />
          <div className={styles.partyInfo}>
            <span className={styles.partyCode} style={{ color: party.color }}>
              {party.party}
            </span>
            <span className={styles.seats}>{party.mlaSeats}</span>
            <span className={styles.seatsLabel}>MLA</span>
          </div>
        </div>
      ))}
    </div>
  );
};
