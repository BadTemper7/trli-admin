import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Container,
  TriangleAlert,
} from "lucide-react"

import StatCard from "@/components/dashboard/StatCard.jsx"
import TrendText from "@/components/dashboard/TrendText.jsx"
import { formatNumber } from "@/lib/formatters.js"

function DashboardStats({ stats }) {

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Containers Received Today"
        value={formatNumber(stats.receivedToday)}
        icon={ArrowDownToLine}
        footer={
          <TrendText change={stats.receivedChange} comparison="vs yesterday" />
        }
      />
      <StatCard
        title="Containers Released Today"
        value={formatNumber(stats.releasedToday)}
        icon={ArrowUpFromLine}
        footer={
          <TrendText change={stats.releasedChange} comparison="vs yesterday" />
        }
      />
      <StatCard
        title="Current Inventory"
        value={formatNumber(stats.currentInventory)}
        icon={Container}
        footer={
          <span className="text-muted-foreground">containers currently in yard</span>
        }
      />
      <StatCard
        title="Overstaying Containers"
        value={formatNumber(stats.overstayingContainers)}
        icon={TriangleAlert}
        tone="warning"
        footer={
          <span className="font-semibold text-danger-600">
            {formatNumber(stats.criticalOverstaying)} require immediate attention
          </span>
        }
      />
    </div>
  )
}

export default DashboardStats
