import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Download, Loader2, PackageCheck, X } from 'lucide-react'
import OperationGuidance from '@/components/operations/OperationGuidance.jsx'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { DetailGrid } from '@/components/operations/OperationDetails.jsx'
import { OperationStatus } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { operationsApi } from '@/lib/operationsApi.js'
import { openAdminFile } from '@/lib/adminFiles.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'
import { usePagedOperationsList } from '@/hooks/usePagedOperationsList.js'

const RELEASE_EVENTS = ['release:queue-updated', 'release:completed']

export default function ReleaseContainerPage() {
  const { rows, setRows, search, setSearch, setPage, pagination, loading, error, setError, load } = usePagedOperationsList(operationsApi.release.list, RELEASE_EVENTS)
  const [selected, setSelected] = useState(null)
  const [remarks, setRemarks] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmError, setConfirmError] = useState('')
  const [busy, setBusy] = useState(false)
  const { can } = useAuth()
  const permitted = can(MODULES.RELEASE_CONTAINER, ACTIONS.PROCESS)

  const choose = item => {
    setSelected(item)
    setRemarks('')
    setConfirmError('')
    setConfirmOpen(false)
  }

  const closeDrawer = () => {
    if (busy) return
    setSelected(null)
    setConfirmOpen(false)
    setConfirmError('')
  }

  const release = async () => {
    if (!selected || !permitted || busy || !confirmOpen) return
    setBusy(true)
    setConfirmError('')
    try {
      const result = await operationsApi.release.process(selected.id, { remarks })
      setRows(current => current.filter(item => item.id !== result.data.id))
      setConfirmOpen(false)
      setSelected(null)
      setRemarks('')
      await load()
    } catch (err) {
      setConfirmError(err.message || 'Container release could not be confirmed.')
      setError(err.message || 'Container release could not be confirmed.')
    } finally {
      setBusy(false)
    }
  }

  return <PageContainer>
    <PageHeader title="Release Container" description="Final release checkpoint for containers with approved Gate-out."/>
    <OperationGuidance current={2} steps={[
      { title: 'Payment verified', note: 'Admin approves payment and Gate-out.' },
      { title: 'Ready for physical exit', note: 'Container waits in the release queue.' },
      { title: 'Confirm physical release', note: 'Confirm only after the truck has exited the terminal.' },
    ]} note="This action records the actual Gate-out time and frees the storage slot. Do not confirm for a container still inside the yard."/>
    {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <OperationsTable deleteModule={MODULES.RELEASE_CONTAINER} onDeleted={load} rows={rows} search={search}
      onSearch={setSearch} onSelect={choose} loading={loading} pagination={pagination} onPage={setPage}
      empty="No containers are ready for release."/>
    <OperationDrawer open={!!selected} title="Release Container" subtitle={selected?.containerNumber} onClose={closeDrawer}
      footer={permitted ? <Button type="button" className="w-full" disabled={busy} onClick={() => { setConfirmError(''); setConfirmOpen(true) }}>
        <PackageCheck size={17}/> Confirm Container Released
      </Button> : null}>
      {selected && <div className="space-y-7">
        <div className="flex items-center justify-between gap-3">
          <OperationStatus stage={selected.workflowStage}/>
          <span className="text-xs text-muted-foreground">{selected.company?.companyName}</span>
        </div>
        <DetailGrid item={selected}/>
        <section className="rounded-xl border p-4">
          <h3 className="text-sm font-bold">Approved release documents</h3>
          <p className="mt-1 text-xs text-muted-foreground">Print the authorized Gate-out Pass and linked Service Invoice. Confirm release only after the container exits.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => openAdminFile(`/admin/operations/release/${selected.id}/pass`, true).catch(err => setError(err.message))}>
              <Download size={15}/> Download Gate-out Pass
            </Button>
            <Button type="button" variant="outline" onClick={() => openAdminFile(`/admin/operations/release/${selected.id}/invoice`, true).catch(err => setError(err.message))}>
              <Download size={15}/> Download Service Invoice
            </Button>
          </div>
        </section>
        <section className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <strong>Final checkpoint.</strong> Confirm only after the container has physically exited the terminal.
          This closes the booking and releases its storage position.
        </section>
        <label className="block space-y-2 text-sm font-semibold">
          <span>Release remarks <span className="font-normal text-muted-foreground">(optional)</span></span>
          <textarea className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm font-normal"
            maxLength={500} placeholder="Additional notes regarding the physical release" value={remarks}
            onChange={event => setRemarks(event.target.value)}/>
        </label>
      </div>}
    </OperationDrawer>

    <Dialog.Root open={confirmOpen && !!selected} onOpenChange={value => { if (!busy) setConfirmOpen(value) }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-slate-950/65 backdrop-blur-[2px]"/>
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[111] max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl outline-none sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><AlertTriangle size={22}/></span>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-extrabold text-foreground">Confirm physical container release?</Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
                Please verify that the container has physically exited the terminal. This action records its release time and frees its storage position.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild><button type="button" disabled={busy} aria-label="Close confirmation" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"><X size={18}/></button></Dialog.Close>
          </div>
          {selected && <div className="my-5 space-y-2 rounded-xl border border-border bg-muted/40 p-4 text-sm">
            <p><span className="text-muted-foreground">Container:</span> <strong>{selected.containerNumber}</strong></p>
            <p><span className="text-muted-foreground">Booking:</span> <strong>{selected.bookingReference}</strong></p>
            <p><span className="text-muted-foreground">Client:</span> <strong>{selected.company?.companyName || 'Not specified'}</strong></p>
            {selected.gateOut?.conditionUponRelease?.length > 0 && <p><span className="text-muted-foreground">Condition upon release:</span> <strong>{selected.gateOut.conditionUponRelease.join(', ')}</strong></p>}
            {remarks.trim() && <div className="break-words"><span className="text-muted-foreground">Optional remarks:</span><p className="mt-1">{remarks.trim()}</p></div>}
          </div>}
          <p className="text-sm font-semibold text-amber-800">Only proceed after confirming the truck and container have left the yard.</p>
          {confirmError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{confirmError}</p>}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Dialog.Close asChild><Button type="button" variant="outline" disabled={busy}>Cancel</Button></Dialog.Close>
            <Button type="button" disabled={busy || !permitted} onClick={release} className="bg-emerald-700 hover:bg-emerald-800">
              {busy ? <Loader2 className="size-4 animate-spin"/> : <PackageCheck size={17}/>} {busy ? 'Releasing container...' : 'Yes, Release Container'}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </PageContainer>
}
