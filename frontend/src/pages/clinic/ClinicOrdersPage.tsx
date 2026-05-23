import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Package, Search, ChevronDown, CheckCircle2, Truck, Clock, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import { formatKES, cn } from '../../lib/utils'

interface ClinicOrder {
  id: string
  order_number: string
  patient_name: string
  items: { name: string; qty: number; unit_price: number; total: number }[]
  total_kes: number
  status: string
  delivery_method: string
  payment_method: string
  created_at: string
}

const STATUS_CONFIG: Record<string, {
  label: string; bg: string; text: string; icon: React.ElementType
}> = {
  pending:    { label: 'Pending',    bg: '#FEF3C7', text: '#92400E', icon: Clock },
  processing: { label: 'Processing', bg: '#DBEAFE', text: '#1E40AF', icon: Package },
  ready:      { label: 'Ready',      bg: '#D1FAE5', text: '#065F46', icon: CheckCircle2 },
  delivered:  { label: 'Delivered',  bg: '#F3F4F6', text: '#374151', icon: Truck },
}

const NEXT_STATUS: Record<string, string> = {
  pending: 'processing',
  processing: 'ready',
  ready: 'delivered',
}

const SAMPLE_ORDERS: ClinicOrder[] = [
  {
    id: '1',
    order_number: 'MO-A1B2C3D4',
    patient_name: 'Wanjiku Mwangi',
    items: [
      { name: 'Paracetamol 500mg (24 tabs)', qty: 2, unit_price: 120, total: 240 },
      { name: 'Vitamin C 1000mg (30 tabs)', qty: 1, unit_price: 350, total: 350 },
    ],
    total_kes: 590,
    status: 'pending',
    delivery_method: 'pickup',
    payment_method: 'mpesa',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    order_number: 'MO-E5F6G7H8',
    patient_name: 'Brian Otieno',
    items: [
      { name: 'Amoxicillin 500mg (21 caps)', qty: 1, unit_price: 480, total: 480 },
      { name: 'ORS Sachets (Pack of 10)', qty: 2, unit_price: 150, total: 300 },
    ],
    total_kes: 780,
    status: 'processing',
    delivery_method: 'delivery',
    payment_method: 'mpesa',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    order_number: 'MO-I9J0K1L2',
    patient_name: 'Amina Hassan',
    items: [
      { name: 'Metformin 500mg (60 tabs)', qty: 1, unit_price: 650, total: 650 },
    ],
    total_kes: 650,
    status: 'ready',
    delivery_method: 'pickup',
    payment_method: 'cash',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    order_number: 'MO-M3N4O5P6',
    patient_name: 'James Kamau',
    items: [
      { name: 'Ibuprofen 400mg (20 tabs)', qty: 1, unit_price: 180, total: 180 },
      { name: 'Antacid Tablets (30 tabs)', qty: 1, unit_price: 220, total: 220 },
      { name: 'Eye Drops (Artificial Tears)', qty: 1, unit_price: 380, total: 380 },
    ],
    total_kes: 780,
    status: 'delivered',
    delivery_method: 'delivery',
    payment_method: 'mpesa',
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
]

function OrderStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function OrderCard({ order, onAdvance }: {
  order: ClinicOrder
  onAdvance: (id: string, status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const nextStatus = NEXT_STATUS[order.status]

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div
          className="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: '#EFF6FF' }}
        >
          <Package className="h-5 w-5" style={{ color: '#1E40AF' }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900">{order.order_number}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.patient_name} · {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            · {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-gray-900">{formatKES(order.total_kes)}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {format(parseISO(order.created_at), 'd MMM, h:mm a')}
          </p>
        </div>

        <ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 transition-transform', expanded && 'rotate-180')} />
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #F8FAFC' }}>
          <div className="px-5 py-4 space-y-4">
            {/* Items */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Items</p>
              <div className="space-y-1.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {item.name} <span className="text-gray-400">×{item.qty}</span>
                    </span>
                    <span className="font-semibold text-gray-800">{formatKES(item.total)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs pt-2" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <span className="font-bold text-gray-700">Total</span>
                  <span className="font-extrabold text-gray-900">{formatKES(order.total_kes)}</span>
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex gap-4 text-xs text-gray-500">
              <div>
                <span className="text-gray-400">Payment: </span>
                <span className="font-semibold text-gray-700 uppercase">{order.payment_method}</span>
              </div>
              <div>
                <span className="text-gray-400">Method: </span>
                <span className="font-semibold text-gray-700 capitalize">{order.delivery_method}</span>
              </div>
            </div>

            {/* Action */}
            {nextStatus && (
              <button
                onClick={() => onAdvance(order.id, nextStatus)}
                className="w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#1E40AF' }}
              >
                Mark as {STATUS_CONFIG[nextStatus]?.label}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function ClinicOrdersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [orders, setOrders] = useState<ClinicOrder[]>(SAMPLE_ORDERS)

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.patient_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  function handleAdvance(id: string, newStatus: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
  }

  const countByStatus = {
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage medicine orders from your patients</p>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { key: 'pending',    label: 'Pending',    color: '#D97706', bg: '#FFFBEB' },
          { key: 'processing', label: 'Processing', color: '#1E40AF', bg: '#EFF6FF' },
          { key: 'ready',      label: 'Ready',      color: '#059669', bg: '#ECFDF5' },
          { key: 'delivered',  label: 'Delivered',  color: '#6B7280', bg: '#F9FAFB' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(prev => prev === s.key ? 'all' : s.key)}
            className={cn(
              'rounded-2xl p-4 text-left transition-all',
              statusFilter === s.key ? 'ring-2' : '',
            )}
            style={{
              backgroundColor: s.bg,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              ...(statusFilter === s.key ? { ringColor: s.color } : {}),
            }}
          >
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>
              {countByStatus[s.key as keyof typeof countByStatus]}
            </p>
            <p className="text-xs font-semibold text-gray-500 mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order number or patient…"
            className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center py-16 text-center bg-white rounded-2xl"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-600">No orders found</p>
          <p className="text-xs text-gray-400 mt-1">
            {search ? 'Try a different search term.' : 'No orders match the current filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <OrderCard key={order.id} order={order} onAdvance={handleAdvance} />
          ))}
        </div>
      )}

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
        <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Orders management</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Real-time order sync from patient purchases is in active development. These sample orders demonstrate the workflow.
          </p>
        </div>
      </div>
    </div>
  )
}
