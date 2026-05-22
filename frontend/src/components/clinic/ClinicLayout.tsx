import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Calendar, BarChart2, CreditCard,
  ArrowLeft, LogOut, Users, Package, ShieldCheck,
  Stethoscope, Star, Bell, Settings, Store,
  ChevronRight,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { usePermissions } from '../../contexts/PermissionContext'
import { useWs } from '../../contexts/WebSocketContext'
import { api } from '../../lib/api'

interface ClinicNavItem {
  href: string
  label: string
  icon: React.ElementType
  end?: boolean
  permission?: [string, string]
  roles?: string[]
  dividerBefore?: boolean
}

const CLINIC_NAV: ClinicNavItem[] = [
  { href: '/clinic-dashboard',               label: 'Overview',      icon: LayoutDashboard, end: true },
  { href: '/clinic-dashboard/appointments',  label: 'Appointments',  icon: Calendar,        permission: ['appointments', 'read'] },
  { href: '/clinic-dashboard/patients',      label: 'Patients',      icon: Users,           permission: ['patients', 'read'] },
  { href: '/clinic-dashboard/doctors',       label: 'Doctors',       icon: Stethoscope },
  { href: '/clinic-dashboard/orders',        label: 'Orders',        icon: Package,         permission: ['orders', 'read:clinic'] },
  { href: '/clinic-dashboard/products',      label: 'Products',      icon: Store },
  { href: '/clinic-dashboard/analytics',     label: 'Analytics',     icon: BarChart2,       permission: ['analytics', 'read:basic'], dividerBefore: true },
  { href: '/clinic-dashboard/reviews',       label: 'Reviews',       icon: Star },
  { href: '/clinic-dashboard/audit',         label: 'Audit Logs',    icon: ShieldCheck,     permission: ['audit', 'read:own_clinic'] },
  { href: '/clinic-dashboard/subscription',  label: 'Subscription',  icon: CreditCard,      roles: ['clinic_admin', 'super_admin'], dividerBefore: true },
  { href: '/clinic-dashboard/settings',      label: 'Settings',      icon: Settings,        roles: ['clinic_admin', 'super_admin'] },
]

const PLAN_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  basic:      { label: 'Basic',      bg: 'rgba(107,114,128,0.15)', color: '#9CA3AF' },
  pro:        { label: 'Pro Plan',   bg: 'rgba(30,64,175,0.2)',    color: '#93C5FD' },
  enterprise: { label: 'Enterprise', bg: 'rgba(124,58,237,0.2)',   color: '#C4B5FD' },
}

function EcgMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Avatar({ name, size = 28 }: { name?: string; size?: number }) {
  const initials = name
    ? name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '?'
  return (
    <div
      style={{ width: size, height: size, fontSize: size < 36 ? 11 : 14 }}
      className="shrink-0 flex items-center justify-center rounded-full bg-blue-500/20 text-blue-300 font-bold"
    >
      {initials}
    </div>
  )
}

export function ClinicLayout() {
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const { unreadCount } = useWs()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const { data: stats } = useQuery<{ clinic_name: string | null; subscription_plan?: string }>({
    queryKey: ['clinic-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    staleTime: 120_000,
  })

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleNav = CLINIC_NAV.filter(item => {
    if (item.roles && user && !item.roles.includes(user.role)) return false
    if (item.permission && !can(item.permission[0], item.permission[1])) return false
    return true
  })

  const clinicName = stats?.clinic_name ?? 'Your Clinic'
  const plan = (stats as any)?.subscription_plan ?? 'basic'
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.basic

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F1F5F9' }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out',
          collapsed ? 'w-[64px]' : 'w-[240px]',
        )}
        style={{
          background: 'linear-gradient(180deg, #0F172A 0%, #0C1A2E 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Logo ──────────────────────────────────────────── */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex h-[64px] w-full items-center gap-3 px-4 transition-colors hover:bg-white/5 focus:outline-none"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            <EcgMark />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-white font-bold text-[13px] leading-none tracking-tight">MedAssist AI</p>
              <p
                className="truncate text-[11px] font-medium mt-[3px]"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                {clinicName}
              </p>
            </div>
          )}
          {!collapsed && (
            <ChevronRight
              className="h-3.5 w-3.5 shrink-0 text-white/20 rotate-180 transition-transform"
            />
          )}
        </button>

        {/* ── Plan badge ────────────────────────────────────── */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: planBadge.bg, color: planBadge.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: planBadge.color }} />
              {planBadge.label}
            </span>
          </div>
        )}

        {/* ── Nav ───────────────────────────────────────────── */}
        <nav className="flex-1 px-2 pb-2 space-y-[1px] overflow-y-auto overflow-x-hidden">
          {visibleNav.map(({ href, label, icon: Icon, end, dividerBefore }) => (
            <div key={href}>
              {dividerBefore && (
                <div className="mx-3 my-2 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }} />
              )}
              <NavLink
                to={href}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-[17px] w-[17px] shrink-0 transition-colors',
                        isActive ? 'text-blue-400' : 'group-hover:text-white/60',
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        {isActive && <span className="h-[6px] w-[6px] rounded-full bg-blue-400 shrink-0" />}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-3 space-y-1">
          {/* Switch to patient view */}
          <Link
            to="/dashboard"
            title={collapsed ? 'Patient view' : undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && <span className="truncate">Patient view</span>}
          </Link>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-1 py-1">
            <Avatar name={user?.full_name} />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-[11px] font-semibold truncate">{user?.full_name}</p>
                <p className="text-white/30 text-[10px] capitalize mt-[1px]">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top bar */}
        <div
          className="shrink-0 flex items-center justify-end gap-3 px-6 py-3"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', backgroundColor: '#F8FAFC' }}
        >
          <Link
            to="/notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-gray-200"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-extrabold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
