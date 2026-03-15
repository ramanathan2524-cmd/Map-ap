import React from "react";
import { X, TrendingUp, Users, Award, BarChart2 } from "lucide-react";
import { useMapStore } from "../../store/mapStore";
import { PartyVoteChart } from "./PartyVoteChart";
import { getPartyColor } from "../../utils/colors";
import styles from "./Sidebar.module.css";

export const Sidebar: React.FC = () => {
  const { selectedRegion, selectedBooth, setSidebarOpen } = useMapStore();

  const data = selectedRegion ?? selectedBooth;
  if (!data) return null;

  const isRegion = !!selectedRegion;
  const title = "name" in data ? data.name : `Booth #${(data as any).boothNumber}`;
  const totalVoters = data.totalVoters;
  const partyResults = data.partyResults ?? [];
  const winningParty = "winningParty" in data ? data.winningParty : undefined;
  const marginOfVictory =
    "marginOfVictory" in data ? (data as any).marginOfVictory : undefined;

  const winner = partyResults.find((p) => p.partyCode === winningParty);
  const sorted = [...partyResults].sort((a, b) => b.votes - a.votes);

  return (
    <aside className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <span className={styles.levelBadge}>
            {isRegion ? (selectedRegion?.level ?? "").replace(/_/g, " ") : "Booth"}
          </span>
          <h2 className={styles.title}>{title}</h2>
          {isRegion && selectedRegion?.level && (
            <p className={styles.subtitle}>
              {(selectedRegion.level).replace(/_/g, " ").toUpperCase()}
            </p>
          )}
        </div>
        <button
          className={styles.closeBtn}
          onClick={() => setSidebarOpen(false)}
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Winner Banner */}
      {winner && (
        <div
          className={styles.winnerBanner}
          style={{ borderColor: getPartyColor(winner.partyCode) }}
        >
          <Award size={14} style={{ color: getPartyColor(winner.partyCode) }} />
          <span className={styles.winnerLabel}>Winner</span>
          <span
            className={styles.winnerName}
            style={{ color: getPartyColor(winner.partyCode) }}
          >
            {winner.partyName}
          </span>
          {marginOfVictory !== undefined && (
            <span className={styles.margin}>
              +{marginOfVictory.toLocaleString("en-IN")} votes
            </span>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <Users size={14} className={styles.statIcon} />
          <div>
            <div className={styles.statValue}>
              {totalVoters.toLocaleString("en-IN")}
            </div>
            <div className={styles.statLabel}>Total Voters</div>
          </div>
        </div>
        {(data as any).voterTurnoutPercent !== undefined && (
          <div className={styles.stat}>
            <TrendingUp size={14} className={styles.statIcon} />
            <div>
              <div className={styles.statValue}>
                {(data as any).voterTurnoutPercent.toFixed(1)}%
              </div>
              <div className={styles.statLabel}>Turnout</div>
            </div>
          </div>
        )}
        {(data as any).totalVotesCast !== undefined && (
          <div className={styles.stat}>
            <BarChart2 size={14} className={styles.statIcon} />
            <div>
              <div className={styles.statValue}>
                {(data as any).totalVotesCast.toLocaleString("en-IN")}
              </div>
              <div className={styles.statLabel}>Votes Cast</div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {partyResults.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Party-wise Results</h3>
          <PartyVoteChart data={sorted} />
        </div>
      )}

      {/* Vote Share Bars */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Vote Share</h3>
        <div className={styles.voteList}>
          {sorted.map((p) => (
            <div key={p.partyId} className={styles.voteItem}>
              <div className={styles.voteItemHeader}>
                <div className={styles.partyInfo}>
                  <span
                    className={styles.partyDot}
                    style={{ background: p.color }}
                  />
                  <span className={styles.partyCode}>{p.partyCode}</span>
                  {p.partyCode === winningParty && (
                    <Award size={11} style={{ color: p.color }} />
                  )}
                </div>
                <div className={styles.voteNumbers}>
                  <span className={styles.votes}>
                    {p.votes.toLocaleString("en-IN")}
                  </span>
                  <span className={styles.voteShare}>
                    {p.voteSharePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className={styles.voteBar}>
                <div
                  className={styles.voteBarFill}
                  style={{
                    width: `${p.voteSharePercent}%`,
                    background: p.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booth-specific metadata */}
      {selectedBooth && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Location</h3>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Village</span>
              <span className={styles.metaValue}>{selectedBooth.villageName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Mandal</span>
              <span className={styles.metaValue}>{selectedBooth.mandalName}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Constituency</span>
              <span className={styles.metaValue}>
                {selectedBooth.mlaConstituencyName}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Coordinates</span>
              <span className={styles.metaValue} style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                {selectedBooth.latitude.toFixed(4)}, {selectedBooth.longitude.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
