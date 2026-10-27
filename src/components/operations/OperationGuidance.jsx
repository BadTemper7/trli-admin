import { ArrowRight, CheckCircle2, Clock3, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

/** UI-only guidance; does not change any operational state or API calls. */
export default function OperationGuidance({ steps = [], current = 0, note, link, linkLabel }) {
  return <section aria-label="Operational workflow" className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-sm font-extrabold text-foreground">Operational checklist</h2>{link && <Link to={link} className="inline-flex items-center gap-1 text-xs font-bold text-primary">{linkLabel||'Next module'} <ArrowRight size={14}/></Link>}</div>
    <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{steps.map((step,index)=><li key={step.title} className={`flex items-start gap-2.5 rounded-xl border px-3 py-3 text-xs ${index===current?'border-primary/30 bg-primary/5':'border-border bg-muted/30'}`}><span className={`grid size-7 shrink-0 place-items-center rounded-full ${index<current?'bg-emerald-100 text-emerald-700':index===current?'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{index<current?<CheckCircle2 size={15}/>:<Clock3 size={15}/>}</span><div><p className="font-bold text-foreground">{index+1}. {step.title}</p>{step.note&&<p className="mt-1 leading-4 text-muted-foreground">{step.note}</p>}</div></li>)}</ol>
    {note&&<p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldAlert size={15} className="mt-0.5 shrink-0"/>{note}</p>}
  </section>;
}
