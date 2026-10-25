const API_BASE=import.meta.env.VITE_API_BASE_URL||'http://localhost:5000/api'
export async function adminRequest(path,options={}){const response=await fetch(`${API_BASE}${path}`,{credentials:'include',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}});const payload=await response.json().catch(()=>({success:false,message:'Invalid server response.'}));if(!response.ok){const error=new Error(payload.message||'Request failed.');error.status=response.status;error.code=payload.code;throw error}return payload}
export const adminAuthApi={login:(data)=>adminRequest('/admin/auth/login',{method:'POST',body:JSON.stringify(data)}),logout:()=>adminRequest('/admin/auth/logout',{method:'POST'}),me:()=>adminRequest('/admin/auth/me'),changeInitialPassword:(data)=>adminRequest('/admin/auth/change-initial-password',{method:'POST',body:JSON.stringify(data)})}
export const adminUsersApi={list:(params={})=>{const q=new URLSearchParams(Object.entries(params).filter(([,v])=>v)).toString();return adminRequest(`/admin/users${q?`?${q}`:''}`)},get:(id)=>adminRequest(`/admin/users/${id}`),catalog:()=>adminRequest('/admin/users/permission-catalog'),create:(data)=>adminRequest('/admin/users',{method:'POST',body:JSON.stringify(data)}),update:(id,data)=>adminRequest(`/admin/users/${id}`,{method:'PUT',body:JSON.stringify(data)}),status:(id,status)=>adminRequest(`/admin/users/${id}/status`,{method:'PATCH',body:JSON.stringify({status})}),permissions:(id,permissions)=>adminRequest(`/admin/users/${id}/permissions`,{method:'PUT',body:JSON.stringify({permissions})}),reissue:(id)=>adminRequest(`/admin/users/${id}/reissue-temporary-password`,{method:'POST'})}

export const clientVerificationApi = {
  list: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
    return adminRequest(`/admin/client-verifications${query ? `?${query}` : ''}`)
  },
  detail: (id) => adminRequest(`/admin/client-verifications/${id}`),
  approve: (id) => adminRequest(`/admin/client-verifications/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) => adminRequest(`/admin/client-verifications/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  documentUrl: (companyId, documentId) => `${API_BASE}/admin/client-verifications/${companyId}/documents/${documentId}`,
}

export const analyticsApi = {
  dashboard: () => adminRequest('/admin/dashboard'),
  reports: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString()
    return adminRequest(`/admin/reports${query ? `?${query}` : ''}`)
  },
}
