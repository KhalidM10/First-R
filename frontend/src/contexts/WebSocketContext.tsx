/**
 * WebSocketContext — provides real-time events and unread notification count
 * to the entire app. Falls back to 30-second polling when WS is in 'polling' mode.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { useWebSocket, type WsMessage } from '../hooks/useWebSocket'
import { api } from '../lib/api'

interface NotificationPayload {
  id: string
  notif_type: string
  title: string
  body: string
  data: Record<string, unknown>
  ts: string
  read: boolean
}

interface WsContextValue {
  unreadCount: number
  status: 'connecting' | 'connected' | 'disconnected' | 'polling'
  latestNotification: NotificationPayload | null
}

const WsContext = createContext<WsContextValue>({
  unreadCount: 0,
  status: 'connecting',
  latestNotification: null,
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  const qc = useQueryClient()
  const [unreadCount, setUnreadCount] = useState(0)
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval>>()

  // Fetch unread count from REST (used on mount + polling fallback)
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.unread ?? 0)
    } catch {
      // Silently ignore — stale count is fine
    }
  }, [isAuthenticated])

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type === 'notification') {
      const notif = msg.data as NotificationPayload
      setLatestNotification(notif)
      setUnreadCount(prev => prev + 1)
      // Invalidate notification list so NotificationsPage refreshes
      qc.invalidateQueries({ queryKey: ['notifications'] })
    } else if (msg.type === 'new_appointment' || msg.type === 'appointment_cancelled') {
      // Clinic dashboard: invalidate appointment data
      qc.invalidateQueries({ queryKey: ['clinic-appointments'] })
      qc.invalidateQueries({ queryKey: ['clinic-stats'] })
    } else if (
      msg.type === 'order_ready' || msg.type === 'order_delivered' ||
      msg.type === 'order_processing' || msg.type.startsWith('order_')
    ) {
      qc.invalidateQueries({ queryKey: ['my-orders'] })
    } else if (msg.type.startsWith('appointment_')) {
      qc.invalidateQueries({ queryKey: ['my-appointments-all'] })
      qc.invalidateQueries({ queryKey: ['my-appointments'] })
    }
  }, [qc])

  const { status } = useWebSocket(isAuthenticated ? handleMessage : () => {})

  // Start/stop polling based on WS status
  useEffect(() => {
    clearInterval(pollingRef.current)
    if (status === 'polling' && isAuthenticated) {
      fetchUnread()
      pollingRef.current = setInterval(fetchUnread, 30_000)
    }
    return () => clearInterval(pollingRef.current)
  }, [status, isAuthenticated, fetchUnread])

  // Initial unread count fetch on mount / auth change
  useEffect(() => {
    if (isAuthenticated) fetchUnread()
    else setUnreadCount(0)
  }, [isAuthenticated, fetchUnread])

  return (
    <WsContext.Provider value={{ unreadCount, status, latestNotification }}>
      {children}
    </WsContext.Provider>
  )
}

export function useWs() {
  return useContext(WsContext)
}
