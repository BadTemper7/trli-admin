import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import ChartTooltip from "@/components/dashboard/ChartTooltip.jsx"
import { axisTick, chartColors } from "@/components/dashboard/chartTheme.js"
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters.js"

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <ChartTooltip
      title={label}
      rows={[{ label: "Revenue", value: formatCurrency(payload[0].value), color: chartColors.primary }]}
    />
  )
}

function RevenueChart({ data = [] }) {
  return (
    <div
      role="img"
      aria-label="Area chart of daily revenue for the last seven days, from October 19 to October 25"
      className="h-60 w-full min-w-0"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.18} />
              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis
            dataKey="day"
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={formatCompactCurrency}
            domain={[0, "auto"]}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ stroke: chartColors.secondary, strokeDasharray: 3 }} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={chartColors.primary}
            strokeWidth={2}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RevenueChart
