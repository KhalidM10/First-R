import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  Activity, Bell, BellOff, Calendar, CheckCircle2,
  ChevronRight, Clock, Package, Stethoscope,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useWs } from '../contexts/WebSocketContext'

type NotifCategory = 'all' | 'appointments' | 'orders' | 'health'

interface ApiNotification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  is_read: boolean
  read_at: string | null
  created_at: string
}

function categoryFromType(type: string): NotifCategory {
  if (type.startsWith('appointment')) return 'appointments'
  if (type.startsWith('order')) return 'orders'
  if (type.startsWith('health')) return 'health'
  return 'all'
}

function iconFromType(type: string): { icon: React.ElementType; bg: string; color: string } {
  if (type.includes('confirmed'))  return { icon: Calendar,     bg: '#DBEAFE', color: '#1E40AF' }
  if (type.includes('cancelled'))  return { icon: Calendar,     bg: '#FEF2F2', color: '#DC2626' }
  if (type.includes('completed'))  return { icon: CheckCircle2, bg: '#F0FDF4', color: '#059669' }
  if (type.includes('appointment')) return { icon: Calendar,    bg: '#EFF6FF', color: '#1E40AF' }
  if (type.includes('order'))      return { icon: Package,      bg: '#FFFBEB', color: '#B45309' }
  if (type.includes('health'))     return { icon: Activity,     bg: '#F0FDF4', color: '#059669' }
  return { icon: Bell, bg: '#F8FAFC', color: '#64748B' }
}

// ── Static health tip (seeded daily) ─────────────────────────────────────────
const HEALTH_TIPS = [
  'Drink at least 8 glasses of water today. Hydration improves focus and immune function.',
  'A 30-minute walk today can reduce your risk of cardiovascular disease by up to 35%.',
  'Regular sleep of 7–9 hours helps your immune system fight infections more effectively.',
  'Eating leafy greens daily provides folate and iron — critical for energy levels.',
]
const DAILY_TIP: ApiNotification = {
  id: `health-tip-${new Date().toISOString().slice(0, 10)}`,
  type: 'health_tip',
  title: 'Daily Health Tip',
  body: HEALTH_TIPS[new Date().getDate() % HEALTH_TIPS.length],
  data: {},
  is_read: false,
  read_at: null,
  created_at: new Date().toISOString(),
}

// ── Card component ────────────────────────────────────────────────────────────

function NotifCard({
  notif, onRead,
}: { notif: ApiNotification; onRead: (id: string) => void }) {
  const navigate = useNavigate()
  const { icon: Icon, bg, color } = iconFromType(notif.type)

  function handleClick() {
    onRead(notif.id)
    const href =
      notif.type.startsWith('appointment') ? '/appointments'
      : notif.type.startsWith('order') ? '/medicines'
      : null
    if (href) navigate(href)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-4 text-left transition-colors hover:bg-gray-50 rounded-2xl p-4"
    >
      <div
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
        style={{ backgroundColor: bg }}
      >
        <Icon className="h-[18px] w-[18px]" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${notif.is_read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
            {notif.title}
          </p>
          {!notif.is_read && (
            <span className="shrink-0 h-2 w-2 rounded-full mt-1.5 bg-blue-600" />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{notif.body}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-3 w-3 text-gray-300" />
          <span className="text-[10px] text-gray-400">
            {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {!notif.type.startsWith('health') && (
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-2.5" />
      )}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const [category, setCategory] = useState<NotifCategory>('all')
  const qc = useQueryClient()
  const { unreadCount } = useWs()

  const { data, isLoading } = useQuery<{ total: number; unread: number; items: ApiNotification[] }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    staleTime: 30_000,
  })

  // Merge API notifications + static daily tip
  const allNotifs: ApiNotification[] = [
    ...(data?.items ?? []),
    DAILY_TIP,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const filtered =
    category === 'all'
      ? allNotifs
      : allNotifs.filter(n => categoryFromType(n.type) === category)

  const liveUnread = unreadCount + (DAILY_TIP.is_read ? 0 : 1)

  // Mark single read
  const markRead = useMutation({
    mutationFn: (ids: string[]) => api.post('/notifications/read', ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  // Mark all read
  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  function handleRead(id: string) {
    if (!id.startsWith('health-tip-')) {
      markRead.mutate([id])
    }
  }

  const TABS: { key: NotifCategory; label: string; icon: React.ElementType }[] = [
    { key: 'all',          label: 'All',          icon: Bell },
    { key: 'appointments', label: 'Appointments',  icon: Calendar },
    { key: 'orders',       label: 'Orders',        icon: Package },
    { key: 'health',       label: 'Health Tips',   icon: Stethoscope },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {liveUnread > 0 ? `${liveUnread} unread` : 'All caught up'}
          </p>
        </div>
        {liveUnread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(tab => {
          const count =
            tab.key === 'all'
              ? liveUnread
              : allNotifs.filter(n => categoryFromType(n.type) === tab.key && !n.is_read).length
          return (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className="flex items-center gap-1.5 shrink-0 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all"
              style={
                category === tab.key
                  ? { backgroundColor: '#1E40AF', color: 'white' }
                  : { backgroundColor: 'white', color: '#6B7280', border: '1px solid #E5E7EB' }
              }
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {count > 0 && (
                <span
                  className="text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
                  style={
                    category === tab.key
                      ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
                      : { backgroundColor: '#EFF6FF', color: '#1E40AF' }
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <BellOff className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-600">No notifications</p>
            <p className="text-xs text-gray-400 mt-1">
              {category === 'all'
                ? 'Your activity will appear here once you start using MedAssist.'
                : `No ${category} notifications yet.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 px-1">
            {filtered.map(notif => (
              <NotifCard key={notif.id} notif={notif} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-gray-400 text-center">
          Notifications are generated from your account activity and delivered in real time.
        </p>
      )}
    </div>
  )
}
