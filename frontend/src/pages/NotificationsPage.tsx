import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import {
  Activity, Bell, BellOff, Calendar, CheckCircle2,
  ChevronRight, Clock, Package, Stethoscope,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import type { Appointment, MedOrder } from '../types'

type NotifCategory = 'all' | 'appointments' | 'orders' | 'health'

type NotifItem = {
  id: string
  category: NotifCategory
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  body: string
  time: string
  href?: string
  read: boolean
}

const READ_KEY = 'medassist_notif_read'

function getReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]'))
  } catch {
    return new Set()
  }
}

function markReadIds(ids: string[]) {
  const existing = getReadIds()
  ids.forEach(id => existing.add(id))
  localStorage.setItem(READ_KEY, JSON.stringify([...existing]))
}

function buildNotifications(
  appointments: Appointment[],
  orders: (MedOrder & { order_number?: string })[],
  readIds: Set<string>,
): NotifItem[] {
  const items: NotifItem[] = []

  for (const appt of appointments) {
    const id = `appt-${appt.id}`
    if (appt.status === 'confirmed') {
      items.push({
        id,
        category: 'appointments',
        icon: Calendar,
        iconBg: '#EFF6FF',
        iconColor: '#1E40AF',
        title: 'Appointment Confirmed',
        body: `Your appointment with ${appt.doctor_name ?? 'the doctor'} at ${appt.clinic_name ?? 'the clinic'} is confirmed.`,
        time: appt.created_at,
        href: '/appointments',
        read: readIds.has(id),
      })
    } else if (appt.status === 'cancelled') {
      items.push({
        id: `appt-cancel-${appt.id}`,
        category: 'appointments',
        icon: Calendar,
        iconBg: '#FEF2F2',
        iconColor: '#DC2626',
        title: 'Appointment Cancelled',
        body: `Your appointment on ${appt.appointment_date} has been cancelled.`,
        time: appt.created_at,
        href: '/appointments',
        read: readIds.has(`appt-cancel-${appt.id}`),
      })
    } else if (appt.status === 'completed') {
      const id2 = `appt-done-${appt.id}`
      items.push({
        id: id2,
        category: 'appointments',
        icon: CheckCircle2,
        iconBg: '#F0FDF4',
        iconColor: '#059669',
        title: 'Appointment Completed',
        body: `Your visit with ${appt.doctor_name ?? 'the doctor'} is complete. Leave a review?`,
        time: appt.created_at,
        href: '/appointments',
        read: readIds.has(id2),
      })
    }
  }

  for (const order of orders) {
    const ref = (order as any).order_number ?? (order as any).order_reference ?? order.id
    const id = `order-${order.id}`
    const statusMsgs: Record<string, { title: string; body: string; bg: string; color: string }> = {
      pending:    { title: 'Order Received', body: `Order ${ref} is being reviewed.`, bg: '#FFFBEB', color: '#B45309' },
      processing: { title: 'Order Processing', body: `Order ${ref} is being prepared.`, bg: '#EFF6FF', color: '#1E40AF' },
      ready:      { title: 'Order Ready', body: `Order ${ref} is ready for pickup or dispatch.`, bg: '#F0FDF4', color: '#059669' },
      delivered:  { title: 'Order Delivered', body: `Order ${ref} has been delivered. Enjoy your health!`, bg: '#F0FDF4', color: '#059669' },
    }
    const cfg = statusMsgs[(order as any).status ?? 'pending']
    if (cfg) {
      items.push({
        id,
        category: 'orders',
        icon: Package,
        iconBg: cfg.bg,
        iconColor: cfg.color,
        title: cfg.title,
        body: cfg.body,
        time: order.created_at,
        href: '/medicines',
        read: readIds.has(id),
      })
    }
  }

  // Health tip (static, seeded once per day)
  const tipId = `health-tip-${new Date().toISOString().slice(0, 10)}`
  const tips = [
    'Drink at least 8 glasses of water today. Hydration improves focus and immune function.',
    'A 30-minute walk today can reduce your risk of cardiovascular disease by up to 35%.',
    'Regular sleep of 7–9 hours helps your immune system fight infections more effectively.',
    'Eating leafy greens daily provides folate and iron — critical for energy levels.',
  ]
  const tipBody = tips[new Date().getDate() % tips.length]
  items.push({
    id: tipId,
    category: 'health',
    icon: Activity,
    iconBg: '#F0FDF4',
    iconColor: '#059669',
    title: 'Daily Health Tip',
    body: tipBody,
    time: new Date().toISOString(),
    read: readIds.has(tipId),
  })

  return items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
}

function NotifCard({ item, onRead }: { item: NotifItem; onRead: (id: string) => void }) {
  const navigate = useNavigate()

  function handleClick() {
    onRead(item.id)
    if (item.href) navigate(item.href)
  }

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-start gap-4 text-left transition-colors hover:bg-gray-50 rounded-2xl p-4 -mx-1"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      {/* Icon */}
      <div
        className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
        style={{ backgroundColor: item.iconBg }}
      >
        <item.icon className="h-4.5 w-4.5" style={{ color: item.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${item.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
            {item.title}
          </p>
          {!item.read && (
            <span className="shrink-0 h-2 w-2 rounded-full mt-1.5" style={{ backgroundColor: '#1E40AF' }} />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{item.body}</p>
        <div className="flex items-center gap-1 mt-1.5">
          <Clock className="h-3 w-3 text-gray-300" />
          <span className="text-[10px] text-gray-400">
            {formatDistanceToNow(parseISO(item.time), { addSuffix: true })}
          </span>
        </div>
      </div>

      {item.href && (
        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-2.5" />
      )}
    </button>
  )
}

export function NotificationsPage() {
  const [category, setCategory] = useState<NotifCategory>('all')
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds)

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['my-appointments-all'],
    queryFn: async () => {
      const [upcoming, past, cancelled] = await Promise.all([
        api.get('/appointments/my', { params: { filter: 'upcoming' } }),
        api.get('/appointments/my', { params: { filter: 'past' } }),
        api.get('/appointments/my', { params: { filter: 'cancelled' } }),
      ])
      return [...(upcoming.data ?? []), ...(past.data ?? []), ...(cancelled.data ?? [])]
    },
    staleTime: 60_000,
  })

  const { data: orders = [] } = useQuery({
    queryKey: ['my-orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders/my')
      return data ?? []
    },
    staleTime: 60_000,
  })

  const allNotifs = buildNotifications(
    appointments,
    Array.isArray(orders) ? orders : [],
    readIds,
  )

  const filtered = category === 'all'
    ? allNotifs
    : allNotifs.filter(n => n.category === category)

  const unreadCount = allNotifs.filter(n => !n.read).length

  function handleRead(id: string) {
    markReadIds([id])
    setReadIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function markAllRead() {
    const ids = allNotifs.map(n => n.id)
    markReadIds(ids)
    setReadIds(new Set(ids))
  }

  const tabs: { key: NotifCategory; label: string; icon: React.ElementType }[] = [
    { key: 'all', label: 'All', icon: Bell },
    { key: 'appointments', label: 'Appointments', icon: Calendar },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'health', label: 'Health Tips', icon: Stethoscope },
  ]

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* ── Category tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(tab => {
          const count = tab.key === 'all'
            ? unreadCount
            : allNotifs.filter(n => n.category === tab.key && !n.read).length
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

      {/* ── Notification list ─────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {filtered.length === 0 ? (
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
            {filtered.map(item => (
              <NotifCard key={item.id} item={item} onRead={handleRead} />
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-gray-400 text-center">
          Notifications are generated from your account activity.
        </p>
      )}
    </div>
  )
}
