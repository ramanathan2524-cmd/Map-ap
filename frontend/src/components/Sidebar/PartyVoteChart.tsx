import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { PartyResult } from "@shared/types";

interface Props {
  data: PartyResult[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as PartyResult;
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-sm)",
      padding: "8px 12px",
      fontSize: 12,
      fontFamily: "var(--font-body)",
    }}>
      <strong style={{ color: d.color }}>{d.partyCode}</strong>
      <div style={{ color: "var(--color-text-secondary)", marginTop: 2 }}>
        {d.votes.toLocaleString("en-IN")} votes ({d.voteSharePercent.toFixed(1)}%)
      </div>
    </div>
  );
};

export const PartyVoteChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barCategoryGap="25%"
      >
        <XAxis
          dataKey="partyCode"
          tick={{ fill: "var(--color-text-secondary)", fontSize: 10, fontFamily: "var(--font-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 9 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
        <Bar dataKey="votes" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.partyId} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};
