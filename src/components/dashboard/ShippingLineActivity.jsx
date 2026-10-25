import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import ChartTooltip from "@/components/dashboard/ChartTooltip.jsx"
import DashboardCard from "@/components/dashboard/DashboardCard.jsx"
import { axisTick, chartColors } from "@/components/dashboard/chartTheme.js"
import { formatNumber } from "@/lib/formatters.js"

function LineTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const line = payload[0].payload
  return (
    <ChartTooltip
      title={line.name}
      rows={[
        { label: "Inbound", value: formatNumber(line.inbound) },
        { label: "Outbound", value: formatNumber(line.outbound) },
        { label: "Total", value: formatNumber(line.total) },
      ]}
    />
  )
}

function ShippingLineActivity({ data = [] }) {
  return (
    <DashboardCard
      title="Shipping Line Activity"
      description="Total container movements"
      className="h-full"
    >
      <div
        role="img"
        aria-label="Horizontal bar chart of total container movements by shipping line: Maersk 143, CMA CGM 125, Evergreen 103, ONE 88, COSCO 74"
        className="h-72 w-full min-w-0 flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid horizontal={false} stroke={chartColors.grid} />
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="name"
              width={92}
              tick={{ ...axisTick, fill: "#1a1d26", fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<LineTooltip />} cursor={{ fill: chartColors.cursor }} />
            <Bar
              dataKey="total"
              fill={chartColors.primary}
              radius={[0, 4, 4, 0]}
              maxBarSize={26}
            >
              <LabelList
                dataKey="total"
                position="right"
                fill="#1a1d26"
                fontSize={12}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}

export default ShippingLineActivity
