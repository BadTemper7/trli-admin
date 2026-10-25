import { useState } from 'react'
import { Package, Warehouse } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { DetailGrid } from '@/components/operations/OperationDetails.jsx'
import { OperationStatus, formatDateTime } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { operationsApi } from '@/lib/operationsApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'
import { usePagedOperationsList } from '@/hooks/usePagedOperationsList.js'

const INVENTORY_EVENTS = ['inventory:updated', 'storage:container-assigned']

function InventoryPage() {
  const { rows, setRows, search, setSearch, setPage, pagination, loading, error, setError, load } = usePagedOperationsList(operationsApi.inventory.list, INVENTORY_EVENTS)
  const [selected,setSelected]=useState(null),[form,setForm]=useState({condition:[],sealNumber:'',notes:''}),[busy,setBusy]=useState(false)
  const { can }=useAuth()
  const open=(r)=>{setSelected(r);setForm({condition:Array.isArray(r.inventory?.condition)?r.inventory.condition:(r.inventory?.condition?[r.inventory.condition]:[]),sealNumber:r.inventory?.sealNumber||'',notes:r.inventory?.notes||''})}
  const save=async()=>{setBusy(true);try{const r=await operationsApi.inventory.update(selected.id,form);setSelected(r.data);setRows(c=>c.map(x=>x.id===r.data.id?r.data:x))}catch(e){setError(e.message)}finally{setBusy(false)}}
  const stored=rows.filter(r=>r.storage?.status==='STORED').length
  return <PageContainer><PageHeader title="Inventory" description="Track every gated-in container, its condition, storage location, and release state." />{error&&<ErrorBox text={error}/>}<div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat icon={Package} label="Active Inventory" value={rows.length}/><Stat icon={Warehouse} label="In Storage" value={stored}/><Stat icon={Package} label="Waiting Storage" value={rows.filter(r=>r.storage?.status==='WAITING_STORAGE'||!r.storage?.status).length}/></div><OperationsTable rows={rows} search={search} onSearch={setSearch} onSelect={open} loading={loading} pagination={pagination} onPage={setPage} extraColumns={{header:<th className="px-5 py-3">Location</th>,cell:r=><td className="px-5 py-4"><div className="font-medium">{r.storage?.block?.name||'Yard / Unassigned'}</div><div className="text-xs text-muted-foreground">{r.storage?.bay?`B${r.storage.bay}-R${r.storage.row}-T${r.storage.tier}`:r.inventory?.status||'—'}</div></td>}}/>
  <OperationDrawer open={!!selected} title="Inventory Record" subtitle={selected?.containerNumber} onClose={()=>setSelected(null)} footer={can(MODULES.INVENTORY,ACTIONS.EDIT)?<Button className="w-full" disabled={busy} onClick={save}>{busy?'Saving...':'Save Inventory Details'}</Button>:null}>{selected&&<div className="space-y-7"><div className="flex items-center justify-between"><OperationStatus stage={selected.workflowStage}/><span className="text-xs text-muted-foreground">Received {formatDateTime(selected.inventory?.receivedAt)}</span></div><DetailGrid item={selected}/><section className="rounded-xl bg-muted/50 p-4"><h3 className="font-semibold">Storage</h3><p className="mt-2 text-sm">{selected.storage?.block?.name||'Not assigned to a storage block yet.'}</p>{selected.storage?.bay&&<p className="text-xs text-muted-foreground">Bay {selected.storage.bay} · Row {selected.storage.row} · Tier {selected.storage.tier}</p>}</section><div className="grid gap-4"><label className="text-sm font-semibold">Container Condition<div className="mt-2 grid grid-cols-2 gap-2">{['GOOD','DENTED','RUST','HOLE','DOOR DAMAGE','OTHER','DAMAGED','FOR_INSPECTION'].map(option=>{const active=form.condition.includes(option);return <button key={option} type="button" onClick={()=>{if(option==='GOOD') return setForm({...form,condition:active?[]:['GOOD']});const next=form.condition.filter(x=>x!=='GOOD');setForm({...form,condition:active?next.filter(x=>x!==option):[...next,option]})}} className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold ${active?'border-primary bg-primary/10 text-primary':'border-input bg-background'}`}>{active?'✓ ':''}{option}</button>})}</div></label><label className="text-sm font-semibold">Seal Number<Input className="mt-1" value={form.sealNumber} onChange={e=>setForm({...form,sealNumber:e.target.value})}/></label><label className="text-sm font-semibold">Inventory Notes<textarea className="mt-1 min-h-28 w-full rounded-xl border border-input bg-background p-3 text-sm" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div></div>}</OperationDrawer></PageContainer>
}
function Stat({icon:Icon,label,value}){return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19}/></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></div></div>}
function ErrorBox({text}){return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>}
export default InventoryPage
