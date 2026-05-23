import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, ShieldAlert,
  Activity, Cpu, DollarSign, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Terminal,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { useWs } from '../../contexts/WebSocketContext'

interface AdminNavItem {
  href: string
  label: string
  icon: React.ElementType
  end?: boolean
  dividerBefore?: boolean
}

const NAV: AdminNavItem[] = [
  { href: '/admin',            label: 'Overview',      icon: LayoutDashboard, end: true },
  { href: '/admin/clinics',    label: 'Clinics',       icon: Building2 },
  { href: '/admin/users',      label: 'Users',         icon: Users },
  { href: '/admin/audit',      label: 'Audit Log',     icon: ShieldAlert,    dividerBefore: true },
  { href: '/admin/triage',     label: 'Triage Data',   icon: Activity },
  { href: '/admin/system',     label: 'System Health', icon: Cpu },
  { href: '/admin/financial',  label: 'Financial',     icon: DollarSign,     dividerBefore: true },
  { href: '/admin/settings',   label: 'Settings',      icon: Settings },
]

const ACCENT = '#818CF8'

function EcgLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
        stroke={ACCENT}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function UserAvatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : 'A'
  return (
    <div
      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-[11px] font-semibold select-none"
      style={{ background: 'rgba(129,140,248,0.18)', color: ACCENT, border: '1px solid rgba(129,140,248,0.3)' }}
    >
      {initials}
    </div>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useWs()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const rawPage = pathname.replace('/admin', '').replace(/^\//, '') || 'overview'
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
            style={{ background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)' }}
          >
            <EcgLogo />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-white text-[13.5px] font-semibold tracking-[-0.02em] leading-none">MedAssist</p>
              <p
                className="text-[10.5px] font-bold uppercase tracking-widest mt-[3px]"
                style={{ color: ACCENT }}
              >
                Admin Console
              </p>
            </div>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Super Admin
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 pt-2 pb-2">
          {NAV.map(({ href, label, icon: Icon, end, dividerBefore }) => (
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
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{ backgroundColor: ACCENT }}
                      />
                    )}
                    <Icon
                      className={cn('h-[16px] w-[16px] shrink-0 transition-colors',
                        isActive ? '' : 'text-white/35 group-hover:text-white/60')}
                      style={isActive ? { color: ACCENT } : {}}
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
                <div className="flex items-center gap-1 mt-[2px]">
                  <Terminal className="h-2.5 w-2.5" style={{ color: ACCENT }} />
                  <p className="text-[10px]" style={{ color: `${ACCENT}99` }}>super_admin</p>
                </div>
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
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#DC2626' }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Internal
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="font-semibold text-slate-700 capitalize">{pageLabel}</span>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount} alerts
              </span>
            )}
            <div className="w-px h-5 bg-slate-200" />
            <UserAvatar name={user?.full_name} />
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
