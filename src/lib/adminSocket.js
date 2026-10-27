import { io } from 'socket.io-client'

const URL = import.meta.env.DEV ? window.location.origin : (
  import.meta.env.VITE_SOCKET_URL ||
  (/^https?:\/\//i.test(import.meta.env.VITE_API_BASE_URL || '')
    ? new URL(import.meta.env.VITE_API_BASE_URL).origin : window.location.origin)
)

export const adminSocket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket', 'polling'],
  tryAllTransports: true,
  reconnection: true,
})
