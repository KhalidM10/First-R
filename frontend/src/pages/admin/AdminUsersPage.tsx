import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, User, Mail, Phone, Shield, Lock, Unlock,
  LogOut as LogOutIcon, Key, Trash2, UserX, X, Eye,
  ChevronRight, Clock,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { api } from '../../lib/api'
import type { User as AppUser } from '../../types'

// ── Types ────────────────────────────────────────────────────────────────────

interface AdminUser extends AppUser {
  last_login: string | null
  session_count: number
  total_appointments: number
  total_orders: number
  clinic_name: string | null
}

interface UserSession {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  last_active: string
}

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', full_name: 'Akinyi Omondi',     email: 'akinyi@gmail.com',      phone: '+254712001001', role: 'patient',          clinic_id: null,  clinic_name: null,                   county: 'Nairobi',      is_active: true,  is_email_verified: true,  avatar_url: null, created_at: '2024-01-15T10:00:00Z', last_login: '2025-05-21T08:30:00Z', session_count: 3,  total_appointments: 12, total_orders: 5 },
  { id: 'u2', full_name: 'Brian Mutua',        email: 'brian.mutua@yahoo.com', phone: '+254723002002', role: 'clinic_admin',     clinic_id: 'c1', clinic_name: 'Nairobi West Medical', county: 'Nairobi',      is_active: true,  is_email_verified: true,  avatar_url: null, created_at: '2024-02-20T09:00:00Z', last_login: '2025-05-22T07:15:00Z', session_count: 1,  total_appointments: 0,  total_orders: 0 },
  { id: 'u3', full_name: 'Dr. Wanjiku Kamau', email: 'w.kamau@clinic.ke',     phone: '+254734003003', role: 'clinic_doctor',    clinic_id: 'c2', clinic_name: 'Kisumu Family Health', county: 'Kisumu',       is_active: true,  is_email_verified: true,  avatar_url: null, created_at: '2024-03-05T11:00:00Z', last_login: '2025-05-20T14:22:00Z', session_count: 2,  total_appointments: 0,  total_orders: 0 },
  { id: 'u4', full_name: 'Fatuma Hassan',      email: 'fatuma@gmail.com',      phone: '+254745004004', role: 'patient',          clinic_id: null,  clinic_name: null,                   county: 'Mombasa',      is_active: false, is_email_verified: false, avatar_url: null, created_at: '2024-04-10T12:00:00Z', last_login: '2025-03-01T11:00:00Z', session_count: 0,  total_appointments: 3,  total_orders: 1 },
  { id: 'u5', full_name: 'James Kipchoge',     email: 'kipchoge.j@work.co.ke', phone: '+254756005005', role: 'clinic_receptionist', clinic_id: 'c3', clinic_name: 'Mombasa Coastal',  county: 'Uasin Gishu',  is_active: true,  is_email_verified: true,  avatar_url: null, created_at: '2024-05-22T08:00:00Z', last_login: '2025-05-22T06:00:00Z', session_count: 4,  total_appointments: 0,  total_orders: 0 },
  { id: 'u6', full_name: 'Mercy Wanjiru',      email: 'mercy.w@gmail.com',     phone: '+254767006006', role: 'patient',          clinic_id: null,  clinic_name: null,                   county: 'Kiambu',       is_active: true,  is_email_verified: true,  avatar_url: null, created_at: '2024-06-18T10:30:00Z', last_login: '2025-05-19T20:10:00Z', session_count: 1,  total_appointments: 7,  total_orders: 3 },
]

const MOCK_SESSIONS: UserSession[] = [
  { id: 's1', ip_address: '41.90.64.12',  user_agent: 'Chrome 124 / Android 14',   created_at: '2025-05-22T06:00:00Z', last_active: '2025-05-22T08:30:00Z' },
  { id: 's2', ip_address: '105.48.22.7',  user_agent: 'Safari / iOS 17',           created_at: '2025-05-20T11:00:00Z', last_active: '2025-05-20T14:20:00Z' },
  { id: 's3', ip_address: '197.232.10.5', user_agent: 'Firefox 125 / Windows 11',  created_at: '2025-05-18T09:15:00Z', last_active: '2025-05-18T12:00:00Z' },
]

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  patient:               { bg: '#EFF6FF', color: '#1E40AF' },
  clinic_admin:          { bg: '#F5F3FF', color: '#6D28D9' },
  clinic_doctor:         { bg: '#D1FAE5', color: '#065F46' },
  clinic_receptionist:   { bg: '#FEF3C7', color: '#92400E' },
  clinic_pharmacist:     { bg: '#FEE2E2', color: '#991B1B' },
  super_admin:           { bg: '#FEE2E2', color: '#991B1B' },
}

const ALL_ROLES = ['patient','clinic_admin','clinic_doctor','clinic_receptionist','clinic_pharmacist','super_admin']

// ── User detail panel ─────────────────────────────────────────────────────────

