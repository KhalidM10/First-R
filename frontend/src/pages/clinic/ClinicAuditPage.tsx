import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, CheckCircle, Download, Filter,
  RefreshCw, Search, ShieldAlert, XCircle,
  Clock, Globe, Monitor, Smartphone, Tablet, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { api } from '../../lib/api'
import { usePermissions } from '../../contexts/PermissionContext'
import { cn } from '../../lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  event_id: string
  created_at: string
  user_email: string | null
  user_role: string | null
  clinic_name: string | null
  action: string
  resource_type: string
  resource_id: string | null
  old_values: unknown
  new_values: unknown
  changed_fields: string[] | null
  ip_address: string
  country: string | null
  city: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  http_method: string | null
  api_endpoint: string | null
  duration_ms: number | null
  status: 'success' | 'failure' | 'blocked'
  failure_reason: string | null
  risk_score: number
  flags: string[] | null
  request_id: string
  session_id: string | null
}

interface AuditPage {
  items: AuditLog[]
  total: number
  page: number
  page_size: number
  pages: number
}

interface AuditStats {
  total: number
  success: number
  failure: number
  blocked: number
  high_risk: number
  top_actions: { action: string; count: number }[]
  top_users: { email: string; count: number }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-KE', {
    month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    success: { cls: 'bg-green-500/15 text-green-600', icon: CheckCircle },
    failure: { cls: 'bg-red-500/15 text-red-500',   icon: XCircle },
    blocked: { cls: 'bg-orange-500/15 text-orange-500', icon: AlertTriangle },
  }[status] ?? { cls: 'bg-gray-100 text-gray-500', icon: Clock }
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', cfg.cls)}>
      <Icon className="h-3 w-3" />
      {status}
    </span>
  )
}

function RiskBadge({ score }: { score: number }) {
  if (score < 30) return null
  const cls = score >= 70
    ? 'bg-red-100 text-red-700 border border-red-200'
    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', cls)}>
      {score >= 70 ? '⚠ HIGH' : score}
    </span>
  )
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="h-3.5 w-3.5 text-gray-400" />
  if (type === 'tablet') return <Tablet className="h-3.5 w-3.5 text-gray-400" />
  return <Monitor className="h-3.5 w-3.5 text-gray-400" />
}

function ActionBadge({ action }: { action: string }) {
  const parts = action.split('.')
  const resource = parts[0]
  const colors: Record<string, string> = {
    auth:        'bg-purple-50 text-purple-700',
    appointment: 'bg-blue-50 text-blue-700',
    patient:     'bg-teal-50 text-teal-700',
    order:       'bg-amber-50 text-amber-700',
    permission:  'bg-red-50 text-red-700',
    users:       'bg-indigo-50 text-indigo-700',
    clinic:      'bg-green-50 text-green-700',
  }
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[11px] font-mono font-medium', colors[resource] ?? 'bg-gray-100 text-gray-600')}>
      {action}
    </span>
  )
}

// ── Event detail modal ────────────────────────────────────────────────────────

