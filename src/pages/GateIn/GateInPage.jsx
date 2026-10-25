import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, CreditCard, LogIn, ShieldAlert, XCircle } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { formatMoney, OperationStatus } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import PaymentMethodSelect from '@/components/operations/PaymentMethodSelect.jsx'
import { operationsApi } from '@/lib/operationsApi.js'
import { useAuth } from '@/context/AuthContext.jsx'
import { MODULES, ACTIONS } from '@/constants/permissions.js'
import { usePagedOperationsList } from '@/hooks/usePagedOperationsList.js'

const conditionOptions = ['GOOD', 'DENTED', 'RUST', 'HOLE', 'DOOR DAMAGE', 'OTHER']
const containerTypes = ['DRY CONTAINER', 'REEFER', 'TANK CONTAINER', 'OPEN TOP', 'FLAT RACK']

const blankInspection = {
  sealNumber: '', sealIntact: '', containerCondition: [], remarks: '', rejectionReason: '',
  corrections: {},
}

function toInspectionForm(item) {
  const inspection = item?.gateIn?.inspection || {}
  return {
    sealNumber: inspection.sealNumber || '',
    sealIntact: inspection.sealIntact === true ? 'YES' : inspection.sealIntact === false ? 'NO' : '',
    containerCondition: Array.isArray(inspection.containerCondition) ? inspection.containerCondition : inspection.containerCondition ? [inspection.containerCondition] : [],
    remarks: inspection.remarks || '',
    rejectionReason: inspection.rejectionReason || '',
    corrections: {
      containerNumber: item?.containerNumber || '',
      containerSize: item?.containerSize || '',
      containerType: item?.containerType || '',
      loadStatus: item?.loadStatus || '',
      transactionClassification: item?.transactionClassification || '',
      shippingLine: item?.shippingLine || '',
      truckPlateNumber: item?.truckPlateNumber || '',
      driverName: item?.driverName || '',
      driverLicenceNumber: item?.driverLicenceNumber || '',
      hauler: item?.hauler || '',
      weight: item?.weight ?? '',
    },
  }
}

const GATE_IN_EVENTS = ['gate-in:queue-updated', 'gate-in:inspection-updated', 'gate-in:updated', 'gate-in:completed']

