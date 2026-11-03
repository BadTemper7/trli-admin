import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Container,
  TriangleAlert,
  DollarSign,
  ClipboardList,
  Boxes,
} from "lucide-react"

import StatCard from "@/components/dashboard/StatCard.jsx"
import TrendText from "@/components/dashboard/TrendText.jsx"
import { formatCurrency, formatNumber } from "@/lib/formatters.js"

function DashboardStats({ stats }) {

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Containers Received in Period"
        value={formatNumber(stats.receivedToday)}
        icon={ArrowDownToLine}
        footer={
          <TrendText change={stats.receivedChange} comparison="vs previous period" />
        }
      />
      <StatCard
        title="Containers Released in Period"
        value={formatNumber(stats.releasedToday)}
        icon={ArrowUpFromLine}
        footer={
          <TrendText change={stats.releasedChange} comparison="vs previous period" />
        }
      />
      <StatCard title="Total Container Records in Period" value={formatNumber(stats.totalContainers||0)} icon={Boxes} footer={<span className="text-muted-foreground">Live bookings and imported history</span>} />
      <StatCard title="Pending Booking Approvals" value={formatNumber(stats.pendingApprovals||0)} icon={ClipboardList} footer={<span className="text-muted-foreground">Submitted in selected period</span>} />
      <StatCard title="Verified Revenue in Period" value={formatCurrency(stats.totalRevenue||0)} icon={DollarSign} footer={<span className="text-muted-foreground">Verified payments, net of recorded reversals</span>} />
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
