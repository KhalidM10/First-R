/**
 * Slide-in notification toast — appears from the top-right when a new
 * real-time notification arrives via WebSocket.
 */
import { useEffect, useState } from 'react'
import { X, Bell, Calendar, Package, Activity } from 'lucide-react'
import { useWs } from '../../contexts/WebSocketContext'
import { cn } from '../../lib/utils'

const TYPE_CONFIG: Record<string, {
  icon: React.ElementType; bg: string; iconColor: string
}> = {
  appointment_booked:    { icon: Calendar, bg: '#EFF6FF', iconColor: '#1E40AF' },
  appointment_confirmed: { icon: Calendar, bg: '#ECFDF5', iconColor: '#059669' },
  appointment_cancelled: { icon: Calendar, bg: '#FEF2F2', iconColor: '#DC2626' },
  appointment_completed: { icon: Calendar, bg: '#F0FDF4', iconColor: '#059669' },
  order_processing:      { icon: Package, bg: '#EFF6FF', iconColor: '#1E40AF' },
  order_ready:           { icon: Package, bg: '#ECFDF5', iconColor: '#059669' },
  order_delivered:       { icon: Package, bg: '#F0FDF4', iconColor: '#059669' },
  health:                { icon: Activity, bg: '#ECFDF5', iconColor: '#059669' },
}

const TOAST_DURATION_MS = 5_000

export function NotificationToast() {
  const { latestNotification } = useWs()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState<string | null>(null)

  useEffect(() => {
    if (!latestNotification) return
    if (latestNotification.id === dismissed) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), TOAST_DURATION_MS)
    return () => clearTimeout(t)
  }, [latestNotification, dismissed])

  if (!latestNotification || !visible) return null

  const cfg = TYPE_CONFIG[latestNotification.notif_type] ?? {
    icon: Bell, bg: '#F8FAFC', iconColor: '#64748B',
  }
  const Icon = cfg.icon

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-[9999] w-80 rounded-2xl shadow-2xl overflow-hidden',
        'transition-all duration-300',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none',
      )}
      style={{ backgroundColor: '#fff', border: '1px solid rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon className="h-4.5 w-4.5" style={{ color: cfg.iconColor }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-snug">
            {latestNotification.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
            {latestNotification.body}
          </p>
        </div>

        <button
          onClick={() => { setVisible(false); setDismissed(latestNotification.id) }}
          className="shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors mt-0.5"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
        <div
          className="h-full"
          style={{
            backgroundColor: cfg.iconColor,
            animation: `toast-progress ${TOAST_DURATION_MS}ms linear forwards`,
          }}
        />
      </div>

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  )
}
