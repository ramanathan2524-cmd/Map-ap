import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { PARTY_COLORS, PARTY_NAMES } from "@shared/constants";
import styles from "./Legend.module.css";

const MAIN_PARTIES = ["TDP", "YSRCP", "JSP", "BJP"];

export const Legend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.legend}>
      <div className={styles.legendHeader} onClick={() => setCollapsed(!collapsed)}>
        <span className={styles.legendTitle}>Party Colors</span>
        <button className={styles.toggleBtn}>
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {!collapsed && (
        <div className={styles.legendBody}>
          {MAIN_PARTIES.map((code) => (
            <div key={code} className={styles.legendItem}>
              <span className={styles.colorSwatch} style={{ background: PARTY_COLORS[code] }} />
              <span className={styles.partyCode}>{code}</span>
              <span className={styles.partyName}>{PARTY_NAMES[code]}</span>
            </div>
          ))}
          <div className={styles.legendItem}>
            <span className={styles.colorSwatch} style={{ background: PARTY_COLORS.OTH }} />
            <span className={styles.partyCode}>OTH</span>
            <span className={styles.partyName}>Others</span>
          </div>
        </div>
      )}
    </div>
  );
};
