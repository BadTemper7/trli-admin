import { useState } from 'react'
import { CheckCircle2, ClipboardList } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { DetailGrid, WorkflowMini } from '@/components/operations/OperationDetails.jsx'
import { OperationStatus } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { operationsApi } from '@/lib/operationsApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'
import { usePagedOperationsList } from '@/hooks/usePagedOperationsList.js'

const PRE_ADVICE_EVENTS = ['pre-advice:new', 'operations:pre-advice-updated', 'pre-advice:cancelled']

function PreAdvicePage() {
  const { rows, setRows, search, setSearch, setPage, pagination, loading, error, setError, load } = usePagedOperationsList(operationsApi.preAdvice.list, PRE_ADVICE_EVENTS)
  const [selected, setSelected] = useState(null), [busy, setBusy] = useState(false)
  const { can } = useAuth()
  const open = async (row) => { try { const response = await operationsApi.preAdvice.get(row.id); setSelected(response.data) } catch (e) { setError(e.message) } }
  const approve = async () => { if (!selected) return; setBusy(true); try { const response = await operationsApi.preAdvice.approve(selected.id); setSelected(response.data); setRows((current) => current.map((r) => r.id === response.data.id ? response.data : r)) } catch (e) { setError(e.message) } finally { setBusy(false) } }
  const submitted = rows.filter((r) => r.workflowStage === 'BOOKING_SUBMITTED').length
  const ready = rows.filter((r) => r.workflowStage === 'READY_FOR_GATE_IN').length
  return <PageContainer>
    <PageHeader title="Pre-advice" description="Review client bookings and move approved containers into the Gate-in queue." />
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><Stat icon={ClipboardList} label="Total Bookings" value={pagination.total} /><Stat icon={ClipboardList} label="Awaiting Review" value={submitted} /><Stat icon={CheckCircle2} label="Ready for Gate-in" value={ready} /></div>
    <OperationsTable rows={rows} search={search} onSearch={setSearch} onSelect={open} empty="No Pre-advice records yet." loading={loading} pagination={pagination} onPage={setPage} />
    <OperationDrawer open={!!selected} title={selected?.bookingReference} subtitle={selected?.containerNumber} onClose={() => setSelected(null)} footer={selected?.workflowStage === 'BOOKING_SUBMITTED' && can(MODULES.PRE_ADVICE, ACTIONS.EDIT) ? <Button className="w-full" disabled={busy} onClick={approve}>{busy ? 'Approving...' : 'Approve Booking & Send to Gate-in'}</Button> : null}>
      {selected && <div className="space-y-7"><div className="flex items-center justify-between"><OperationStatus stage={selected.workflowStage} /><span className="text-xs text-muted-foreground">{selected.company?.companyName}</span></div><DetailGrid item={selected} /><section><h3 className="mb-3 font-semibold">Recent workflow</h3><WorkflowMini history={selected.workflowHistory} /></section>{selected.charges && <section className="rounded-xl bg-muted/60 p-4"><h3 className="font-semibold">Expected Charges</h3><p className="mt-2 text-sm text-muted-foreground">Gate-in: ₱{Number(selected.charges.gateIn?.total || 0).toLocaleString()} · Gate-out: ₱{Number(selected.charges.gateOut?.total || 0).toLocaleString()}</p></section>}</div>}
    </OperationDrawer>
  </PageContainer>
}
function Stat({ icon: Icon, label, value }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={19} /></span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></div></div> }
export default PreAdvicePage
