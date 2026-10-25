import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import ChartTooltip from "@/components/dashboard/ChartTooltip.jsx"
import DashboardCard from "@/components/dashboard/DashboardCard.jsx"
import { axisTick, chartColors } from "@/components/dashboard/chartTheme.js"
import { formatNumber } from "@/lib/formatters.js"

const series = [
  { key: "received", label: "Received", color: chartColors.primary },
  { key: "released", label: "Released", color: chartColors.secondary },
]

function MovementTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <ChartTooltip
      title={label}
      rows={series.map((item) => ({
        label: item.label,
        color: item.color,
        value: formatNumber(payload.find((p) => p.dataKey === item.key)?.value ?? 0),
      }))}
    />
  )
}

function Legend() {
  return (
    <ul className="flex items-center gap-4 text-sm text-muted-foreground">
      {series.map((item) => (
        <li key={item.key} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function ContainerMovementChart({ data = [] }) {
  return (
    <DashboardCard
      title="Container Movement"
      description="Received vs released, last 7 days"
      action={<Legend />}
    >
      <div
        role="img"
        aria-label="Grouped bar chart comparing containers received and released each day from October 19 to October 25"
        className="h-72 w-full min-w-0"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={4}
            barCategoryGap="22%"
          >
            <CartesianGrid vertical={false} stroke={chartColors.grid} />
            <XAxis
              dataKey="day"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              minTickGap={12}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={36}
              domain={[0, "auto"]}
            />
            <Tooltip content={<MovementTooltip />} cursor={{ fill: chartColors.cursor }} />
            {series.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}

export default ContainerMovementChart
