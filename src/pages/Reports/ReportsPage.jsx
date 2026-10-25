import { useCallback, useEffect, useState } from "react"
import { Boxes, CircleGauge, Container, DollarSign, PackageCheck, Ship } from "lucide-react"
import PageContainer from "@/components/layout/PageContainer.jsx"
import PageHeader from "@/components/layout/PageHeader.jsx"
import { Button } from "@/components/ui/button.jsx"
import { analyticsApi } from "@/lib/adminApi.js"
import Pagination from "@/components/ui/Pagination.jsx"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters.js"

const isoDate=(date)=>date.toISOString().slice(0,10)
function defaultRange(){const now=new Date();return {from:isoDate(new Date(now.getFullYear(),now.getMonth(),1)),to:isoDate(now)}}
function Metric({label,value,Icon,sub}){return <div className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-2 text-3xl font-black tracking-tight">{value}</div>{sub&&<div className="mt-1 text-xs text-muted-foreground">{sub}</div>}</div><span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5"/></span></div></div>}
function Skeleton(){return <div className="space-y-5 animate-pulse"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="h-32 rounded-xl bg-slate-100"/>)}</div>{Array.from({length:3},(_,i)=><div key={i} className="h-64 rounded-xl bg-slate-100"/>)}</div>}

function ReportsPage() {
  const [range,setRange]=useState(defaultRange)
  const [data,setData]=useState(null)
  const [page,setPage]=useState(1)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState("")
  const load=useCallback(async()=>{setLoading(true);try{setError("");const response=await analyticsApi.reports({...range,page,limit:20});setData(response.data)}catch(e){setError(e.message||"Unable to load reports")}finally{setLoading(false)}},[range,page])
  useEffect(()=>{load()},[load])
  const b=data?.containerBreakdown||{}
  const c=data?.capacityEquivalent||{}
  const r=data?.releaseSummary||{}
  return <PageContainer>
    <PageHeader title="Reports" description="Database-driven operational, revenue, release, and capacity reports" />
    <section className="mb-6 flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      <label className="text-sm font-semibold">From<input type="date" className="mt-1 block h-10 rounded-lg border px-3" value={range.from} onChange={e=>{setPage(1);setRange(v=>({...v,from:e.target.value}))}}/></label>
      <label className="text-sm font-semibold">To<input type="date" className="mt-1 block h-10 rounded-lg border px-3" value={range.to} onChange={e=>{setPage(1);setRange(v=>({...v,to:e.target.value}))}}/></label>
      <Button onClick={load}>Refresh Report</Button>
    </section>
    {error&&<div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {loading||!data?<Skeleton/>:<div className="space-y-6">
      <section><div className="mb-3"><h2 className="text-lg font-black">Container Breakdown</h2><p className="text-sm text-muted-foreground">Container records created within the selected date range.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Empty Containers" value={formatNumber(b.empty||0)} Icon={Container}/><Metric label="Loaded Containers" value={formatNumber(b.loaded||0)} Icon={Boxes}/><Metric label="Local / International" value={`${formatNumber(b.local||0)} / ${formatNumber(b.international||0)}`} Icon={Ship} sub="Local / International"/><Metric label="20FT / 40FT" value={`${formatNumber(b.size20||0)} / ${formatNumber(b.size40||0)}`} Icon={Container} sub="20FT / 40FT"/></div></section>

      <section className="rounded-xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="text-lg font-black">Revenue by Client</h2><p className="text-sm text-muted-foreground">Top clients based on submitted Gate-in and Gate-out payments in the selected range.</p></div><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-5 py-3">Rank</th><th className="px-5 py-3">Client</th><th className="px-5 py-3">Transactions</th><th className="px-5 py-3 text-right">Revenue</th></tr></thead><tbody>{data.revenueByClient.map((row,i)=><tr key={row.client} className="border-t"><td className="px-5 py-4 font-bold">{i+1}</td><td className="px-5 py-4 font-semibold">{row.client}</td><td className="px-5 py-4">{formatNumber(row.transactions)}</td><td className="px-5 py-4 text-right font-black">{formatCurrency(row.revenue)}</td></tr>)}{!data.revenueByClient.length&&<tr><td colSpan="4" className="px-5 py-10 text-center text-muted-foreground">No revenue transactions in this range.</td></tr>}</tbody></table></div></section>

      <section><div className="mb-3"><h2 className="text-lg font-black">Release Reports</h2><p className="text-sm text-muted-foreground">Containers released during the selected period.</p></div><div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Released" value={formatNumber(r.total||0)} Icon={PackageCheck}/><Metric label="20FT / 40FT" value={`${formatNumber(r.size20||0)} / ${formatNumber(r.size40||0)}`} Icon={Container}/><Metric label="Local" value={formatNumber(r.local||0)} Icon={Ship}/><Metric label="International" value={formatNumber(r.international||0)} Icon={Ship}/></div><div className="rounded-xl border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-muted-foreground"><tr>{["Released At","Booking","Container","Client","Size","Load","Classification","Shipping Line"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{data.releases.map(row=><tr key={row.id} className="border-t"><td className="px-4 py-4">{row.releasedAt?new Date(row.releasedAt).toLocaleString("en-PH"):"—"}</td><td className="px-4 py-4 font-semibold">{row.bookingReference}</td><td className="px-4 py-4 font-bold">{row.containerNumber}</td><td className="px-4 py-4">{row.client}</td><td className="px-4 py-4">{row.containerSize}</td><td className="px-4 py-4">{row.loadStatus}</td><td className="px-4 py-4">{row.classification}</td><td className="px-4 py-4">{row.shippingLine||"—"}</td></tr>)}{!data.releases.length&&<tr><td colSpan="8" className="px-4 py-10 text-center text-muted-foreground">No released containers in this range.</td></tr>}</tbody></table></div><div className="border-t p-4"><Pagination {...data.releasePagination} onPage={setPage}/></div></div></section>

      <section><div className="mb-3"><h2 className="text-lg font-black">Capacity Equivalent Summary</h2><p className="text-sm text-muted-foreground">Current yard capacity normalized to TEU equivalents. 20FT = 1 TEU, 40FT = 2 TEU.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="20FT Equivalent" value={`${formatNumber(c.count20||0)} containers`} Icon={Container} sub={`${formatNumber(c.teu20||0)} TEU`}/><Metric label="40FT Equivalent" value={`${formatNumber(c.count40||0)} containers`} Icon={Container} sub={`${formatNumber(c.teu40||0)} TEU`}/><Metric label="Occupied / Capacity" value={`${formatNumber(c.occupiedTeu||0)} / ${formatNumber(c.capacityTeu||0)} TEU`} Icon={CircleGauge} sub={`${formatPercent(c.occupancyRate||0)} occupied`}/><Metric label="Available Equivalent" value={`${formatNumber(c.availableTeu||0)} TEU`} Icon={Boxes}/></div></section>
    </div>}
  </PageContainer>
}
export default ReportsPage
