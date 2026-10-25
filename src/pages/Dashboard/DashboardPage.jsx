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
  const [error,setError]=useState("")
  const load=useCallback(async()=>{try{setError("");const response=await analyticsApi.dashboard();setData(response.data)}catch(e){setError(e.message||"Unable to load dashboard")}},[])
  useEffect(()=>{load()},[load])

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Live overview of terminal operations from the database"
        actions={<div className="sm:text-right"><p className="text-sm font-semibold text-foreground">{data?.meta?.dateLabel || "Loading..."}</p><p className="text-xs text-muted-foreground">Last updated: {data?.meta?.lastUpdated ? new Date(data.meta.lastUpdated).toLocaleTimeString("en-PH",{hour:"numeric",minute:"2-digit"}) : "—"}</p></div>}
      />
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 font-bold underline" onClick={load}>Retry</button></div>}
      {!data ? <DashboardSkeleton/> : <div className="space-y-6">
        <DashboardStats stats={data.stats} />
        <div className="grid gap-6 xl:grid-cols-12"><div className="xl:col-span-5 [&>*]:h-full"><YardCapacityCard stats={data.stats} /></div><div className="xl:col-span-7 [&>*]:h-full"><RevenueOverview stats={data.stats} revenueTrend={data.revenueTrend} /></div></div>
        <ContainerMovementChart data={data.containerMovement} />
        <div className="grid gap-6 xl:grid-cols-2"><TopCustomers data={data.topCustomers} /><ShippingLineActivity data={data.shippingLineActivity} /></div>
      </div>}
    </PageContainer>
  )
}
export default DashboardPage
