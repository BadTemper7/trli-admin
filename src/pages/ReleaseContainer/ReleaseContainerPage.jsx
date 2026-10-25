import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { DetailGrid } from '@/components/operations/OperationDetails.jsx'
import { OperationStatus } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { operationsApi } from '@/lib/operationsApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'
import { usePagedOperationsList } from '@/hooks/usePagedOperationsList.js'

const RELEASE_EVENTS = ['release:queue-updated', 'release:completed']

function ReleaseContainerPage(){
  const { rows, setRows, search, setSearch, setPage, pagination, loading, error, setError } = usePagedOperationsList(operationsApi.release.list, RELEASE_EVENTS)
  const [selected,setSelected]=useState(null),[remarks,setRemarks]=useState(''),[busy,setBusy]=useState(false)
  const {can}=useAuth()
  const release=async()=>{setBusy(true);try{const r=await operationsApi.release.process(selected.id,{remarks});setRows(c=>c.filter(x=>x.id!==r.data.id));setSelected(null)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <PageContainer><PageHeader title="Release Container" description="Final release checkpoint for containers with approved Gate-out." />{error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<OperationsTable rows={rows} search={search} onSearch={setSearch} onSelect={r=>{setSelected(r);setRemarks('')}} loading={loading} pagination={pagination} onPage={setPage} empty="No containers are ready for release."/><OperationDrawer open={!!selected} title="Release Container" subtitle={selected?.containerNumber} onClose={()=>setSelected(null)} footer={can(MODULES.RELEASE_CONTAINER,ACTIONS.PROCESS)?<Button className="w-full" disabled={busy} onClick={release}><PackageCheck size={17}/>{busy?'Releasing...':'Confirm Container Released'}</Button>:null}>{selected&&<div className="space-y-7"><div className="flex items-center justify-between"><OperationStatus stage={selected.workflowStage}/><span className="text-xs text-muted-foreground">{selected.company?.companyName}</span></div><DetailGrid item={selected}/><section className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><b>Final checkpoint.</b> Confirm only after the container has physically exited the terminal. This closes the booking and releases its storage position.</section><textarea className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="Release remarks (optional)" value={remarks} onChange={e=>setRemarks(e.target.value)}/></div>}</OperationDrawer></PageContainer>
}
export default ReleaseContainerPage
