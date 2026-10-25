import {ShieldX} from 'lucide-react'
import PageContainer from '@/components/layout/PageContainer.jsx'
export default function AccessDeniedPage(){return <PageContainer><div className="mx-auto mt-16 max-w-xl rounded-2xl border bg-white p-10 text-center shadow-sm"><ShieldX className="mx-auto h-12 w-12 text-red-500"/><div className="mt-4 text-5xl font-black">403</div><h1 className="mt-2 text-xl font-bold">Access Denied</h1><p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this module.</p></div></PageContainer>}
