import { useState } from 'react'
import { Link } from 'react-router-dom'
import OperationGuidance from '@/components/operations/OperationGuidance.jsx'
import OptionalChargesModal from '@/components/invoices/OptionalChargesModal.jsx'
import { CheckCircle2, ClipboardCheck, CreditCard, LogIn, ShieldAlert, XCircle } from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
import PageHeader from '@/components/layout/PageHeader.jsx'
import OperationDrawer from '@/components/operations/OperationDrawer.jsx'
import OperationsTable from '@/components/operations/OperationsTable.jsx'
import { formatMoney, OperationStatus } from '@/components/operations/OperationStatus.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'

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
  const [inspection, setInspection] = useState(blankInspection)
  const [remarks, setRemarks] = useState('')
  const [busy, setBusy] = useState(false)
  const [optionalInvoice, setOptionalInvoice] = useState(null)
  const [queue, setQueue] = useState('ALL')
  const { can } = useAuth()

  const openItem = (row) => {
    setSelected(row)
    setInspection(toInspectionForm(row))
    setRemarks(row.gateIn?.remarks || '')
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
      const changedCorrections = Object.fromEntries(Object.entries(inspection.corrections).filter(([key, value]) => String(selected?.[key] ?? '') !== String(value ?? '')))
      const payload = {
        status,
        sealNumber: inspection.sealNumber,
        sealIntact: inspection.sealIntact === 'YES',
        containerCondition: inspection.containerCondition,
        remarks: inspection.remarks,
        rejectionReason: status === 'REJECTED' ? inspection.rejectionReason : '',
        corrections: changedCorrections,
      }
      const r = await operationsApi.gateIn.inspect(selected.id, payload)
      setSelected(r.data)
      setInspection(toInspectionForm(r.data))
      setRows((current) => current.map((x) => x.id === r.data.id ? r.data : x))
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
      const payload = {remarks}
      const r = await operationsApi.gateIn.process(selected.id, payload)
      setRows((c) => c.filter((x) => x.id !== r.data.id))
      setSelected(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  const onBillingSaved = invoice => {
    const update = item => ({...item,gateInCharges:{...(item.gateInCharges||{}),total:invoice.total,charges:invoice.lines,paymentStatus:invoice.status,invoiceId:String(invoice._id)}});
    setRows(current=>current.map(row=>row.id===selected?.id?update(row):row));
    setSelected(current=>current?update(current):current);
  };
  const totalDue = selected?.gateInCharges?.total || 0
  const inspectionStatus = selected?.gateIn?.inspection?.status || 'PENDING'
  const inspectionAccepted = inspectionStatus === 'ACCEPTED'
  const inspectionRejected = inspectionStatus === 'REJECTED'
  const paymentDone = selected?.gateIn?.payment?.status === 'VERIFIED' || (totalDue===0&&selected?.gateIn?.payment?.status==='VERIFIED')
  const canComplete = inspectionAccepted && paymentDone
  const queueFor = row => {
    const paid = row.gateIn?.payment?.status === 'VERIFIED';
    const inspection = row.gateIn?.inspection?.status;
    if (inspection === 'REJECTED') return 'REJECTED';
    if (!paid) return 'PAYMENT';
    if (inspection !== 'ACCEPTED') return 'INSPECTION';
    return 'READY';
  };
  const visibleRows = queue === 'ALL' ? rows : rows.filter(row => queueFor(row) === queue);
  const queueChoices = [['ALL','All pending'],['PAYMENT','Payment not verified'],['INSPECTION','Awaiting inspection'],['READY','Ready for Gate-in'],['REJECTED','Inspection rejected']];

  return <PageContainer>
    <PageHeader title="Gate-in" description="Verify online payment, inspect the physical arrival, and explicitly confirm Gate-in." />
    <OperationGuidance current={0} steps={[{title:'Verify payment',note:'Review the client evidence in Invoices & Verification.'},{title:'Inspect actual arrival',note:'Accept or reject the container inspection.'},{title:'Confirm physical Gate-in',note:'Only after payment and inspection are accepted.'}]} link={can(MODULES.PAYMENT_HISTORY,ACTIONS.VIEW)?"/invoice-review":undefined} linkLabel="Open payment verification" note="No-Show is not supported by the current Gate-in API (it accepts only ACCEPTED and REJECTED inspections). No fake No-Show action is shown. Use the existing rejection flow only for actual inspection rejection." />
    {error && <ErrorBox text={error} />}
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Gate-in task queues">{queueChoices.map(([value,label])=><button type="button" key={value} aria-pressed={queue===value} onClick={()=>setQueue(value)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${queue===value?'border-primary bg-primary text-primary-foreground':'border-border bg-card text-foreground'}`}>{label} <span className="ml-1 opacity-75">{value==='ALL'?rows.length:rows.filter(row=>queueFor(row)===value).length}</span></button>)}</div>
    <p className="mb-3 text-xs text-muted-foreground">Queue counts and filters apply to the currently loaded page; use search and pagination to find more bookings.</p>
    <OperationsTable
      rows={visibleRows}
      search={search}
      onSearch={setSearch}
      onSelect={openItem} loading={loading} pagination={pagination} onPage={setPage}
      empty={queue === "ALL" ? "No containers are waiting for Gate-in." : "No matching Gate-in records on this page."}
      extraColumns={{
        header: <><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Inspection</th><th className="px-5 py-3">Gate-in Due</th></>,
        cell: (r) => <>
          <td className="px-5 py-4"><span className={`rounded-full px-2 py-1 text-xs font-bold ${r.gateIn?.payment?.status==='VERIFIED'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-800'}`}>{r.gateIn?.payment?.status || 'Pending'}</span></td>
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
        ? <Button className="w-full" title={!canComplete ? "Requires verified payment and accepted inspection" : "Confirm actual physical entry"} disabled={busy || !canComplete} onClick={process}><LogIn size={17} />{busy ? 'Processing...' : 'Confirm Physical Gate-in'}</Button>
        : null}
    >
      {selected && <div className="space-y-7">
        <div className="flex items-center justify-between gap-3">
          <OperationStatus stage={selected.workflowStage} />
          <InspectionBadge status={inspectionStatus} />
        </div>

        <section className="rounded-2xl border p-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">1. Verified Online Payment</h3><span className="font-bold">{formatMoney(totalDue)}</span></div>
          {selected.gateInCharges?.charges?.length>0&&<div className="mt-3 divide-y rounded-xl border px-3 text-xs">{selected.gateInCharges.charges.map((line,index)=><div key={`${line.description}-${index}`} className="flex justify-between gap-3 py-2"><span>{line.description} × {line.quantity}{line.isOptional?' (optional)':''}</span><b>{formatMoney(line.amount)}</b></div>)}</div>}
          {can(MODULES.GATE_IN,ACTIONS.PROCESS)&&selected.gateInCharges?.invoiceId&&selected.gateInCharges?.paymentStatus==='UNPAID'&&<Button type="button" variant="outline" className="mt-3 w-full" onClick={()=>setOptionalInvoice(selected.gateInCharges.invoiceId)}>Add Manual Transaction / Documentation Fee</Button>}
          <p className="mt-2 text-sm">Payment status: <strong className={paymentDone?'text-emerald-700':'text-amber-700'}>{selected.gateIn?.payment?.status||'PENDING'}</strong></p>
          {selected.gateIn?.payment?.referenceNumber&&<p className="mt-1 text-xs">Reference: {selected.gateIn.payment.referenceNumber} · Method: {selected.gateIn.payment.method}</p>}
          {can(MODULES.PAYMENT_HISTORY,ACTIONS.VIEW) ? <Link to="/invoice-review" className="mt-3 inline-flex rounded-lg border border-primary/30 px-3 py-2 text-xs font-bold text-primary">Review payments in Invoices & Verification</Link> : <p className="mt-3 text-xs text-muted-foreground">A staff member with payment-verification access must verify this payment.</p>}
          {!paymentDone&&<p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">The client must provide a transaction reference or payment proof. Verify the online payment under Invoices & Payment Verification before confirming Gate-in.</p>}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ClipboardCheck size={18} /></span>
            <div>
              <h3 className="font-semibold">2. Arrival Inspection & Booking Verification</h3>
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

          {inspectionRejected && <div className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><b>Physical Gate-in blocked.</b><div className="mt-1">{selected.gateIn?.inspection?.rejectionReason || 'This container must pass a new inspection before physical entry can be confirmed.'}</div></div></div>}
          {inspectionAccepted && <div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><div><b>Inspection accepted.</b><div className="mt-1">Inspection passed. Physical Gate-in still requires verified payment and an explicit Gate-in confirmation.</div></div></div>}

          {can(MODULES.GATE_IN, ACTIONS.PROCESS) && !selected.gateIn?.actualGateInAt && <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" disabled={busy || !paymentDone} title={!paymentDone?"Verify payment first":"Reject the actual inspection"} onClick={() => submitInspection('REJECTED')}><XCircle size={17} /> Reject Inspection</Button>
            <Button disabled={busy || !paymentDone} title={!paymentDone?"Verify payment first":"Accept the actual inspection"} onClick={() => submitInspection('ACCEPTED')}><CheckCircle2 size={17} /> Accept Inspection</Button>
          </div>}
        </section>

        <section className={`rounded-2xl border p-4 ${canComplete ? 'border-border' : 'border-slate-200 bg-slate-50/70'}`}>
          <h3 className="font-semibold">3. Complete Gate-in (separate physical action)</h3>
          <p className="mt-1 text-xs text-muted-foreground">Records the actual entry timestamp and adds the container to Inventory. Online payment must already be verified.</p>
          <textarea className="mt-4 min-h-24 w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="Gate-in remarks (optional)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </section>
      </div>}
    </OperationDrawer>
    {optionalInvoice&&<OptionalChargesModal invoiceId={optionalInvoice} onClose={()=>setOptionalInvoice(null)} onSaved={onBillingSaved}/> }
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
