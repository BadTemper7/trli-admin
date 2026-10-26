import {useEffect,useState} from 'react';
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
export default function GateOutPage(){
 const {rows,search,setSearch,setPage,pagination,loading,error,setError,load}=usePagedOperationsList(operationsApi.gateOut.list,EVENTS);
 const [selected,setSelected]=useState(null),[details,setDetails]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!selected){setDetails(null);return;}let alive=true;adminRequest(`/admin/gate-out-review/${selected.id}`).then(r=>{if(alive)setDetails(r.data)}).catch(e=>{if(alive)setError(e.message)});return()=>{alive=false}},[selected,setError]);
 const review=async decision=>{
  if(decision==='REJECT'&&!reason.trim()){setError('A rejection reason is required.');return;}
  setBusy(true);setError('');
  try{await adminRequest(`/admin/gate-out-review/${selected.id}/review`,{method:'POST',body:JSON.stringify({decision,reason})});setSelected(null);setReason('');await load();}
  catch(e){setError(e.message)}finally{setBusy(false)}
 };
 const payment=details?.payments?.find(p=>p.status==='PENDING_VERIFICATION');
 return <PageContainer><PageHeader title="Gate-out" description="Verify submitted online payment evidence and approve or reject the Gate-out request in one action."/>
 {error&&<p role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
 <OperationsTable rows={rows} search={search} onSearch={setSearch} onSelect={setSelected} loading={loading} pagination={pagination} onPage={setPage} empty="No pending Gate-out requests."/>
 <OperationDrawer open={!!selected} title="Combined Gate-out Approval" subtitle={selected?.bookingReference} onClose={()=>setSelected(null)}>
 {selected&&<div className="space-y-5"><DetailGrid item={selected}/>
  <section className="rounded-xl border p-4 text-sm"><h3 className="font-bold">Existing Booking & Transport Details (read-only)</h3><p className="mt-2">Container: {selected.containerNumber} ({selected.containerSize} · {selected.containerType})</p><p>Truck: {details?.booking?.truckPlateNumber||selected.truckPlateNumber} · Driver: {details?.booking?.driverName||selected.driverName}</p><p>Driver licence: {details?.booking?.driverLicenceNumber||selected.driverLicenceNumber}</p><p>Gate-out scheduled: {selected.gateOut?.scheduledDate} {selected.gateOut?.scheduledTime}</p></section>
  {!details?<p>Loading invoice and payment evidence...</p>:<section className="rounded-xl border p-4 text-sm"><h3 className="font-bold">Invoice and Payment Verification</h3>
   <p className="mt-2"><b>Invoice:</b> {details.invoice?.number||'Not generated'} · <b>Amount due:</b> {peso(details.invoice?.total)}</p>
   {details.invoice?.lines?.map((line,i)=><div key={i} className="flex justify-between border-b py-2"><span>{line.description} × {line.quantity}</span><span>{peso(line.amount)}</span></div>)}
   <div className="mt-2 text-right"><p>Subtotal: {peso(details.invoice?.subtotal)}</p><p>VAT ({details.invoice?.vatRate}%): {peso(details.invoice?.vat)}</p><strong>Total: {peso(details.invoice?.total)}</strong></div>
   <button type="button" className="mt-3 text-sm font-bold text-blue-700 underline" onClick={()=>openAdminFile(`/admin/gate-out-review/${selected.id}/invoice/pdf`,true).catch(e=>setError(e.message))}>Download Invoice PDF</button>
   {details.payments?.map(p=><div key={p._id} className="mt-3 rounded-lg bg-muted p-3"><p><strong>Method:</strong> {p.method} · <strong>Reference:</strong> {p.reference||'Not supplied (proof uploaded)'}</p><p>Amount submitted: {peso(p.amount)} · {p.status}</p>{p.receivingAccount?.accountNumber&&<p className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-xs"><strong>Receiving account:</strong> {p.receivingAccount.bankName} · {p.receivingAccount.accountName} · {p.receivingAccount.accountNumber}</p>}{p.proof?.storedName?<button className="mt-2 text-blue-700 underline" type="button" onClick={()=>openAdminFile(`/admin/gate-out-review/payments/${p._id}/proof`).catch(e=>setError(e.message))}>View payment proof</button>:<p className="mt-2 text-xs text-muted-foreground">No attachment — verify against receiving account records using the reference.</p>}</div>)}
  </section>}
  <label className="block text-sm font-bold">Reason for rejection<textarea className="mt-2 min-h-24 w-full rounded-lg border p-3" value={reason} maxLength={800} onChange={e=>setReason(e.target.value)} placeholder="Required when rejecting; visible to client"/></label>
  <div className="flex flex-wrap gap-3"><Button disabled={busy||!payment||!details?.invoice||Math.abs(payment.amount-details.invoice.total)>0.001} onClick={()=>review('APPROVE')}>Verify Payment & Approve Gate-out</Button><Button disabled={busy||!reason.trim()} variant="outline" onClick={()=>review('REJECT')}>Reject Gate-out</Button></div>
 </div>}
 </OperationDrawer></PageContainer>
}
