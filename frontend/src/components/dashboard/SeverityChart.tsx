import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Investigation } from "../../types/investigation";
import { normalizeSeverity } from "../../utils/formatters";

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "none"] as const;
const SEVERITY_COLORS: Record<string, string> = {
  critical: "#FF4D5E",
  high: "#FF8A3D",
  medium: "#F5C244",
  low: "#4DA3FF",
  none: "#3C4A63",
};

export function SeverityChart({ investigations }: { investigations: Investigation[] }) {
  const counts = SEVERITY_ORDER.reduce<Record<string, number>>((acc, level) => {
    acc[level] = 0;
    return acc;
  }, {});

  investigations.forEach((inv) => {
    counts[normalizeSeverity(inv.severity)] += 1;
  });

  const data = SEVERITY_ORDER.map((level) => ({
    severity: level.charAt(0).toUpperCase() + level.slice(1),
    count: counts[level],
    key: level,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="severity"
            tick={{ fill: "#8A96AC", fontSize: 12 }}
            axisLine={{ stroke: "#1E293B" }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#8A96AC", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(45,212,200,0.06)" }}
            contentStyle={{
              background: "#101827",
              border: "1px solid #1E293B",
              borderRadius: 8,
              fontSize: 12,
              color: "#E6ECF5",
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
