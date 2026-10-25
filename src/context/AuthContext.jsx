import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAuthApi } from '@/lib/adminApi.js'
import { adminSocket } from '@/lib/adminSocket.js'
import { navigation, firstAccessiblePath } from '@/config/navigation.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const meRequestRef = useRef(null)
  const initializedRef = useRef(false)

  const refresh = useCallback(async () => {
    if (meRequestRef.current) return meRequestRef.current

    const request = adminAuthApi.me()
      .then((response) => {
        const nextUser = response.data?.user || null
        setUser(nextUser)
        return nextUser
      })
      .catch(() => {
        setUser(null)
        return null
      })
      .finally(() => {
        meRequestRef.current = null
        setLoading(false)
      })

    meRequestRef.current = request
    return request
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    refresh()
  }, [refresh])

  const userId = user?.id || null
  const mustChangePassword = Boolean(user?.mustChangePassword)

  useEffect(() => {
    if (!userId || mustChangePassword) return undefined

    if (!adminSocket.connected) adminSocket.connect()

    const handlePermissionsUpdated = async () => {
      const next = await refresh()
      if (next) navigate(firstAccessiblePath(next), { replace: true })
    }

    const handleForcedLogout = () => {
      setUser(null)
      if (adminSocket.connected) adminSocket.disconnect()
      navigate('/login', { replace: true })
    }

    adminSocket.on('admin:permissions-updated', handlePermissionsUpdated)
    adminSocket.on('admin:user-deactivated', handleForcedLogout)
    adminSocket.on('admin:password-reset-required', handleForcedLogout)

    return () => {
      adminSocket.off('admin:permissions-updated', handlePermissionsUpdated)
      adminSocket.off('admin:user-deactivated', handleForcedLogout)
      adminSocket.off('admin:password-reset-required', handleForcedLogout)
    }
  }, [userId, mustChangePassword, refresh, navigate])

  const canAccessModule = useCallback((module) => {
    if (!user) return false
    if (user.role === 'SUPER_ADMIN') return true
    return user.permissions?.some((permission) => permission.module === module && permission.actions?.includes('VIEW'))
  }, [user])

  const can = useCallback((module, action) => {
    if (!user) return false
    if (user.role === 'SUPER_ADMIN') return true
    return user.permissions?.some((permission) => permission.module === module && permission.actions?.includes(action))
  }, [user])

  const login = async (data) => {
    const response = await adminAuthApi.login(data)
    setUser(response.data.user)
    return response
  }

  const logout = async () => {
    try {
      await adminAuthApi.logout()
    } finally {
      setUser(null)
      if (adminSocket.connected) adminSocket.disconnect()
      navigate('/login', { replace: true })
    }
  }

  const value = useMemo(() => ({
    user,
    loading,
    refresh,
    login,
    logout,
    can,
    canAccessModule,
    navigation,
  }), [user, loading, refresh, can, canAccessModule])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
