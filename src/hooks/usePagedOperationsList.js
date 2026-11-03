import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { adminSocket } from '@/lib/adminSocket.js'

export function usePagedOperationsList(loader, socketEvents = [], { limit = 20, summaryLoader = null } = {}) {
  const location = useLocation()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const linkedSearch = new URLSearchParams(location.search).get('search')
    if (linkedSearch !== null) setSearch(linkedSearch)
  }, [location.search])

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

  const loadSummary = useCallback(async () => {
    if (!summaryLoader) return
    try {
      const response = await summaryLoader({ scope: 'filtered', search: debouncedSearch || undefined })
      setSummary(response.data?.summary || null)
    } catch { /* Keep the table usable; never substitute page counts. */ }
  }, [summaryLoader, debouncedSearch])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadSummary() }, [loadSummary])
  useEffect(() => {
    const refresh = () => { load(); loadSummary() }
    socketEvents.forEach((event) => adminSocket.on(event, refresh))
    // Reconcile missed updates after an offline interval.
    adminSocket.on('connect', refresh)
    return () => {
      socketEvents.forEach((event) => adminSocket.off(event, refresh))
      adminSocket.off('connect', refresh)
    }
  }, [load, loadSummary, socketEvents])

  return { rows, setRows, summary, loadSummary, search, debouncedSearch, setSearch, page, setPage, pagination, loading, error, setError, load }
}
