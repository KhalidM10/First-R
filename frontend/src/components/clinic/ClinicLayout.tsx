import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, BarChart2, CreditCard,
  ArrowLeft, LogOut, Users, Package, ShieldCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { usePermissions } from '../../contexts/PermissionContext'

interface ClinicNavItem {
  href: string
  label: string
  icon: React.ElementType
  end?: boolean
  /** Only show when user holds this permission */
  permission?: [string, string]
  /** Only show for these roles */
  roles?: string[]
}

const CLINIC_NAV: ClinicNavItem[] = [
  {
    href: '/clinic-dashboard',
    label: 'Overview',
    icon: LayoutDashboard,
    end: true,
  },
  {
    href: '/clinic-dashboard/appointments',
    label: 'Appointments',
    icon: Calendar,
    permission: ['appointments', 'read'],
  },
  {
    href: '/clinic-dashboard/analytics',
    label: 'Analytics',
    icon: BarChart2,
    permission: ['analytics', 'read:basic'],
  },
  {
    href: '/clinic-dashboard/patients',
    label: 'Patients',
    icon: Users,
    permission: ['patients', 'read'],
  },
  {
    href: '/clinic-dashboard/orders',
    label: 'Orders',
    icon: Package,
    permission: ['orders', 'read:clinic'],
  },
  {
    href: '/clinic-dashboard/subscription',
    label: 'Subscription',
    icon: CreditCard,
    roles: ['clinic_admin', 'super_admin'],
  },
  {
    href: '/clinic-dashboard/audit',
    label: 'Audit Logs',
    icon: ShieldCheck,
    permission: ['audit', 'read:own_clinic'],
  },
]

function EcgMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
        stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

function Avatar({ name }: { name?: string }) {
  const initials = name ? name[0].toUpperCase() : '?'
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-xs font-bold">
      {initials}
    </div>
  )
}

export function ClinicLayout() {
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleNav = CLINIC_NAV.filter((item) => {
    if (item.roles && user && !item.roles.includes(user.role)) return false
    if (item.permission && !can(item.permission[0], item.permission[1])) return false
    return true
  })

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f4f3ef' }}>
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out',
          collapsed ? 'w-[64px]' : 'w-[216px]',
        )}
        style={{ backgroundColor: '#0d1f10' }}
      >
        {/* Logo / toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex h-[60px] w-full items-center gap-3 px-[18px] transition-colors hover:bg-white/5 focus:outline-none"
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)' }}
          >
            <EcgMark />
          </div>
          {!collapsed && (
            <div className="overflow-hidden text-left">
              <p className="text-white font-bold text-[13px] leading-none tracking-tight">MedAssist</p>
              <p className="text-green-400/70 text-[11px] font-medium mt-[3px]">Clinic Portal</p>
            </div>
          )}
        </button>

        {/* Role badge */}
        {!collapsed && user && (
          <div className="mx-3 mb-1 mt-0">
            <span className="inline-block rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400 capitalize">
              {user.role.replace(/_/g, ' ')}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 pt-2 pb-2 space-y-[2px]">
          {visibleNav.map(({ href, label, icon: Icon, end }) => (
            <NavLink
              key={href}
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
                      isActive ? 'text-green-400' : 'group-hover:text-white/60',
                    )}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{label}</span>
                      {isActive && <span className="h-[6px] w-[6px] rounded-full bg-green-400" />}
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-3 space-y-1">
          <Link
            to="/dashboard"
            title={collapsed ? 'Back to app' : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors"
          >
            <ArrowLeft className="h-[16px] w-[16px] shrink-0" />
            {!collapsed && 'Back to app'}
          </Link>

          {!collapsed && (
            <div className="flex items-center gap-2.5 px-1 py-1">
              <Avatar name={user?.full_name} />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-[11px] font-semibold truncate">{user?.full_name}</p>
                <p className="text-white/30 text-[11px] capitalize mt-[1px]">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center py-1">
              <Avatar name={user?.full_name} />
            </div>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Sign out' : undefined}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-white/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-[16px] w-[16px] shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
