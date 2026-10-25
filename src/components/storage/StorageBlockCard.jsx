import { MoreVertical, Warehouse } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function StorageBlockCard({ block, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const full = block.status === 'FULL' || block.availableTeu <= 0
  const statusClass = full ? 'bg-red-50 text-red-700' : block.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : block.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
  return <div className={`relative overflow-visible rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${block.status === 'INACTIVE' ? 'opacity-65' : ''}`} style={{ borderTopWidth: 4, borderTopColor: block.color }}>
    <div className="absolute left-0 top-5 h-12 w-1 rounded-r" style={{ backgroundColor: block.color }} />
    <div className="flex items-start justify-between gap-3"><button type="button" onClick={() => navigate(`/storage-monitoring/${block.id}`)} className="flex flex-1 items-center gap-3 text-left"><span className="rounded-xl p-2.5" style={{ backgroundColor: `${block.color}18`, color: block.color }}><Warehouse className="h-5 w-5" /></span><div><div className="text-lg font-bold">{block.name}</div><div className="text-xs text-muted-foreground">{block.containerSize} Containers</div></div></button><div className="relative"><button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 hover:bg-muted"><MoreVertical className="h-4 w-4" /></button>{open && <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border bg-white p-1 text-sm shadow-xl"><button className="w-full rounded px-3 py-2 text-left hover:bg-muted" onClick={() => navigate(`/storage-monitoring/${block.id}`)}>View Block</button>{onEdit&&<button className="w-full rounded px-3 py-2 text-left hover:bg-muted" onClick={() => { setOpen(false); onEdit(block) }}>Edit Block</button>}{onDelete&&<button className="w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={() => { setOpen(false); onDelete(block) }}>Delete Block</button>}</div>}</div></div>
    <div className="mt-5 flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass}`}>{full ? 'FULL' : block.status}</span><span className="text-xs text-muted-foreground">{block.physicalSlots} slots</span></div>
    <div className="mt-5 grid grid-cols-2 gap-3"><div><div className="text-xs text-muted-foreground">Capacity</div><div className="text-xl font-bold">{block.capacityTeu} <span className="text-xs font-medium">{block.capacityUnit||'TEU'}</span></div></div><div><div className="text-xs text-muted-foreground">Available</div><div className="text-xl font-bold">{block.availableTeu} <span className="text-xs font-medium">{block.capacityUnit||'TEU'}</span></div></div></div>
    <div className="mt-4"><div className="mb-2 flex items-center justify-between text-xs"><span>Current Occupancy</span><span className="font-bold">{block.occupiedTeu} / {block.capacityTeu} {block.capacityUnit||'TEU'} · {block.occupancyRate}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-all" style={{ width: `${block.occupancyRate}%`, backgroundColor: block.color }} /></div></div>
  </div>
}
