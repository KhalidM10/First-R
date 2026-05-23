import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, Calendar, BarChart2, CreditCard,
  LogOut, Users, Package, ShieldCheck, Stethoscope,
  Star, Bell, Settings, Store, ChevronLeft, ChevronRight,
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
  basic:      { label: 'Basic',      bg: 'rgba(255,255,255,0.06)',  color: 'rgba(255,255,255,0.35)' },
  pro:        { label: 'Pro',        bg: 'rgba(34,197,94,0.12)',    color: '#4ade80' },
  enterprise: { label: 'Enterprise', bg: 'rgba(124,58,237,0.15)',   color: '#c4b5fd' },
}

function EcgLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
        stroke="#22c55e"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UserAvatar({ name, size = 'sm' }: { name?: string; size?: 'sm' | 'md' }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  const dim = size === 'sm' ? 'h-7 w-7 text-[11px]' : 'h-9 w-9 text-[13px]'
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-semibold select-none', dim)}
      style={{ background: 'linear-gradient(135deg, #22c55e22, #16a34a33)', color: '#16a34a', border: '1px solid #22c55e30' }}
    >
      {initials}
    </div>
  )
}

export function ClinicLayout() {
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const { unreadCount } = useWs()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const { data: stats } = useQuery<{ clinic_name: string | null; subscription_plan?: string }>({
    queryKey: ['clinic-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
    staleTime: 120_000,
  })

  const clinicName = stats?.clinic_name ?? 'Clinic Portal'
  const plan = (stats as any)?.subscription_plan ?? 'basic'
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.basic

  const visibleNav = CLINIC_NAV.filter(item => {
    if (item.roles && user && !item.roles.includes(user.role)) return false
    if (item.permission && !can(item.permission[0], item.permission[1])) return false
    return true
  })

  const rawPage = pathname.replace('/clinic-dashboard', '').replace(/^\//, '') || 'overview'
  const pageLabel = rawPage.charAt(0).toUpperCase() + rawPage.slice(1).replace(/-/g, ' ')

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'relative flex flex-col shrink-0 select-none transition-[width] duration-300 ease-in-out',
          collapsed ? 'w-[60px]' : 'w-[232px]',
        )}
        style={{ background: '#0C0E12', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div
          className="flex h-[58px] items-center px-4 gap-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <EcgLogo />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white text-[13.5px] font-semibold tracking-[-0.02em] leading-none">MedAssist</p>
              <p className="text-[10.5px] font-medium mt-[3px] opacity-70 truncate" style={{ color: '#22c55e' }}>
                {clinicName}
              </p>
            </div>
          )}
        </div>

        {/* Plan badge */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: planBadge.bg, color: planBadge.color }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: planBadge.color }} />
              {planBadge.label}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2 pb-2">
          {visibleNav.map(({ href, label, icon: Icon, end, dividerBefore }) => (
            <div key={href}>
              {dividerBefore && <div className="mx-2.5 my-2 h-px bg-white/[0.07]" />}
              <NavLink
                to={href}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-lg px-2.5 py-[8.5px] mb-[2px] text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'text-white bg-white/[0.08]'
                      : 'text-white/40 hover:text-white/75 hover:bg-white/[0.04]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#22c55e]" />
                    )}
                    <Icon
                      className={cn(
                        'h-[16px] w-[16px] shrink-0 transition-colors',
                        isActive ? 'text-[#22c55e]' : 'text-white/35 group-hover:text-white/60',
                      )}
                    />
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* User + Collapse */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-2">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 mb-1">
              <UserAvatar name={user?.full_name} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-white/80 truncate leading-tight">{user?.full_name}</p>
                <p className="text-[11px] text-white/30 capitalize mt-[2px] truncate">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-1 py-1">
              <UserAvatar name={user?.full_name} />
            </div>
          )}

          <button
            onClick={() => { logout(); navigate('/login') }}
            title={collapsed ? 'Sign out' : undefined}
            className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-[15px] w-[15px] shrink-0" />
            {!collapsed && 'Sign out'}
          </button>

          <button
            onClick={() => setCollapsed(v => !v)}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-1.5 text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight className="h-3.5 w-3.5" />
              : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header
          className="flex h-[58px] shrink-0 items-center justify-between px-6 bg-white"
          style={{ borderBottom: '1px solid #E2E8F0' }}
        >
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-slate-400">Clinic</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700 capitalize">{pageLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 h-[7px] w-[7px] rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>
            <div className="w-px h-5 bg-slate-200" />
            <UserAvatar name={user?.full_name} size="sm" />
            <span className="text-[13px] font-medium text-slate-700 hidden sm:block">
              {user?.full_name?.split(' ')[0]}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-7">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
