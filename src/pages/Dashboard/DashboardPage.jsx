import { useCallback, useEffect, useState } from "react"
import ContainerMovementChart from "@/components/dashboard/ContainerMovementChart.jsx"
import DashboardStats from "@/components/dashboard/DashboardStats.jsx"
import RevenueOverview from "@/components/dashboard/RevenueOverview.jsx"
import ShippingLineActivity from "@/components/dashboard/ShippingLineActivity.jsx"
import TopCustomers from "@/components/dashboard/TopCustomers.jsx"
import YardCapacityCard from "@/components/dashboard/YardCapacityCard.jsx"
import PageContainer from "@/components/layout/PageContainer.jsx"
import PageHeader from "@/components/layout/PageHeader.jsx"
import { analyticsApi } from "@/lib/adminApi.js"

function DashboardSkeleton() {
  return <div className="space-y-6 animate-pulse"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4},(_,i)=><div key={i} className="h-36 rounded-xl border bg-slate-100" />)}</div><div className="grid gap-6 xl:grid-cols-2"><div className="h-80 rounded-xl border bg-slate-100"/><div className="h-80 rounded-xl border bg-slate-100"/></div><div className="h-80 rounded-xl border bg-slate-100"/></div>
}

function DashboardPage() {
  const [data,setData]=useState(null)
  const [period,setPeriod]=useState("daily")
  const [from,setFrom]=useState(()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=Object.fromEntries(p.map(t=>[t.type,t.value]));return `${x.year}-${x.month}-${x.day}`})
  const [to,setTo]=useState(()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const x=Object.fromEntries(p.map(t=>[t.type,t.value]));return `${x.year}-${x.month}-${x.day}`})
  const [error,setError]=useState("")
  const load=useCallback(async()=>{try{setError("");const response=await analyticsApi.dashboard({period,...(period==='custom'?{from,to}:{})});setData(response.data)}catch(e){setError(e.message||"Unable to load dashboard")}},[period,from,to])
  useEffect(()=>{load()},[load])

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Live overview of terminal operations from the database"
        actions={<div className="sm:text-right"><p className="text-sm font-semibold text-foreground">{data?.meta?.dateLabel || "Loading..."}</p><p className="text-xs text-muted-foreground">Last updated: {data?.meta?.lastUpdated ? new Date(data.meta.lastUpdated).toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"}) : "—"}</p></div>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm"><label className="text-xs font-bold">Dashboard period<select aria-label="Dashboard date filter" className="mt-1 block min-w-32 rounded-lg border p-2" value={period} onChange={e=>setPeriod(e.target.value)}>{[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['yearly','Yearly'],['custom','Custom date range']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>{period==='custom'&&<><label className="text-xs font-bold">Start date<input type="date" className="mt-1 block rounded-lg border p-2" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="text-xs font-bold">End date<input type="date" className="mt-1 block rounded-lg border p-2" value={to} onChange={e=>setTo(e.target.value)}/></label></>}<div className="ml-auto text-sm text-slate-600"><b>Active range:</b> {data?.meta?.range?.from||'—'} to {data?.meta?.range?.to||'—'} · Asia/Manila</div></div>
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 font-bold underline" onClick={load}>Retry</button></div>}
      {!data ? <DashboardSkeleton/> : <div className="space-y-6">
        <DashboardStats stats={data.stats} />
        <div className="grid gap-6 xl:grid-cols-12"><div className="xl:col-span-5 [&>*]:h-full"><YardCapacityCard stats={data.stats} /></div><div className="xl:col-span-7 [&>*]:h-full"><RevenueOverview stats={data.stats} revenueTrend={data.revenueTrend} label={data.meta?.range?.from+" to "+data.meta?.range?.to} /></div></div>
        <ContainerMovementChart data={data.containerMovement} periodLabel={data.meta?.dateLabel||"selected period"} />
        <div className="grid gap-6 xl:grid-cols-2"><TopCustomers data={data.topCustomers} /><ShippingLineActivity data={data.shippingLineActivity} /></div>
      </div>}
    </PageContainer>
  )
}
export default DashboardPage