function EventModal({ event, onClose }: { event: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Audit Event</h2>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">{event.event_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={event.status} />
            <RiskBadge score={event.risk_score} />
            <button onClick={onClose} className="ml-2 rounded-lg p-1.5 hover:bg-gray-100">
              <XCircle className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* WHO */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Who</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="User" value={event.user_email} />
              <Field label="Role" value={event.user_role?.replace(/_/g, ' ')} />
              <Field label="Clinic" value={event.clinic_name} />
              {event.acting_as && <Field label="Acting As" value={event.acting_as} />}
            </div>
          </section>

          {/* WHAT */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">What</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <p className="text-[10px] text-gray-400 mb-1">Action</p>
                <ActionBadge action={event.action} />
              </div>
              <Field label="Resource Type" value={event.resource_type} />
              <Field label="Resource ID" value={event.resource_id} mono />
              {event.changed_fields && event.changed_fields.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-400 mb-1">Changed Fields</p>
                  <div className="flex flex-wrap gap-1">
                    {event.changed_fields.map(f => (
                      <span key={f} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-600">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Old / New values */}
            {(event.old_values || event.new_values) && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {event.old_values && (
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">Before</p>
                    <pre className="rounded-lg bg-red-50 p-3 text-[11px] font-mono text-red-800 overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(event.old_values, null, 2)}
                    </pre>
                  </div>
                )}
                {event.new_values && (
                  <div>
                    <p className="text-[10px] text-gray-400 mb-1">After</p>
                    <pre className="rounded-lg bg-green-50 p-3 text-[11px] font-mono text-green-800 overflow-auto max-h-40 whitespace-pre-wrap">
                      {JSON.stringify(event.new_values, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* WHERE */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Where</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="IP Address" value={event.ip_address} mono />
              <Field label="Location" value={[event.city, event.country].filter(Boolean).join(', ') || '—'} />
              <Field label="Device" value={event.device_type} />
              <Field label="Browser / OS" value={[event.browser, event.os].filter(Boolean).join(' · ') || '—'} />
            </div>
          </section>

          {/* HOW */}
          <section>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">How</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Request ID" value={String(event.request_id)} mono />
              <Field label="Duration" value={event.duration_ms != null ? `${event.duration_ms}ms` : '—'} />
              <Field label="Method" value={event.http_method} mono />
              <Field label="Endpoint" value={event.api_endpoint} mono />
              <Field label="Timestamp" value={formatTime(event.created_at)} />
            </div>
          </section>

          {/* Outcome */}
          {(event.failure_reason || (event.flags && event.flags.length > 0)) && (
            <section>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Flags</h3>
              {event.failure_reason && (
                <p className="text-sm text-red-600 mb-2">{event.failure_reason}</p>
              )}
              {event.flags && event.flags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {event.flags.map(f => (
                    <span key={f} className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      f === 'HIGH_RISK' ? 'bg-red-100 text-red-700' : 'bg-orange-50 text-orange-700')}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={cn('text-[12px] text-gray-800 truncate', mono && 'font-mono')}>{value || '—'}</p>
    </div>
  )
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 px-5 py-4 shadow-sm">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn('text-2xl font-bold mt-1', color)}>{value.toLocaleString()}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function ClinicAuditPage() {
  const { isSuperAdmin } = usePermissions()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [riskFilter, setRiskFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const buildParams = useCallback(() => {
    const p: Record<string, string> = { page: String(page), page_size: '50' }
    if (search) p.user_email = search
    if (statusFilter) p.status = statusFilter
    if (actionFilter) p.action = actionFilter
    if (riskFilter) p.risk_min = riskFilter
    if (dateFrom) p.date_from = new Date(dateFrom).toISOString()
    if (dateTo) p.date_to = new Date(dateTo).toISOString()
    return p
  }, [page, search, statusFilter, actionFilter, riskFilter, dateFrom, dateTo])

  const { data, isLoading, refetch, isFetching } = useQuery<AuditPage>({
    queryKey: ['audit-logs', page, search, statusFilter, actionFilter, riskFilter, dateFrom, dateTo],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs', { params: buildParams() })
      return data
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  })

  const { data: stats } = useQuery<AuditStats>({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs/stats', { params: { hours: 24 } })
      return data
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })

  const { data: highRisk } = useQuery<AuditPage>({
    queryKey: ['audit-high-risk'],
    queryFn: async () => {
      const { data } = await api.get('/audit-logs/high-risk', { params: { hours: 24, page_size: 10 } })
      return data
    },
    enabled: isSuperAdmin,
    refetchInterval: 60_000,
  })

  function handleExport() {
    const params = new URLSearchParams(buildParams() as Record<string, string>)
    const token = localStorage.getItem('access_token')
    window.open(`/api/v1/audit-logs/export/csv?${params.toString()}&token=${token}`, '_blank')
  }

  function resetFilters() {
    setSearch('')
    setStatusFilter('')
    setActionFilter('')
    setRiskFilter('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete tamper-proof activity trail</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl bg-[#0d1f10] px-4 py-2 text-sm font-medium text-white hover:bg-[#1a3d1e] transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard label="Total (24h)" value={stats.total} color="text-gray-900" />
          <StatCard label="Success" value={stats.success} color="text-green-600" />
          <StatCard label="Failed" value={stats.failure} color="text-red-500" />
          <StatCard label="Blocked" value={stats.blocked} color="text-orange-500" />
          <StatCard label="High Risk" value={stats.high_risk} color="text-red-700" />
        </div>
      )}

      {/* High risk alert — super admin only */}
      {isSuperAdmin && highRisk && highRisk.total > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-5 w-5 text-red-600" />
            <h3 className="text-sm font-bold text-red-800">{highRisk.total} High-Risk Events (last 24h)</h3>
          </div>
          <div className="space-y-1.5">
            {highRisk.items.slice(0, 5).map(event => (
              <button
                key={event.event_id}
                onClick={() => setSelected(event)}
                className="w-full flex items-center gap-3 rounded-xl bg-white border border-red-100 px-3 py-2 text-left hover:bg-red-50 transition-colors"
              >
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">{event.risk_score}</span>
                <span className="text-[12px] font-mono text-gray-700 flex-1 truncate">{event.action}</span>
                <span className="text-[11px] text-gray-400">{event.user_email}</span>
                <span className="text-[11px] text-gray-400">{relativeTime(event.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-[12px] font-semibold text-gray-600 uppercase tracking-wide">Filters</span>
          <button onClick={resetFilters} className="ml-auto text-[11px] text-gray-400 hover:text-gray-600">Reset</button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Email or IP…"
              className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
          <input
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1) }}
            placeholder="Action…"
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="blocked">Blocked</option>
          </select>
          <select
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500 bg-white"
          >
            <option value="">Any risk</option>
            <option value="30">Medium+ (≥30)</option>
            <option value="70">High (≥70)</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1) }}
            className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                <th className="px-4 py-3 text-left font-semibold text-gray-500 w-40">Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">User</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Action</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Resource</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-500">Risk</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50 animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-3 rounded bg-gray-100" style={{ width: `${60 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No audit events found for the selected filters.
                  </td>
                </tr>
              ) : (
                data?.items.map(event => (
                  <tr
                    key={event.event_id}
                    onClick={() => setSelected(event)}
                    className={cn(
                      'border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50/80',
                      event.risk_score >= 70 && 'bg-red-50/30 hover:bg-red-50/50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="text-gray-800">{relativeTime(event.created_at)}</p>
                      <p className="text-gray-400 text-[10px]">{formatTime(event.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 truncate max-w-[160px]">{event.user_email ?? '—'}</p>
                      <p className="text-gray-400 text-[10px] capitalize">{event.user_role?.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={event.action} />
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      <p>{event.resource_type}</p>
                      {event.resource_id && (
                        <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{event.resource_id}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <DeviceIcon type={event.device_type} />
                        <div>
                          <p className="text-gray-700">{event.ip_address}</p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            {event.city || event.country
                              ? <><Globe className="h-2.5 w-2.5" />{[event.city, event.country].filter(Boolean).join(', ')}</>
                              : '—'
                            }
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={event.status} />
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge score={event.risk_score} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-[12px] text-gray-500">
              {((data.page - 1) * data.page_size) + 1}–{Math.min(data.page * data.page_size, data.total)} of {data.total.toLocaleString()} events
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, data.pages) }, (_, i) => {
                const start = Math.max(1, data.page - 2)
                const n = start + i
                if (n > data.pages) return null
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 text-[12px] transition-colors',
                      n === data.page
                        ? 'border-[#0d1f10] bg-[#0d1f10] text-white'
                        : 'border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    {n}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={data.page >= data.pages}
                className="rounded-lg border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
