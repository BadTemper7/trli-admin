import { useEffect, useMemo } from "react"
import { Clock3 } from "lucide-react"

const TIME_ZONE = "Asia/Manila"

function zonedParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  return Object.fromEntries(parts.map((part) => [part.type, part.value]))
}

function todayKey() {
  const p = zonedParts()
  return `${p.year}-${p.month}-${p.day}`
}

function currentHour() {
  return Number(zonedParts().hour)
}

function slotForHour(hour) {
  const value = `${String(hour).padStart(2, "0")}:00`
  const label = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(new Date(`2020-01-01T${value}:00Z`))
  return { value, label }
}

export function getHourlySlotState(selectedDate) {
  const today = todayKey()
  const nowHour = currentHour()
  const isPast = Boolean(selectedDate) && selectedDate < today
  const isToday = selectedDate === today
  const slots = Array.from({ length: 24 }, (_, hour) => ({
    ...slotForHour(hour),
    disabled: !selectedDate || isPast || (isToday && hour <= nowHour),
  }))
  return { today, isPast, isToday, slots }
}

export default function HourlySchedulePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  disabled = false,
  required = false,
}) {
  const state = useMemo(() => getHourlySlotState(date), [date])
  const available = state.slots.filter((slot) => !slot.disabled)

  useEffect(() => {
    if (!time) return
    const selected = state.slots.find((slot) => slot.value === time)
    if (!selected || selected.disabled) onTimeChange("")
  }, [date, time, state.slots, onTimeChange])

  const helper = !date
    ? "Select a date first to see available 1-hour slots."
    : state.isPast
      ? "Past dates are not available."
      : state.isToday && available.length === 0
        ? "No time slots remain today. Select a future date."
        : state.isToday
          ? "For today, only the next full hour and later can be selected."
          : "Times are available in 1-hour intervals."

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{dateLabel}{required ? " *" : ""}</label>
        <input
          type="date"
          min={state.today}
          value={date || ""}
          onChange={(event) => onDateChange(event.target.value)}
          disabled={disabled}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:var(--ring)] disabled:bg-slate-100"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">{timeLabel}{required ? " *" : ""}</label>
        <div className="relative">
          <select
            value={time || ""}
            onChange={(event) => onTimeChange(event.target.value)}
            disabled={disabled || !date || state.isPast || available.length === 0}
            className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color:var(--ring)] disabled:bg-slate-100"
          >
            <option value="">Select hour</option>
            {state.slots.map((slot) => (
              <option key={slot.value} value={slot.value} disabled={slot.disabled}>{slot.label}</option>
            ))}
          </select>
          <Clock3 size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <p className={`text-xs ${state.isPast || (state.isToday && available.length === 0) ? "text-red-600" : "text-slate-500"}`}>{helper}</p>
      </div>
    </div>
  )
}