function GateInPage() {
  const { rows, setRows, search, setSearch, setPage, pagination, loading, error, setError, load } = usePagedOperationsList(operationsApi.gateIn.list, GATE_IN_EVENTS)
  const [selected, setSelected] = useState(null)
  const [payment, setPayment] = useState({ referenceNumber: '', method: '', amountSubmitted: '' })
  const [inspection, setInspection] = useState(blankInspection)
  const [remarks, setRemarks] = useState('')
  const [cancelPaymentReason, setCancelPaymentReason] = useState('')
  const [busy, setBusy] = useState(false)
  const { can } = useAuth()

  const openItem = (row) => {
    setSelected(row)
    setInspection(toInspectionForm(row))
    setPayment({ referenceNumber: '', method: '', amountSubmitted: String(row.gateInCharges?.total || '') })
    setRemarks(row.gateIn?.remarks || '')
    setCancelPaymentReason('')
    setError('')
  }

  const setCorrection = (key, value) => setInspection((current) => ({
    ...current,
    corrections: { ...current.corrections, [key]: value },
  }))

  const submitInspection = async (status) => {
    setBusy(true)
    setError('')
    try {
      const payload = {
        status,
        sealNumber: inspection.sealNumber,
        sealIntact: inspection.sealIntact === 'YES',
        containerCondition: inspection.containerCondition,
        remarks: inspection.remarks,
        rejectionReason: status === 'REJECTED' ? inspection.rejectionReason : '',
        corrections: inspection.corrections,
      }
      const r = await operationsApi.gateIn.inspect(selected.id, payload)
      setSelected(r.data)
      setInspection(toInspectionForm(r.data))
      setPayment((current) => ({ ...current, amountSubmitted: String(r.data.gateInCharges?.total || '') }))
      setRows((current) => current.map((x) => x.id === r.data.id ? r.data : x))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const cancelPayment = async () => {
    setBusy(true)
    setError('')
    try {
      const r = await operationsApi.gateIn.cancelPayment(selected.id, { reason: cancelPaymentReason })
      setSelected(r.data)
      setRows((current) => current.map((x) => x.id === r.data.id ? r.data : x))
      setPayment({ referenceNumber: '', method: '', amountSubmitted: String(r.data.gateInCharges?.total || '') })
      setCancelPaymentReason('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const process = async () => {
    setBusy(true)
    setError('')
    try {
      const total = selected.gateInCharges?.total || 0
      const payload = { remarks }
      if (total > 0 && !selected.gateIn?.payment?.submittedAt) {
        payload.payment = { ...payment, amountSubmitted: payment.amountSubmitted || total }
      }
      const r = await operationsApi.gateIn.process(selected.id, payload)
      setRows((c) => c.filter((x) => x.id !== r.data.id))
      setSelected(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const totalDue = selected?.gateInCharges?.total || 0
  const inspectionStatus = selected?.gateIn?.inspection?.status || 'PENDING'
  const inspectionAccepted = inspectionStatus === 'ACCEPTED'
  const inspectionRejected = inspectionStatus === 'REJECTED'
  const paymentDone = Boolean(selected?.gateIn?.payment?.submittedAt) || totalDue === 0
  const paymentReady = paymentDone || (totalDue > 0 && Boolean(payment.method) && Number(payment.amountSubmitted || totalDue) >= totalDue)
  const canComplete = inspectionAccepted && paymentReady

  return <PageContainer>
    <PageHeader title="Gate-in" description="Inspect arriving containers first, then collect applicable charges and process accepted containers into inventory." />
    {error && <ErrorBox text={error} />}
    <OperationsTable
      rows={rows}
      search={search}
      onSearch={setSearch}
      onSelect={openItem} loading={loading} pagination={pagination} onPage={setPage}
      empty="No containers are waiting for Gate-in."
      extraColumns={{
        header: <><th className="px-5 py-3">Inspection</th><th className="px-5 py-3">Gate-in Due</th></>,
        cell: (r) => <>
          <td className="px-5 py-4"><InspectionBadge status={r.gateIn?.inspection?.status} /></td>
          <td className="px-5 py-4 font-semibold">{formatMoney(r.gateInCharges?.total)}</td>
        </>,
      }}
    />

    <OperationDrawer
      open={!!selected}
      title="Gate-in Processing"
      subtitle={selected?.bookingReference}
      onClose={() => setSelected(null)}
      footer={can(MODULES.GATE_IN, ACTIONS.PROCESS)
        ? <Button className="w-full" disabled={busy || !canComplete} onClick={process}><LogIn size={17} />{busy ? 'Processing...' : (!paymentDone && totalDue > 0 ? 'Submit Payment & Complete Gate-in' : 'Complete Gate-in')}</Button>
        : null}
    >
      {selected && <div className="space-y-7">
        <div className="flex items-center justify-between gap-3">
          <OperationStatus stage={selected.workflowStage} />
          <InspectionBadge status={inspectionStatus} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck size={18} /></span>
            <div>
              <h3 className="font-semibold">1. Container Inspection & Booking Verification</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Verify the physical container against the booking. Correct any inaccurate booking details before accepting the inspection.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Container Number"><Input value={inspection.corrections.containerNumber || ''} onChange={(e) => setCorrection('containerNumber', e.target.value)} /></Field>
            <Field label="Container Size"><NativeSelect value={inspection.corrections.containerSize || ''} onChange={(v) => setCorrection('containerSize', v)} options={['20FT', '40FT']} /></Field>
            <Field label="Container Type"><NativeSelect value={inspection.corrections.containerType || ''} onChange={(v) => setCorrection('containerType', v)} options={containerTypes} /></Field>
            <Field label="Load Status"><NativeSelect value={inspection.corrections.loadStatus || ''} onChange={(v) => setCorrection('loadStatus', v)} options={['EMPTY', 'LOADED']} /></Field>
            <Field label="Classification"><NativeSelect value={inspection.corrections.transactionClassification || ''} onChange={(v) => setCorrection('transactionClassification', v)} options={['LOCAL', 'INTERNATIONAL']} /></Field>
            <Field label="Shipping Line"><Input value={inspection.corrections.shippingLine || ''} onChange={(e) => setCorrection('shippingLine', e.target.value)} /></Field>
            <Field label="Truck Plate"><Input value={inspection.corrections.truckPlateNumber || ''} onChange={(e) => setCorrection('truckPlateNumber', e.target.value)} /></Field>
            <Field label="Driver"><Input value={inspection.corrections.driverName || ''} onChange={(e) => setCorrection('driverName', e.target.value)} /></Field>
            <Field label="Driver Licence"><Input value={inspection.corrections.driverLicenceNumber || ''} onChange={(e) => setCorrection('driverLicenceNumber', e.target.value)} /></Field>
            <Field label="Hauler"><Input value={inspection.corrections.hauler || ''} onChange={(e) => setCorrection('hauler', e.target.value)} /></Field>
            <Field label="Weight"><Input type="number" min="0" value={inspection.corrections.weight ?? ''} onChange={(e) => setCorrection('weight', e.target.value)} /></Field>
          </div>

          <div className="my-5 border-t border-border" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Seal # *"><Input value={inspection.sealNumber} onChange={(e) => setInspection({ ...inspection, sealNumber: e.target.value })} placeholder="Enter seal number" /></Field>
            <Field label="Seal Intact *"><NativeSelect value={inspection.sealIntact} onChange={(v) => setInspection({ ...inspection, sealIntact: v })} options={['YES', 'NO']} placeholder="Select" /></Field>
            <Field label="Container Condition *" className="sm:col-span-2"><ConditionMultiSelect value={inspection.containerCondition} onChange={(containerCondition) => setInspection({ ...inspection, containerCondition })} /></Field>
          </div>
          <Field label="Inspection Remarks" className="mt-4"><textarea className="min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={inspection.remarks} onChange={(e) => setInspection({ ...inspection, remarks: e.target.value })} placeholder="Inspection findings, visible damage, seal observations, corrections made..." /></Field>
          <Field label="Rejection Reason" className="mt-4"><textarea className={`min-h-20 w-full rounded-xl border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 ${inspectionRejected ? 'border-red-300' : 'border-input'}`} value={inspection.rejectionReason} onChange={(e) => setInspection({ ...inspection, rejectionReason: e.target.value })} placeholder="Required when rejecting the container" /></Field>

          {inspectionRejected && <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><b>Payment blocked.</b><div className="mt-1">{selected.gateIn?.inspection?.rejectionReason || 'This container must pass a new inspection before payment can be accepted.'}</div></div></div>}
          {inspectionAccepted && <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><b>Inspection accepted.</b><div className="mt-1">Gate-in payment can now be recorded.</div></div></div>}

          {can(MODULES.GATE_IN, ACTIONS.PROCESS) && !selected.gateIn?.payment?.submittedAt && <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={busy} onClick={() => submitInspection('REJECTED')}><XCircle size={17} /> Reject Inspection</Button>
            <Button disabled={busy} onClick={() => submitInspection('ACCEPTED')}><CheckCircle2 size={17} /> Accept Inspection</Button>
          </div>}
        </section>

        <section className={`rounded-2xl border p-4 ${inspectionAccepted ? 'border-border' : 'border-slate-200 bg-slate-50/70 opacity-75'}`}>
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CreditCard size={18} className="text-primary" /><h3 className="font-semibold">2. Gate-in Payment</h3></div><span className="font-bold">{formatMoney(totalDue)}</span></div>
          {!inspectionAccepted && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-800">Payment is available only after the container inspection is accepted.</p>}
          {inspectionAccepted && <>
            <div className="mt-3 space-y-2 text-sm">{selected.gateInCharges?.charges?.length ? selected.gateInCharges.charges.map((c) => <div key={c.id} className="flex justify-between"><span>{c.name}</span><b>{formatMoney(c.amount)}</b></div>) : <p className="text-muted-foreground">No Gate-in charges configured for this transaction.</p>}</div>
            {totalDue > 0 && !selected.gateIn?.payment?.submittedAt && can(MODULES.GATE_IN, ACTIONS.PROCESS) && <div className="mt-4 grid gap-3"><Input placeholder="Payment reference" value={payment.referenceNumber} onChange={(e) => setPayment({ ...payment, referenceNumber: e.target.value })} /><div className="grid grid-cols-2 gap-3"><PaymentMethodSelect value={payment.method} onChange={(method) => setPayment({ ...payment, method })} /><Input type="number" placeholder="Amount" value={payment.amountSubmitted} onChange={(e) => setPayment({ ...payment, amountSubmitted: e.target.value })} /></div><p className="rounded-lg bg-primary/5 p-3 text-xs font-medium text-primary">Payment will be submitted together with the final Gate-in action. No separate payment submission is required.</p></div>}
            {selected.gateIn?.payment?.submittedAt && <div className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><div className="text-sm font-semibold text-emerald-800">Payment submitted and confirmed</div><div className="grid gap-1 text-xs text-emerald-700 sm:grid-cols-2"><span>Method: <b>{selected.gateIn.payment.method || '-'}</b></span><span>Reference: <b>{selected.gateIn.payment.referenceNumber || 'No reference'}</b></span><span>Amount: <b>{formatMoney(selected.gateIn.payment.amountSubmitted)}</b></span></div>{can(MODULES.GATE_IN, ACTIONS.PROCESS) && <div className="grid gap-2"><Input placeholder="Reason for cancelling payment (optional)" value={cancelPaymentReason} onChange={(e) => setCancelPaymentReason(e.target.value)} /><Button type="button" variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={busy} onClick={cancelPayment}><XCircle size={16} />Cancel Payment</Button></div>}</div>}
          </>}
        </section>

        <section className={`rounded-2xl border p-4 ${canComplete ? 'border-border' : 'border-slate-200 bg-slate-50/70'}`}>
          <h3 className="font-semibold">3. Complete Gate-in</h3>
          <p className="mt-1 text-xs text-muted-foreground">Final Gate-in submission records any entered payment details and moves the accepted container into Inventory.</p>
          <textarea className="mt-4 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Gate-in remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </section>
      </div>}
    </OperationDrawer>
  </PageContainer>
}

function Field({ label, className = '', children }) {
  return <label className={`block space-y-1.5 ${className}`}><span className="text-xs font-semibold text-foreground">{label}</span>{children}</label>
}

function NativeSelect({ value, onChange, options, placeholder = 'Select' }) {
  return <select className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" value={value} onChange={(e) => onChange(e.target.value)}><option value="">{placeholder}</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
}

function ConditionMultiSelect({ value = [], onChange }) {
  const selected = Array.isArray(value) ? value : value ? [value] : []
  const toggle = (option) => {
    if (option === 'GOOD') return onChange(selected.includes('GOOD') ? [] : ['GOOD'])
    const withoutGood = selected.filter((item) => item !== 'GOOD')
    onChange(withoutGood.includes(option) ? withoutGood.filter((item) => item !== option) : [...withoutGood, option])
  }
  return <div className="grid gap-2 sm:grid-cols-3">{conditionOptions.map((option) => {
    const active = selected.includes(option)
    return <button key={option} type="button" onClick={() => toggle(option)} className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${active ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-foreground hover:bg-muted/60'}`}>
      <span className={`grid h-4 w-4 place-items-center rounded border ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>{active ? '✓' : ''}</span>
      {option}
    </button>
  })}</div>
}

function InspectionBadge({ status = 'PENDING' }) {
  const value = status || 'PENDING'
  const style = value === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : value === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${style}`}>{value === 'PENDING' ? 'PENDING INSPECTION' : value}</span>
}

function ErrorBox({ text }) {
  return <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{text}</div>
}

export default GateInPage
