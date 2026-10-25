import { io } from 'socket.io-client'

const URL = import.meta.env.DEV
  ? window.location.origin
  : (import.meta.env.VITE_SOCKET_URL || window.location.origin)

export const adminSocket = io(URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ['websocket'],
  reconnection: true,
})
