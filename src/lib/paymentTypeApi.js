import { adminRequest } from '@/lib/adminApi.js'

export const paymentTypeApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString()
    return adminRequest(`/admin/payment-types${q ? `?${q}` : ''}`)
  },
  active: () => adminRequest('/admin/payment-types/active'),
  create: (data) => adminRequest('/admin/payment-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => adminRequest(`/admin/payment-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  disable: (id) => adminRequest(`/admin/payment-types/${id}`, { method: 'DELETE' }),
}
