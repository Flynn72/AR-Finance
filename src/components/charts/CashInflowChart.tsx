import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";
import type { CashInflowPoint } from "../../lib/dashboardSelectors";
import { formatCurrencyCompact, formatCurrency } from "../../lib/format";

export default function CashInflowChart({ data }: { data: CashInflowPoint[] }) {
  return (
    <ChartCard
      title="Cash Inflow Trend"
      subtitle="Total pembayaran diterima per bulan"
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cashInflowFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              formatter={(value) => [formatCurrency(Number(value)), "Pembayaran Masuk"]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 12,
                fontFamily: "Inter",
              }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#cashInflowFill)"
              dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
