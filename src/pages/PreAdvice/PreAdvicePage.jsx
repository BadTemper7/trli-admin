import {useCallback,useState} from 'react';
import {Link} from 'react-router-dom';
import OperationGuidance from '@/components/operations/OperationGuidance.jsx';
import {ClipboardList,CheckCircle2,XCircle} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer.jsx';
import PageHeader from '@/components/layout/PageHeader.jsx';
import OperationDrawer from '@/components/operations/OperationDrawer.jsx';
import OperationsTable from '@/components/operations/OperationsTable.jsx';
import {DetailGrid,WorkflowMini} from '@/components/operations/OperationDetails.jsx';
import {Button} from '@/components/ui/button.jsx';
import {operationsApi} from '@/lib/operationsApi.js';
import {useAuth} from '@/context/AuthContext.jsx';
import {MODULES,ACTIONS} from '@/constants/permissions.js';
import {usePagedOperationsList} from '@/hooks/usePagedOperationsList.js';

const EVENTS=['pre-advice:new','operations:pre-advice-updated','pre-advice:cancelled'];
const TABS=[{value:'PENDING',label:'Pending Approval',icon:ClipboardList},{value:'APPROVED',label:'Approved',icon:CheckCircle2},{value:'REJECTED',label:'Rejected',icon:XCircle}];

export default function PreAdvicePage(){
  const [approval,setApproval]=useState('PENDING');
  const loadPage=useCallback(params=>operationsApi.preAdvice.list({...params,approval}),[approval]);
  const {rows,search,setSearch,setPage,pagination,loading,error,setError,load}=usePagedOperationsList(loadPage,EVENTS);
  const [selected,setSelected]=useState(null),[reason,setReason]=useState(''),[busy,setBusy]=useState(false);
  const {can}=useAuth();
  const open=async row=>{setError('');setReason('');try{const r=await operationsApi.preAdvice.get(row.id);setSelected(r.data)}catch(e){setError(e.message)}};
  const review=async decision=>{
    if(!selected)return;
    if(decision==='REJECT'&&!reason.trim()){setError('A rejection reason is required.');return;}
    setBusy(true);setError('');
    try{
      if(decision==='APPROVE')await operationsApi.preAdvice.approve(selected.id);
      else await operationsApi.preAdvice.reject(selected.id,reason);
      setSelected(null);setReason('');await load();
    }catch(e){setError(e.message)}finally{setBusy(false)}
  };
  const pending=selected?.status==='SUBMITTED'&&selected?.workflowStage==='BOOKING_SUBMITTED';
  return <PageContainer>
    <PageHeader title="Pre-advice" description="Approve or reject incoming bookings. Gate-in requires separate verified payment and physical inspection."/>
    <OperationGuidance current={0} steps={[{title:"Review pre-advice",note:"Approve or reject the client booking."},{title:"Client pays Gate-in invoice",note:"Client pays in advance after approval."},{title:"Gate-in operations",note:"Payment, inspection and physical entry remain separate."}]} note="Approving a booking generates billing eligibility; it does not mark the container gated in." link={can(MODULES.GATE_IN,ACTIONS.VIEW)?"/gate-in":undefined} linkLabel="Open Gate-in"/>
    {error&&<div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="mb-5 flex flex-wrap gap-2">{TABS.map(({value,label,icon:Icon})=><button key={value} type="button" onClick={()=>{setApproval(value);setSelected(null);setPage(1)}} className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${approval===value?'border-primary bg-primary text-white':'border-border bg-card text-foreground'}`}><Icon className="size-4"/>{label}</button>)}</div>
    <OperationsTable rows={rows} search={search} onSearch={setSearch} onSelect={open} empty={`No ${approval.toLowerCase()} pre-advice records.`} loading={loading} pagination={pagination} onPage={setPage}/>
    <OperationDrawer open={!!selected} title={selected?.bookingReference} subtitle={selected?.containerNumber} onClose={()=>setSelected(null)}>
      {selected&&<div className="space-y-5">
        <DetailGrid item={selected}/>
        <div className="rounded-xl bg-muted p-4 text-sm"><strong>Approval status:</strong> {selected.preAdviceReview?.decision||(pending?'PENDING':'APPROVED')}{selected.preAdviceReview?.reason&&<p className="mt-2 text-red-700">Reason: {selected.preAdviceReview.reason}</p>}</div>
        <section><h3 className="font-bold">Booking history</h3><WorkflowMini history={selected.workflowHistory||[]}/></section>
        {!pending && selected.preAdviceReview?.decision === 'APPROVED' && can(MODULES.GATE_IN,ACTIONS.PROCESS) && <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm"><h3 className="font-bold">Additional booking transactions</h3><p className="mt-1 text-muted-foreground">Before the client submits payment, you can manually select configured Documentation Fee and other optional services for this booking's Gate-in invoice.</p><Link to={`/invoice-review?booking=${encodeURIComponent(selected.id)}`} className="mt-3 inline-flex font-bold text-primary underline underline-offset-4">Open booking billing / Add transaction</Link></section>}
        {pending&&can(MODULES.PRE_ADVICE,ACTIONS.EDIT)&&<section className="rounded-xl border p-4">
          <label className="block text-sm font-bold">Reason for rejection (required only if rejecting)</label>
          <textarea value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border p-3 text-sm" maxLength={800} placeholder="Enter a specific reason for the client"/>
          <div className="mt-3 flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>review('APPROVE')}>Approve Pre-advice</Button><Button variant="outline" disabled={busy||!reason.trim()} onClick={()=>review('REJECT')}>Reject Pre-advice</Button></div>
        </section>}
      </div>}
    </OperationDrawer>
  </PageContainer>
}
