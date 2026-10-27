import { useCallback, useEffect, useState } from 'react'
import { adminSocket } from '@/lib/adminSocket.js'

export function usePagedOperationsList(loader, socketEvents = [], { limit = 20 } = {}) {
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setError('')
      const response = await loader({ page, limit, search: debouncedSearch || undefined })
      const data = response.data || {}
      setRows(data.items || [])
      setPagination(data.pagination || { page, limit, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.message || 'Unable to load records.')
    } finally {
      setLoading(false)
    }
  }, [loader, page, limit, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const refresh = () => load()
    socketEvents.forEach((event) => adminSocket.on(event, refresh))
    // Reconcile missed updates after an offline interval.
    adminSocket.on('connect', refresh)
    return () => {
      socketEvents.forEach((event) => adminSocket.off(event, refresh))
      adminSocket.off('connect', refresh)
    }
  }, [load, socketEvents])

  return { rows, setRows, search, setSearch, page, setPage, pagination, loading, error, setError, load }
}