function UserPanel({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient()
  const [impersonateReason, setImpersonateReason] = useState('')
  const [showImpersonate, setShowImpersonate] = useState(false)
  const [newRole, setNewRole] = useState(user.role)

  const forceLogout = useMutation({
    mutationFn: () => api.post(`/admin/users/${user.id}/force-logout`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const toggleLock = useMutation({
    mutationFn: () => api.post(`/admin/users/${user.id}/${user.is_active ? 'lock' : 'unlock'}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const resetPw = useMutation({
    mutationFn: () => api.post(`/admin/users/${user.id}/reset-password`),
  })

  const changeRole = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/users/${user.id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteUser = useMutation({
    mutationFn: () => api.delete(`/admin/users/${user.id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); onClose() },
  })

  const rs = ROLE_STYLE[user.role] ?? ROLE_STYLE.patient
  const initials = user.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: '#6366F1' }}>
              {initials}
            </div>
            <div>
              <p className="font-bold text-gray-900">{user.full_name}</p>
              <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                style={{ backgroundColor: rs.bg, color: rs.color }}>
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Profile info */}
          <div className="space-y-2.5">
            {[
              { icon: Mail,  label: user.email },
              { icon: Phone, label: user.phone },
              { icon: User,  label: `County: ${user.county ?? '—'}` },
              { icon: Clock, label: `Last login: ${user.last_login ? formatDistanceToNow(parseISO(user.last_login), { addSuffix: true }) : 'never'}` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm text-gray-600">
                <Icon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions', val: user.session_count },
              { label: 'Appointments', val: user.total_appointments },
              { label: 'Orders', val: user.total_orders },
            ].map(({ label, val }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xl font-extrabold text-gray-900">{val}</p>
                <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
              </div>
            ))}
          </div>

          {/* Change role */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Change Role</p>
            <div className="flex gap-2">
              <select value={newRole} onChange={e => setNewRole(e.target.value as typeof user.role)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
              <button onClick={() => changeRole.mutate(newRole)} disabled={newRole === user.role || changeRole.isPending}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors">
                Apply
              </button>
            </div>
          </div>

          {/* Active sessions */}
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Active Sessions</p>
            <div className="space-y-2">
              {MOCK_SESSIONS.slice(0, user.session_count || 1).map(s => (
                <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 font-mono">{s.ip_address}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[200px]">{s.user_agent}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono shrink-0">
                    {formatDistanceToNow(parseISO(s.last_active), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Impersonate */}
          {showImpersonate ? (
            <div className="bg-amber-50 rounded-xl p-4 space-y-3 border border-amber-200">
              <p className="text-xs font-bold text-amber-800">Impersonate — Reason required (logged)</p>
              <textarea value={impersonateReason} onChange={e => setImpersonateReason(e.target.value)}
                rows={2} placeholder="State your reason for impersonation…"
                className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowImpersonate(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-white transition-colors">
                  Cancel
                </button>
                <button disabled={!impersonateReason.trim()}
                  className="flex-1 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-40 transition-colors"
                  onClick={() => api.post(`/admin/users/${user.id}/impersonate`, { reason: impersonateReason }).then(() => window.open('/dashboard', '_blank'))}>
                  Impersonate
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action buttons */}
        <div className="p-5 border-t border-gray-100 grid grid-cols-2 gap-2.5">
          <button onClick={() => forceLogout.mutate()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <LogOutIcon className="h-3.5 w-3.5" /> Force Logout
          </button>
          <button onClick={() => toggleLock.mutate()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold transition-colors"
            style={user.is_active ? { color: '#D97706', borderColor: '#FCD34D' } : { color: '#059669', borderColor: '#6EE7B7' }}>
            {user.is_active ? <><Lock className="h-3.5 w-3.5" /> Lock</> : <><Unlock className="h-3.5 w-3.5" /> Unlock</>}
          </button>
          <button onClick={() => resetPw.mutate()}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            <Key className="h-3.5 w-3.5" /> Reset Password
          </button>
          <button onClick={() => setShowImpersonate(true)}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 transition-colors">
            <Eye className="h-3.5 w-3.5" /> Impersonate
          </button>
          <button onClick={() => deleteUser.mutate()} disabled={deleteUser.isPending}
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete Account (GDPR)
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<AdminUser | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')

  const { data } = useQuery<AdminUser[]>({
    queryKey: ['admin-users', search],
    queryFn: () =>
      search.length >= 2
        ? api.get(`/admin/users?q=${encodeURIComponent(search)}`).then(r => r.data).catch(() => MOCK_USERS)
        : Promise.resolve(MOCK_USERS),
    staleTime: 20_000,
    placeholderData: MOCK_USERS,
  })

  const users = (data ?? MOCK_USERS).filter(u =>
    roleFilter === 'all' || u.role === roleFilter
  )

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-sm text-gray-400 mt-0.5">Search, inspect and manage all platform users</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
          <option value="all">All roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
              {['User', 'Role', 'Status', 'Joined', 'Last Login', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => {
              const rs = ROLE_STYLE[u.role] ?? ROLE_STYLE.patient
              return (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors cursor-pointer"
                  onClick={() => setSelected(u)}>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: '#6366F1' }}>
                        {u.full_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{u.full_name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold capitalize"
                      style={{ backgroundColor: rs.bg, color: rs.color }}>
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {u.is_active
                      ? <span className="text-[10px] font-bold rounded-full bg-green-50 text-green-700 px-2.5 py-1">Active</span>
                      : <span className="text-[10px] font-bold rounded-full bg-red-50 text-red-600 px-2.5 py-1">Locked</span>}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">
                    {new Date(u.created_at).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500">
                    {u.last_login ? formatDistanceToNow(parseISO(u.last_login), { addSuffix: true }) : '—'}
                  </td>
                  <td className="px-4 py-3.5">
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <UserX className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400 font-semibold">No users found</p>
          </div>
        )}
      </div>

      {selected && <UserPanel user={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
