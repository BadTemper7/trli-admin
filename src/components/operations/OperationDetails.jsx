import { formatDateTime } from './OperationStatus.jsx'

export function DetailGrid({ item }) {
  const pairs = [
    ['Booking Reference', item.bookingReference], ['Container', item.containerNumber], ['Company', item.company?.companyName],
    ['Container Size', item.containerSize], ['Type', item.containerType], ['Load Status', item.loadStatus],
    ['Classification', item.transactionClassification], ['Shipping Line', item.shippingLine], ['Hauler', item.hauler],
    ['Truck Plate', item.truckPlateNumber], ['Driver', item.driverName], ['Scheduled Gate-in', `${item.scheduledGateDateIn || ''} ${item.scheduledGateTimeIn || ''}`],
  ]
  return <div className="grid grid-cols-2 gap-x-5 gap-y-4">{pairs.map(([label, value]) => <div key={label}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold text-foreground">{value || '—'}</p></div>)}</div>
}

export function WorkflowMini({ history = [] }) {
  const rows = [...history].slice(-6).reverse()
  return <div className="space-y-3">{rows.map((entry, index) => <div key={`${entry.stage}-${entry.changedAt}-${index}`} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><div><p className="text-sm font-semibold text-foreground">{entry.stage?.replaceAll('_', ' ')}</p><p className="text-xs text-muted-foreground">{formatDateTime(entry.changedAt)}{entry.note ? ` · ${entry.note}` : ''}</p></div></div>)}</div>
}
