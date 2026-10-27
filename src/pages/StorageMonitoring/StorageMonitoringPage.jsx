import { Box, Boxes, CircleGauge, Plus, Search, Warehouse } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationGuidance from '@/components/operations/OperationGuidance.jsx'
import StorageBlockCard from '@/components/storage/StorageBlockCard.jsx'
import StorageBlockFormModal from '@/components/storage/StorageBlockFormModal.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { adminSocket } from '@/lib/adminSocket.js'
import { storageApi } from '@/lib/storageApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'

function Stat({ icon: Icon, label, value }) { return <div className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="rounded-xl bg-brand-50 p-2.5 text-primary"><Icon className="h-5 w-5" /></span><div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-2xl font-black">{value}</div></div></div></div> }

export default function StorageMonitoringPage() {
  const { can } = useAuth()
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [size, setSize] = useState('')
  const [sort, setSort] = useState('name')
  const [modal, setModal] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try { setLoading(true); setError(''); setBlocks(await storageApi.listBlocks({ search: query, status, size })) } catch (e) { setError(e.message) } finally { setLoading(false) }
  }, [query, status, size])
  useEffect(() => { const t=setTimeout(load,250); return () => clearTimeout(t) }, [load])
  useEffect(() => {
    const matchesFilters = (block) => {
      const nameMatches = !query || String(block?.name || '').toLowerCase().includes(query.toLowerCase())
      const statusMatches = !status || block?.status === status || block?.operationalStatus === status
      const sizeMatches = !size || block?.containerSize === size
      return nameMatches && statusMatches && sizeMatches
    }
    const upsert = (block) => {
      if (!block?.id) return
      setBlocks((current) => {
        const rest = current.filter((item) => item.id !== block.id)
        return matchesFilters(block) ? [...rest, block] : rest
      })
    }
    const removeBlock = ({ id } = {}) => {
      if (!id) return
      setBlocks((current) => current.filter((item) => item.id !== id))
    }
    adminSocket.on('storage:block-created', upsert)
    adminSocket.on('storage:block-updated', upsert)
    adminSocket.on('storage:occupancy-updated', upsert)
    adminSocket.on('storage:block-deleted', removeBlock)
    return () => {
      adminSocket.off('storage:block-created', upsert)
      adminSocket.off('storage:block-updated', upsert)
      adminSocket.off('storage:occupancy-updated', upsert)
      adminSocket.off('storage:block-deleted', removeBlock)
    }
  }, [query, status, size])

  const sorted = useMemo(() => [...blocks].sort((a,b) => {
    if (sort==='occupancy') return b.occupancyRate-a.occupancyRate
    if (sort==='available') return b.availableTeu-a.availableTeu
    if (sort==='status') return a.status.localeCompare(b.status)
    if (sort==='size') return a.containerSize.localeCompare(b.containerSize)
    return a.name.localeCompare(b.name)
  }), [blocks, sort])
  const cap20=blocks.filter(b=>b.containerSize==='20FT').reduce((n,b)=>n+b.capacityTeu,0), cap40=blocks.filter(b=>b.containerSize==='40FT').reduce((n,b)=>n+b.capacityTeu,0), occ20=blocks.filter(b=>b.containerSize==='20FT').reduce((n,b)=>n+b.occupiedTeu,0), occ40=blocks.filter(b=>b.containerSize==='40FT').reduce((n,b)=>n+b.occupiedTeu,0), slots=blocks.reduce((n,b)=>n+b.physicalSlots,0), occupiedSlots=blocks.reduce((n,b)=>n+b.containerCount,0), pct=slots?Math.round(occupiedSlots/slots*100):0

  const save = async (data) => {
    setBusy(true)
    try {
      const saved = modal?.id ? await storageApi.updateBlock(modal.id, data) : await storageApi.createBlock(data)
      setBlocks((current) => {
        const rest = current.filter((item) => item.id !== saved.id)
        return [...rest, saved]
      })
      setModal(null)
    } finally { setBusy(false) }
  }
  const remove = async (block) => {
    if (!window.confirm(`Delete block ${block.name}?`)) return
    try {
      await storageApi.deleteBlock(block.id)
      setBlocks((current) => current.filter((item) => item.id !== block.id))
    } catch (e) { window.alert(e.message) }
  }

  return <PageContainer className="max-w-[1800px]"><PageHeader title="Storage Monitoring" description="Monitor yard blocks, capacity, occupancy, and container placement." actions={can(MODULES.STORAGE_MONITORING,ACTIONS.CREATE)?<Button onClick={() => setModal({})}><Plus className="mr-2 h-4 w-4" />Add Block</Button>:null} />
    <OperationGuidance current={1} steps={[{title:"Container physically gated in",note:"Verified payment and accepted inspection are required."},{title:"Assign block and slot",note:"Open an active block and choose an available position."},{title:"Monitor occupancy",note:"Stored containers remain here until physical release."}]} note="Storage assignment only uses the current gated-in inventory. Gate-out approval does not free a slot; final physical release does."/>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={Warehouse} label="Configured Capacity" value={`${cap20.toLocaleString()} TEU / ${cap40.toLocaleString()} FEU`} /><Stat icon={Boxes} label="Currently Occupied" value={`${occ20.toLocaleString()} TEU / ${occ40.toLocaleString()} FEU`} /><Stat icon={Box} label="Physical Slots" value={slots.toLocaleString()} /><Stat icon={CircleGauge} label="Slot Occupancy" value={`${pct}%`} /></div>
    <div className="mb-5 flex flex-wrap gap-3 rounded-2xl border bg-white p-4 shadow-sm"><div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search blocks..." /></div><select className="h-10 rounded-lg border bg-white px-3 text-sm" value={status} onChange={(e)=>setStatus(e.target.value)}><option value="">All Statuses</option><option>ACTIVE</option><option>INACTIVE</option><option>MAINTENANCE</option><option>FULL</option></select><select className="h-10 rounded-lg border bg-white px-3 text-sm" value={size} onChange={(e)=>setSize(e.target.value)}><option value="">All Sizes</option><option>20FT</option><option>40FT</option></select><select className="h-10 rounded-lg border bg-white px-3 text-sm" value={sort} onChange={(e)=>setSort(e.target.value)}><option value="name">Sort: Name</option><option value="occupancy">Sort: Occupancy</option><option value="available">Sort: Available</option><option value="status">Sort: Status</option><option value="size">Sort: Container Size</option></select></div>
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<div className="mt-1 text-xs">Check VITE_API_BASE_URL, your Admin login session, permissions, and the server storage routes.</div></div>}
    <div className="mb-3 flex items-center justify-between"><div><h2 className="font-bold">Yard Blocks</h2><p className="text-xs text-muted-foreground">Card-based operational view. Open a block to assign and locate containers.</p></div><span className="text-xs text-muted-foreground">{blocks.length} blocks</span></div>
    {loading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{Array.from({length:7}).map((_,i)=><div key={i} className="h-64 animate-pulse rounded-2xl border bg-white" />)}</div> : sorted.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{sorted.map((block)=><StorageBlockCard key={block.id} block={block} onEdit={can(MODULES.STORAGE_MONITORING,ACTIONS.EDIT)?setModal:null} onDelete={can(MODULES.STORAGE_MONITORING,ACTIONS.DELETE)?remove:null} />)}</div> : <div className="rounded-2xl border border-dashed bg-white p-12 text-center"><Warehouse className="mx-auto h-10 w-10 text-muted-foreground" /><div className="mt-3 font-bold">No storage blocks found</div><div className="mt-1 text-sm text-muted-foreground">Create the first block or change your filters.</div>{can(MODULES.STORAGE_MONITORING,ACTIONS.CREATE)&&<Button className="mt-4" onClick={()=>setModal({})}><Plus className="mr-2 h-4 w-4" />Add Block</Button>}</div>}
    <StorageBlockFormModal open={!!modal} block={modal?.id?modal:null} busy={busy} onClose={()=>setModal(null)} onSubmit={save} />
  </PageContainer>
}
