import React, { useState } from "react";
import { Search, Map, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMapStore } from "../../store/mapStore";
import { lookupService } from "../../services/api";
import styles from "./Header.module.css";

export const Header: React.FC = () => {
  const { selectedYear } = useMapStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ["search", searchQuery],
    queryFn: async () => {
      const res = await lookupService.search(searchQuery);
      return res.data.data;
    },
    enabled: searchQuery.length > 2,
    staleTime: 30_000,
  });

  return (
    <header className={styles.header}>
      {/* Left: Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <Map size={16} />
        </div>
        <div>
          <div className={styles.brandName}>AP Election Map</div>
          <div className={styles.brandSub}>Andhra Pradesh · Booth Intelligence</div>
        </div>
      </div>

      {/* Center: Search */}
      <div className={`${styles.searchWrap} ${searchOpen ? styles.searchActive : ""}`}>
        <Search size={13} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          placeholder="Search district, constituency, mandal, village…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
        />
        {searchOpen && searchResults && searchResults.length > 0 && (
          <div className={styles.searchDropdown}>
            {searchResults.slice(0, 8).map((r: any) => (
              <div key={r.id} className={styles.searchResult}>
                <span className={styles.resultType}>{r.type.replace(/_/g, " ")}</span>
                <span className={styles.resultName}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Year Badge + Alerts */}
      <div className={styles.right}>
        <div className={styles.yearBadge}>
          <span className={styles.yearLabel}>ELECTION</span>
          <span className={styles.yearValue}>{selectedYear}</span>
        </div>
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={15} />
        </button>
      </div>
    </header>
  );
};
