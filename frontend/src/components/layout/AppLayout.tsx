import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Activity, BarChart2, Bell, Building2, Calendar, LayoutDashboard, LogOut, Pill, User } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { usePermissions } from '../../contexts/PermissionContext'
import { CLINIC_ROLES } from '../../types'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  /** If set, only render when can(resource, action) is true */
  permission?: [string, string]
  /** If set, only render for these roles */
  roles?: string[]
  /** If set, never render for these roles */
  excludeRoles?: string[]
}

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/triage',       label: 'Check Symptoms', icon: Activity,     excludeRoles: [...CLINIC_ROLES] },
  { href: '/clinics',      label: 'Find Clinics',   icon: Building2,    excludeRoles: [...CLINIC_ROLES] },
  { href: '/appointments', label: 'Appointments',   icon: Calendar,     permission: ['appointments', 'read:own'] },
  { href: '/medicines',      label: 'Medicines',      icon: Pill,         permission: ['orders', 'create'] },
  { href: '/notifications',  label: 'Notifications',  icon: Bell,         excludeRoles: [...CLINIC_ROLES] },
  { href: '/profile',        label: 'Profile',        icon: User },
]

function EcgMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
        stroke="#4ade80"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const visibleNav = ALL_NAV_ITEMS.filter((item) => {
    if (item.roles && user && !item.roles.includes(user.role)) return false
    if (item.excludeRoles && user && item.excludeRoles.includes(user.role)) return false
    if (item.permission && !can(item.permission[0], item.permission[1])) return false
    return true
  })

  const isClinicStaff = user ? CLINIC_ROLES.includes(user.role) : false

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f4f3ef' }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none',
          collapsed ? 'w-[64px]' : 'w-[216px]',
        )}
        style={{ backgroundColor: '#0d1f10' }}
      >
        {/* Logo */}
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
              <p className="text-green-400/70 text-[11px] font-medium mt-[3px]">AI Platform</p>
            </div>
          )}
        </button>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-3 pb-2 space-y-[2px]">
          {visibleNav.map(({ href, label, icon: Icon }) => {
            const active =
              pathname.startsWith(href) ||
              (href === '/clinics' && pathname.startsWith('/book'))
            return (
              <Link
                key={href}
                to={href}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-150 group',
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                )}
              >
                <Icon
                  className={cn(
                    'h-[17px] w-[17px] shrink-0 transition-colors',
                    active ? 'text-green-400' : 'group-hover:text-white/60',
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">{label}</span>
                    {active && <span className="h-[6px] w-[6px] rounded-full bg-green-400" />}
                  </>
                )}
              </Link>
            )
          })}

          {/* Clinic portal link — clinic staff only */}
          {isClinicStaff && (
            <>
              {!collapsed && (
                <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/20">
                  Clinic
                </p>
              )}
              {collapsed && <div className="my-2 mx-3 h-px bg-white/10" />}
              <Link
                to="/clinic-dashboard"
                title={collapsed ? 'Clinic Dashboard' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-150 group',
                  pathname.startsWith('/clinic-dashboard')
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/70',
                )}
              >
                <BarChart2
                  className={cn(
                    'h-[17px] w-[17px] shrink-0 transition-colors',
                    pathname.startsWith('/clinic-dashboard') ? 'text-green-400' : 'group-hover:text-white/60',
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="flex-1">Clinic Portal</span>
                    {pathname.startsWith('/clinic-dashboard') && (
                      <span className="h-[6px] w-[6px] rounded-full bg-green-400" />
                    )}
                  </>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-3">
          {!collapsed ? (
            <div className="flex items-center gap-2.5 px-1 mb-2">
              <Avatar name={user?.full_name} />
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-[11px] font-semibold truncate">{user?.full_name}</p>
                <p className="text-white/30 text-[11px] capitalize mt-[1px]">
                  {user?.role?.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
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

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
