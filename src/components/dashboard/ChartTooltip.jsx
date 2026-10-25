// Tooltip body shared by all dashboard charts.
// `rows` is a list of { label, value, color? }, already formatted.
function ChartTooltip({ title, rows }) {
  return (
    <div className="min-w-36 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm shadow-lg">
      <p className="mb-1.5 font-semibold text-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              {row.color && (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full"
                  style={{ backgroundColor: row.color }}
                />
              )}
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-foreground">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ChartTooltip
