import { adminRequest } from '@/lib/adminApi.js'

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()
  return value ? `?${value}` : ''
}

export const operationsApi = {
  preAdvice: {
    list: (params) => adminRequest(`/admin/operations/pre-advice${query(params)}`),
    get: (id) => adminRequest(`/admin/operations/pre-advice/${id}`),
    approve: (id, note = '') => adminRequest(`/admin/operations/pre-advice/${id}/approve`, { method: 'POST', body: JSON.stringify({ note }) }),
    reject: (id, reason) => adminRequest(`/admin/operations/pre-advice/${id}/reject`, {method:'POST',body:JSON.stringify({reason})}),
  },
  gateIn: {
    list: (params) => adminRequest(`/admin/operations/gate-in${query(params)}`),
    inspect: (id, data) => adminRequest(`/admin/operations/gate-in/${id}/inspection`, { method: 'POST', body: JSON.stringify(data) }),
    process: (id, data = {}) => adminRequest(`/admin/operations/gate-in/${id}/process`, { method: 'POST', body: JSON.stringify(data) }),
  },
  inventory: {
    list: (params) => adminRequest(`/admin/operations/inventory${query(params)}`),
    update: (id, data) => adminRequest(`/admin/operations/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  gateOut: {
    list: (params) => adminRequest(`/admin/operations/gate-out${query(params)}`),
  },
  release: {
    list: (params) => adminRequest(`/admin/operations/release${query(params)}`),
    process: (id, data = {}) => adminRequest(`/admin/operations/release/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  },
}
