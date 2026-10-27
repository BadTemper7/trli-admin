import { X } from 'lucide-react'

export default function ContainerInfoModal({ container, block, onClose, onRelocate, onRemove }) {
  if (!container) return null
  const s = container.storage || {}
  const fields = [
    ['Container Number', container.containerNumber], ['Container Size', container.size], ['Container Type', container.type], ['Load Status', container.loadStatus],
    ['Transaction', container.transactionClassification], ['Client', container.client], ['Shipping Line', container.shippingLine], ['Gate-in Date', container.gateInDate], ['Gate-in Time', container.gateInTime],
    ['Days in Terminal (Manila Calendar)', container.daysInTerminal ?? '—'], ['Truck Plate', container.truckPlate], ['Driver', container.driver], ['Storage Block', block?.name || ''], ['Bay', s.bay], ['Row', s.row], ['Tier', s.tier], ['Weight', container.weight], ['Cargo Description', container.cargoDescription], ['Remarks', container.remarks],
  ]
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={(e) => e.target===e.currentTarget&&onClose()}><div className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl"><div className="sticky top-0 flex items-center justify-between border-b bg-white p-5"><div><div className="text-xs font-bold uppercase text-muted-foreground">Stored Container</div><h3 className="text-xl font-black">{container.containerNumber}</h3></div><button onClick={onClose} className="rounded-lg p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="space-y-3 p-5">{fields.map(([k,v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 border-b pb-2 text-sm"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{v || '—'}</span></div>)}</div><div className="sticky bottom-0 flex gap-2 border-t bg-white p-5"><button onClick={onRelocate} className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white">Relocate Container</button><button onClick={onRemove} className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600">Mark for Gate-out</button></div></div></div>
}
