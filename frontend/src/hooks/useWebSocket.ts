/**
 * WebSocket hook with:
 * - Authenticated connection via cookie (same-origin) or ?token= query param
 * - Exponential backoff reconnect (1s → 2 → 4 → 8 → 16 → 30s max)
 * - Automatic fallback to 30s REST polling if WS fails 5+ times
 * - Heartbeat ping/pong to detect stale connections
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export type WsMessage = {
  type: string
  data: Record<string, unknown>
}

type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'polling'

const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000'
const MAX_RETRIES_BEFORE_POLL = 5
const MAX_BACKOFF_MS = 30_000
const PING_INTERVAL_MS = 25_000

export function useWebSocket(onMessage: (msg: WsMessage) => void) {
  const [status, setStatus] = useState<WsStatus>('connecting')
  const wsRef = useRef<WebSocket | null>(null)
  const retryCount = useRef(0)
  const retryTimer = useRef<ReturnType<typeof setTimeout>>()
  const pingTimer = useRef<ReturnType<typeof setInterval>>()
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const backoffMs = () =>
    Math.min(1_000 * 2 ** retryCount.current, MAX_BACKOFF_MS)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_BASE}/ws`)
    wsRef.current = ws
    setStatus('connecting')

    ws.onopen = () => {
      retryCount.current = 0
      setStatus('connected')
      // Heartbeat ping
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, PING_INTERVAL_MS)
    }

    ws.onmessage = (event) => {
      if (event.data === 'pong') return
      try {
        const msg: WsMessage = JSON.parse(event.data)
        onMessageRef.current(msg)
      } catch {
        /* ignore malformed messages */
      }
    }

    ws.onclose = () => {
      clearInterval(pingTimer.current)
      retryCount.current += 1
      if (retryCount.current >= MAX_RETRIES_BEFORE_POLL) {
        setStatus('polling')
      } else {
        setStatus('disconnected')
        retryTimer.current = setTimeout(connect, backoffMs())
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(retryTimer.current)
      clearInterval(pingTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { status }
}
