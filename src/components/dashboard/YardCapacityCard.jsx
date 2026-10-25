import DashboardCard from "@/components/dashboard/DashboardCard.jsx"
import { capacityThresholds, getCapacityStatus } from "@/lib/capacityStatus.js"
import { formatNumber, formatPercent } from "@/lib/formatters.js"
import { cn } from "@/lib/utils.js"

// The meter is drawn as slots, like bays in a yard: each one is 2.5% of capacity.
const SEGMENTS = 40

function Figure({ label, value, emphasis = false }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 font-bold tabular-nums tracking-tight",
          emphasis ? "text-2xl text-foreground" : "text-xl text-foreground"
        )}
      >
        {value}
        <span className="ml-1 text-sm font-medium text-muted-foreground">TEU</span>
      </dd>
    </div>
  )
}

function YardCapacityCard({ stats }) {
  const { totalCapacity, currentInventory, availableCapacity, occupancyRate } = stats
  const status = getCapacityStatus(occupancyRate)
  const filled = Math.round((occupancyRate / 100) * SEGMENTS)

  return (
    <DashboardCard
      title="Yard Capacity"
      className="h-full"
      action={
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            status.badge
          )}
        >
          {status.label} capacity
        </span>
      }
    >
      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-bold tabular-nums tracking-tight">
          {formatPercent(occupancyRate)}
        </span>
        <span className="text-sm text-muted-foreground">occupancy rate</span>
      </div>

      <div className="flex flex-1 flex-col justify-center py-6">
        <div
          role="progressbar"
          aria-label="Yard occupancy"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(occupancyRate)}
          aria-valuetext={`${formatPercent(occupancyRate)} occupied, ${status.label}`}
          className="flex h-14 gap-[3px]"
        >
          {Array.from({ length: SEGMENTS }, (_, index) => (
            <span
              key={index}
              className="flex-1 rounded-[2px]"
              style={{
                backgroundColor: index < filled ? status.bar : "#e9ebf0",
              }}
            />
          ))}
        </div>

        {/* Threshold ticks: where Moderate, High and Critical begin. */}
        <div aria-hidden="true" className="relative mt-1.5 h-8">
          {capacityThresholds.map((threshold) => (
            <span
              key={threshold}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${threshold}%` }}
            >
              <span className="h-1.5 w-px bg-input" />
              <span className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                {threshold}%
              </span>
            </span>
          ))}
        </div>
      </div>

      <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-5">
        <Figure label="Current inventory" value={formatNumber(currentInventory)} />
        <Figure
          label="Available"
          value={formatNumber(availableCapacity)}
          emphasis
        />
        <Figure label="Maximum capacity" value={formatNumber(totalCapacity)} />
      </dl>

      <p className="mt-4 text-sm text-muted-foreground">
        {formatNumber(currentInventory)} / {formatNumber(totalCapacity)} TEU used,{" "}
        <span className="font-semibold text-foreground">
          {formatNumber(availableCapacity)} TEU available
        </span>
      </p>
    </DashboardCard>
  )
}

export default YardCapacityCard
