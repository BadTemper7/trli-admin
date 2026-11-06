import {useEffect,useState} from 'react';
import OperationGuidance from '@/components/operations/OperationGuidance.jsx';
import { MODULES } from '@/constants/permissions.js';
import {Download} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer.jsx';
import PageHeader from '@/components/layout/PageHeader.jsx';
import OperationDrawer from '@/components/operations/OperationDrawer.jsx';
import OperationsTable from '@/components/operations/OperationsTable.jsx';
import {DetailGrid} from '@/components/operations/OperationDetails.jsx';
import {Button} from '@/components/ui/button.jsx';
import {operationsApi} from '@/lib/operationsApi.js';
import {adminRequest} from '@/lib/adminApi.js';
import {openAdminFile} from '@/lib/adminFiles.js';
import {usePagedOperationsList} from '@/hooks/usePagedOperationsList.js';

const peso=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(n||0));
const EVENTS=['gate-out:updated','gate-out:approved','notification:new'];
const RELEASE_CONDITIONS=['GOOD','DENTED','RUST','HOLE','DOOR DAMAGE','OTHER'];
export default function GateOutPage(){
 const {rows,search,setSearch,setPage,pagination,loading,error,setError,load}=usePagedOperationsList(operationsApi.gateOut.list,EVENTS);
 const [selected,setSelected]=useState(null),[details,setDetails]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false);
 const [conditionUponRelease,setConditionUponRelease]=useState([]),[conditionRemarks,setConditionRemarks]=useState('');
 const [approvedDownloadId,setApprovedDownloadId]=useState(null);
 useEffect(()=>{setDetails(null);if(!selected)return;let alive=true;adminRequest(`/admin/gate-out-review/${selected.id}`).then(r=>{if(alive)setDetails(r.data)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[selected,setError]);
 const openItem=row=>{setSelected(row);setReason('');setConditionUponRelease([]);setConditionRemarks('');setError('')};
 const toggleCondition=value=>setConditionUponRelease(current=>{
  if(value==='GOOD')return current.includes('GOOD')?[]:['GOOD'];
  const withoutGood=current.filter(item=>item!=='GOOD');
  return withoutGood.includes(value)?withoutGood.filter(item=>item!==value):[...withoutGood,value];
 });
 const review=async decision=>{
  if(decision==='REJECT'&&!reason.trim()){setError('A rejection reason is required.');return;}
  if(decision==='APPROVE'&&!conditionUponRelease.length){setError('Select Condition Upon Release before verifying payment and approving Gate-out.');return;}
  setBusy(true);setError('');
  try{await adminRequest(`/admin/gate-out-review/${selected.id}/review`,{method:'POST',body:JSON.stringify(decision==='APPROVE'?{decision,conditionUponRelease,remarks:conditionRemarks}:{decision,reason})});if(decision==='APPROVE')setApprovedDownloadId(selected.id);setSelected(null);setReason('');setConditionUponRelease([]);setConditionRemarks('');await load();}
  catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const payment=details?.payments?.find(p=>p.status==='PENDING_VERIFICATION');
 return <PageContainer><PageHeader title="Gate-out" description="Verify submitted online payment evidence and approve or reject the Gate-out request in one action."/>
 <OperationGuidance steps={[{title:"Review request and payment",note:"Check invoice, transfer reference or proof."},{title:"Approve or reject",note:"Verification and Gate-out approval happen together."},{title:"Physical release",note:"A separate staff action in Release Container."}]} current={0} link="/release-container" linkLabel="Open Release Container" note="Gate-out approval never records actual physical release. Rejected payments remain available for the client to correct through My Bookings."/>
 {error&&<p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
 {approvedDownloadId&&<section className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Gate-out approved.</strong><p className="mb-2 mt-1">The approved Gate-out Pass is now printable. Physical release is still a separate action.</p><Button type="button" variant="outline" onClick={()=>openAdminFile(`/admin/operations/gate-out/${approvedDownloadId}/pass`,true).catch(e=>setError(e.message))}><Download size={15}/> Download Approved Gate-out Pass</Button></section>}
 <OperationsTable deleteModule={MODULES.GATE_OUT} onDeleted={load} rows={rows} search={search} onSearch={setSearch} onSelect={openItem} loading={loading} pagination={pagination} onPage={setPage} empty="No pending Gate-out requests."/>
 <OperationDrawer open={!!selected} title="Combined Gate-out Approval" subtitle={selected?.bookingReference} onClose={()=>setSelected(null)}>
 {selected&&<div className="space-y-5"><DetailGrid item={selected}/>
  <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><h3 className="font-bold">Printable Gate-out documents</h3><p className="mt-1 text-xs text-muted-foreground">The Gate-out Pass is only issued after final approval. No draft document is available.</p><div className="mt-3 flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!details?.booking?.gateOut?.approvedAt && !selected?.gateOut?.approvedAt} onClick={()=>openAdminFile(`/admin/operations/gate-out/${selected.id}/pass`,true).catch(e=>setError(e.message))}><Download size={15}/> Download Approved Gate-out Pass</Button><Button type="button" variant="outline" disabled={!details?.invoice} onClick={()=>openAdminFile(`/admin/operations/gate-out/${selected.id}/invoice`,true).catch(e=>setError(e.message))}><Download size={15}/> Download Service Invoice</Button></div></section>
  <section className="rounded-xl border p-4 text-sm"><h3 className="font-bold">Existing Booking & Transport Details (read-only)</h3><p className="mt-2">Container: {selected.containerNumber} ({selected.containerSize} · {selected.containerType})</p><p>Truck: {details?.booking?.truckPlateNumber||selected.truckPlateNumber} · Driver: {details?.booking?.driverName||selected.driverName}</p><p>Driver licence: {details?.booking?.driverLicenceNumber||selected.driverLicenceNumber}</p><p>Gate-out scheduled: {selected.gateOut?.scheduledDate} {selected.gateOut?.scheduledTime}</p></section>
  {!details?<p>Loading invoice and payment evidence...</p>:<section className="rounded-xl border p-4 text-sm"><h3 className="font-bold">Invoice and Payment Verification</h3>
   <p className="mt-2"><b>Invoice:</b> {details.invoice?.number||'Not generated'} · <b>Amount due:</b> {details.invoice ? peso(details.invoice.total) : 'Unavailable'}</p>
   {!details.invoice?.lines?.length && <p role="alert" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">No Gate-out transaction lines are attached to this invoice. Check the booking's matching Gate-out rates and have the client request an updated quotation. Do not approve an unpriced payment.</p>}
   {details.invoice?.lines?.map((line,i)=><div key={i} className="flex justify-between border-b py-2"><span>{line.description} × {line.quantity}</span><span>{peso(line.amount)}</span></div>)}
   <div className="mt-2 text-right"><p>{details.invoice?.vatInclusive ? 'Subtotal (VAT included)' : 'Subtotal (before VAT)'}: {peso(details.invoice?.subtotal)}</p><p>VAT ({details.invoice?.vatRate}%): {peso(details.invoice?.vat)}</p><strong>Total: {peso(details.invoice?.total)}</strong></div>
   {details.payments?.map(p=><div key={p._id} className="mt-3 rounded-lg bg-muted p-3"><p><strong>Method:</strong> {p.method} · <strong>Reference:</strong> {p.reference||'Not supplied (proof uploaded)'}</p><p>Amount submitted: {peso(p.amount)} · {p.status}</p>{p.receivingAccount?.accountNumber&&<p className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-xs"><strong>Receiving account:</strong> {p.receivingAccount.bankName} · {p.receivingAccount.accountName} · {p.receivingAccount.accountNumber}</p>}{p.proof?.storedName?<button className="mt-2 text-blue-700 underline" type="button" onClick={()=>openAdminFile(`/admin/gate-out-review/payments/${p._id}/proof`).catch(e=>setError(e.message))}>View payment proof</button>:<p className="mt-2 text-xs text-muted-foreground">No attachment — verify against receiving account records using the reference.</p>}</div>)}
  </section>}
  <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm" aria-label="Gate-out release condition inspection">
   <h3 className="font-bold">Condition Upon Release <span className="text-red-600" aria-hidden="true">*</span></h3>
   <p className="mt-1 text-xs text-muted-foreground">Required before approval. Choose Good or one or more damage conditions. Your selection will appear on the approved Gate-out Pass.</p>
   <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Condition Upon Release (required)">
    {RELEASE_CONDITIONS.map(option=><button key={option} type="button" aria-pressed={conditionUponRelease.includes(option)} disabled={busy} onClick={()=>toggleCondition(option)} className={`min-h-11 rounded-lg border px-3 py-2 text-left text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${conditionUponRelease.includes(option)?'border-primary bg-primary/10 text-primary':'border-input bg-background text-foreground hover:border-primary/50'}`}>{conditionUponRelease.includes(option)?'✓ ':''}{option}</button>)}
   </div>
   <label className="mt-4 block font-semibold" htmlFor="gate-out-condition-remarks">Remarks <span className="font-normal text-muted-foreground">(optional)</span></label>
   <textarea id="gate-out-condition-remarks" className="mt-2 min-h-24 w-full rounded-lg border border-input bg-background p-3 text-sm" value={conditionRemarks} maxLength={800} onChange={e=>setConditionRemarks(e.target.value)} placeholder="Additional notes on the container condition at Gate-out"/>
  </section>
  <label className="block text-sm font-bold">Reason for rejection <span className="font-normal text-muted-foreground">(only when rejecting)</span><textarea className="mt-2 min-h-24 w-full rounded-lg border border-input bg-background p-3" value={reason} maxLength={800} onChange={e=>setReason(e.target.value)} placeholder="Required when rejecting; visible to client"/></label>
  <div className="flex flex-wrap gap-3"><Button disabled={busy||!payment||!details?.invoice?.lines?.length||Math.abs(payment.amount-details.invoice.total)>0.001||!conditionUponRelease.length} onClick={()=>review('APPROVE')}>Verify Payment & Approve Gate-out</Button><Button disabled={busy||!reason.trim()} variant="outline" onClick={()=>review('REJECT')}>Reject Gate-out</Button></div>
 </div>}
 </OperationDrawer></PageContainer>
}
