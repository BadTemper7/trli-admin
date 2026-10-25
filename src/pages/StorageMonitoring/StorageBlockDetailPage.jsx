import { ArrowLeft, Box, Boxes, CircleGauge, Edit3, Search, Warehouse } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ContainerInfoModal from '@/components/storage/ContainerInfoModal.jsx'
import PositionPicker from '@/components/storage/PositionPicker.jsx'
import StorageBlockFormModal from '@/components/storage/StorageBlockFormModal.jsx'
import YardVisualization from '@/components/storage/YardVisualization.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { adminSocket } from '@/lib/adminSocket.js'
import { storageApi } from '@/lib/storageApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'

function Summary({ label, value, icon: Icon }) { return <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-3"><Icon className="h-5 w-5 text-primary" /><div><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="text-xl font-black">{value}</div></div></div></div> }
const pos = (c) => `B${String(c.storage?.bay||0).padStart(2,'0')}-R${String(c.storage?.row||0).padStart(2,'0')}-T${String(c.storage?.tier||0).padStart(2,'0')}`

export default function StorageBlockDetailPage() {
  const { can } = useAuth()
  const { blockId } = useParams()
  const [block,setBlock]=useState(null), [containers,setContainers]=useState([]), [waiting,setWaiting]=useState([]), [loading,setLoading]=useState(true), [error,setError]=useState('')
  const [assigning,setAssigning]=useState(null), [relocating,setRelocating]=useState(null), [selected,setSelected]=useState(null), [editing,setEditing]=useState(false), [busy,setBusy]=useState(false), [query,setQuery]=useState('')
  const load=useCallback(async()=>{try{setLoading(true);setError('');const [b,c,w]=await Promise.all([storageApi.getBlock(blockId),storageApi.containers(blockId),storageApi.waiting()]);setBlock(b);setContainers(c);setWaiting(w)}catch(e){setError(e.message)}finally{setLoading(false)}},[blockId])
  useEffect(()=>{load()},[load])
  useEffect(()=>{
    const upsertContainer=(container)=>{
      if(!container?.id)return
      const destination=String(container.storage?.block||'')
      setContainers((current)=>{
        const rest=current.filter((item)=>item.id!==container.id)
        return destination===String(blockId)?[...rest,container]:rest
      })
      if(destination===String(blockId))setWaiting((current)=>current.filter((item)=>item.id!==container.id))
    }
    const removeContainer=({id}={})=>{if(id)setContainers((current)=>current.filter((item)=>item.id!==id))}
    const updateBlock=(nextBlock)=>{if(nextBlock?.id===blockId)setBlock(nextBlock)}
    adminSocket.on('storage:container-assigned',upsertContainer)
    adminSocket.on('storage:container-relocated',upsertContainer)
    adminSocket.on('storage:container-removed',removeContainer)
    adminSocket.on('storage:occupancy-updated',updateBlock)
    adminSocket.on('storage:block-updated',updateBlock)
    return()=>{
      adminSocket.off('storage:container-assigned',upsertContainer)
      adminSocket.off('storage:container-relocated',upsertContainer)
      adminSocket.off('storage:container-removed',removeContainer)
      adminSocket.off('storage:occupancy-updated',updateBlock)
      adminSocket.off('storage:block-updated',updateBlock)
    }
  },[blockId])
  const filtered=useMemo(()=>containers.filter(c=>c.containerNumber.toLowerCase().includes(query.toLowerCase())),[containers,query])
  if(loading&&!block)return <PageContainer><div className="h-80 animate-pulse rounded-2xl border bg-white" /></PageContainer>
  if(error&&!block)return <PageContainer><div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">{error}</div></PageContainer>
  if(!block)return null
  const eligibleWaiting=waiting.filter(c=>c.size===block.containerSize)
  const assign=async(position)=>{setBusy(true);try{const saved=await storageApi.assign(block.id,{containerId:assigning.id,...position});setContainers((current)=>[...current.filter((item)=>item.id!==saved.id),saved]);setWaiting((current)=>current.filter((item)=>item.id!==saved.id));setAssigning(null)}catch(e){window.alert(e.message)}finally{setBusy(false)}}
  const relocate=async(position)=>{setBusy(true);try{const saved=await storageApi.relocate(relocating.id,{blockId:block.id,...position});setContainers((current)=>[...current.filter((item)=>item.id!==saved.id),saved]);setRelocating(null);setSelected(null)}catch(e){window.alert(e.message)}finally{setBusy(false)}}
  const remove=async()=>{if(!selected||!window.confirm(`Remove ${selected.containerNumber} from ${block.name}?`))return;try{await storageApi.remove(selected.id);setContainers((current)=>current.filter((item)=>item.id!==selected.id));setSelected(null)}catch(e){window.alert(e.message)}}
  return <PageContainer className="max-w-[1800px]"><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><Link to="/storage-monitoring" className="mb-3 inline-flex items-center text-sm font-semibold text-primary"><ArrowLeft className="mr-1 h-4 w-4" />Storage Monitoring</Link><div className="flex items-center gap-3"><span className="h-8 w-2 rounded-full" style={{background:block.color}} /><div><h1 className="text-2xl font-black">Block {block.name}</h1><p className="text-sm text-muted-foreground">{block.containerSize} Container Storage · {block.layout.bays} bays × {block.layout.rows} rows × {block.layout.tiers} tiers</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${block.status==='ACTIVE'?'bg-emerald-50 text-emerald-700':block.status==='FULL'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700'}`}>{block.status}</span></div></div>{can(MODULES.STORAGE_MONITORING,ACTIONS.EDIT)&&<Button variant="outline" onClick={()=>setEditing(true)}><Edit3 className="mr-2 h-4 w-4" />Edit Block</Button>}</div>
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Summary label="Capacity" value={`${block.capacityTeu} ${block.capacityUnit||'TEU'}`} icon={Warehouse}/><Summary label="Occupied" value={`${block.occupiedTeu} ${block.capacityUnit||'TEU'}`} icon={Boxes}/><Summary label="Available" value={`${block.availableTeu} ${block.capacityUnit||'TEU'}`} icon={Box}/><Summary label="Occupancy" value={`${block.occupancyRate}%`} icon={CircleGauge}/><Summary label="Container Size" value={block.containerSize} icon={Box}/><Summary label="Physical Slots" value={block.physicalSlots} icon={Warehouse}/></div>
    <section className="mb-5 rounded-2xl border bg-white shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="font-bold">Containers Waiting for Storage</h2><p className="text-xs text-muted-foreground">Only {block.containerSize} gated-in containers are assignable to this block.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{eligibleWaiting.length} waiting</span></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr>{['Container Number','Size','Type','Load Status','Shipping Line','Client','Gate-in Time','Action'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{eligibleWaiting.map(c=><tr key={c.id} className="border-t"><td className="px-4 py-3 font-bold">{c.containerNumber}</td><td className="px-4 py-3">{c.size}</td><td className="px-4 py-3">{c.type}</td><td className="px-4 py-3">{c.loadStatus}</td><td className="px-4 py-3">{c.shippingLine}</td><td className="px-4 py-3">{c.client}</td><td className="px-4 py-3">{c.gateInTime}</td><td className="px-4 py-3">{can(MODULES.STORAGE_MONITORING,ACTIONS.ASSIGN)&&<Button size="sm" disabled={block.status!=='ACTIVE'||block.availableTeu<=0} onClick={()=>setAssigning(c)}>Assign</Button>}</td></tr>)}{!eligibleWaiting.length&&<tr><td colSpan="8" className="px-4 py-10 text-center text-muted-foreground">No matching gated-in containers are waiting for storage.</td></tr>}</tbody></table></div></section>
    <YardVisualization block={block} containers={containers} highlightedId={selected?.id} onSelect={setSelected} />
    <section className="mt-5 rounded-2xl border bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><h2 className="font-bold">Stored Containers</h2><p className="text-xs text-muted-foreground">Search, locate, and open a container from this block.</p></div><div className="relative w-full max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input className="pl-9" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Container..."/></div></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr>{['Container Number','Position','Size','Type','Load Status','Shipping Line','Client','Stored Since','Actions'].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{filtered.map(c=><tr key={c.id} className="border-t hover:bg-slate-50"><td className="px-4 py-3 font-bold">{c.containerNumber}</td><td className="px-4 py-3 font-mono text-xs">{pos(c)}</td><td className="px-4 py-3">{c.size}</td><td className="px-4 py-3">{c.type}</td><td className="px-4 py-3">{c.loadStatus}</td><td className="px-4 py-3">{c.shippingLine}</td><td className="px-4 py-3">{c.client}</td><td className="px-4 py-3">{c.storage?.storedAt?new Date(c.storage.storedAt).toLocaleString():'—'}</td><td className="px-4 py-3"><button onClick={()=>setSelected(c)} className="font-bold text-primary">View</button></td></tr>)}{!filtered.length&&<tr><td colSpan="9" className="px-4 py-10 text-center text-muted-foreground">No stored containers found.</td></tr>}</tbody></table></div></section>
    {assigning&&<PositionPicker block={block} occupied={containers} onCancel={()=>setAssigning(null)} onConfirm={assign} busy={busy}/>} {relocating&&<PositionPicker block={block} occupied={containers.filter(c=>c.id!==relocating.id)} title={`Relocate ${relocating.containerNumber}`} onCancel={()=>setRelocating(null)} onConfirm={relocate} busy={busy}/>}<ContainerInfoModal container={selected} block={block} onClose={()=>setSelected(null)} onRelocate={can(MODULES.STORAGE_MONITORING,ACTIONS.RELOCATE)?()=>{setRelocating(selected);setSelected(null)}:null} onRemove={can(MODULES.STORAGE_MONITORING,ACTIONS.EDIT)?remove:null}/><StorageBlockFormModal open={editing} block={block} onClose={()=>setEditing(false)} busy={busy} onSubmit={async(data)=>{setBusy(true);try{const saved=await storageApi.updateBlock(block.id,data);setBlock(saved);setEditing(false)}finally{setBusy(false)}}}/>
  </PageContainer>
}
