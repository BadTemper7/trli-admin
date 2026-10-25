import { adminRequest } from '@/lib/adminApi.js'

export const settingsApi = {
  getCompanyContact: () => adminRequest('/admin/settings/company-contact'),
  updateCompanyContact: (data) => adminRequest('/admin/settings/company-contact', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}
