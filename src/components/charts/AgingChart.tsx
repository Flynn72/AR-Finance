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
import ChartCard from "./ChartCard";
import type { AgingChartPoint } from "../../lib/dashboardSelectors";
import { formatCurrencyCompact, formatCurrency } from "../../lib/format";

const BUCKET_COLORS: Record<AgingChartPoint["bucket"], string> = {
  Current: "#10b981",
  "1-30": "#fbbf24",
  "31-60": "#f59e0b",
  "61-90": "#fb7185",
  ">90": "#ef4444",
};

export default function AgingChart({ data }: { data: AgingChartPoint[] }) {
  return (
    <ChartCard
      title="AR Aging Schedule"
      subtitle="Distribusi outstanding berdasarkan umur piutang"
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: "#475569" }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#475569" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCurrencyCompact(v)}
              width={64}
            />
            <Tooltip
              cursor={{ fill: "#f1f5f9" }}
              formatter={(value) => [formatCurrency(Number(value)), "Outstanding"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                fontFamily: "Inter",
              }}
            />
            <Bar dataKey="amount" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((entry) => (
                <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
