import { adminRequest } from '@/lib/adminApi.js'

const LEGACY_STORAGE_KEY='trans-roadway-rate-setup-v1'

export const rateApi={
  list:(params={})=>{
    const q=new URLSearchParams(Object.entries(params).filter(([,v])=>v!==''&&v!=null)).toString()
    return adminRequest(`/admin/rates${q?`?${q}`:''}`)
  },
  get:(id)=>adminRequest(`/admin/rates/${id}`),
  create:(data)=>adminRequest('/admin/rates',{method:'POST',body:JSON.stringify(data)}),
  update:(id,data)=>adminRequest(`/admin/rates/${id}`,{method:'PUT',body:JSON.stringify(data)}),
  delete:(id)=>adminRequest(`/admin/rates/${id}`,{method:'DELETE'}),
  importLocal:(rates)=>adminRequest('/admin/rates/import-local',{method:'POST',body:JSON.stringify({rates})}),
}

export function getLegacyLocalRates(){
  try{
    const parsed=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)||'[]')
    return Array.isArray(parsed)?parsed:[]
  }catch{return []}
}
export function clearLegacyLocalRates(){localStorage.removeItem(LEGACY_STORAGE_KEY)}
