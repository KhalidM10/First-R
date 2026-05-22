import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Building2, Users, ShieldAlert,
  Activity, Cpu, DollarSign, Settings, LogOut,
  ArrowLeft, ChevronRight, Terminal,
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
  danger?: boolean
}

const NAV: AdminNavItem[] = [
  { href: '/admin',            label: 'Overview',       icon: LayoutDashboard, end: true },
  { href: '/admin/clinics',    label: 'Clinics',         icon: Building2 },
  { href: '/admin/users',      label: 'Users',           icon: Users },
  { href: '/admin/audit',      label: 'Audit Log',       icon: ShieldAlert,    dividerBefore: true },
  { href: '/admin/triage',     label: 'Triage Data',     icon: Activity },
  { href: '/admin/system',     label: 'System Health',   icon: Cpu },
  { href: '/admin/financial',  label: 'Financial',       icon: DollarSign,     dividerBefore: true },
  { href: '/admin/settings',   label: 'Settings',        icon: Settings },
]

function EcgMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
        stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const { unreadCount } = useWs()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  function handleLogout() { logout(); navigate('/login') }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#0B1120' }}>
      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'flex flex-col shrink-0 select-none transition-all duration-300 ease-in-out',
          collapsed ? 'w-[60px]' : 'w-[232px]',
        )}
        style={{
          background: '#0F172A',
          borderRight: '1px solid rgba(99,102,241,0.12)',
        }}
      >
        {/* Logo */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="flex h-[60px] w-full items-center gap-3 px-4 transition-colors hover:bg-white/5 focus:outline-none"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <EcgMark />
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-white font-bold text-[13px] leading-none tracking-tight">MedAssist AI</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-[4px]" style={{ color: '#818CF8' }}>
                  Admin Console
                </p>
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-white/20 rotate-180 shrink-0" />
            </>
          )}
        </button>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 pb-3">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Super Admin
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 pb-2 space-y-[1px] overflow-y-auto overflow-x-hidden">
          {NAV.map(({ href, label, icon: Icon, end, dividerBefore }) => (
            <div key={href}>
              {dividerBefore && (
                <div className="mx-3 my-2 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              )}
              <NavLink
                to={href}
                end={end}
                title={collapsed ? label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300'
                      : 'text-white/35 hover:bg-white/5 hover:text-white/70',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn('h-[16px] w-[16px] shrink-0',
                      isActive ? 'text-indigo-400' : 'group-hover:text-white/60')} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{label}</span>
                        {isActive && <span className="h-[5px] w-[5px] rounded-full bg-indigo-400 shrink-0" />}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} className="p-3 space-y-1">
          <Link to="/dashboard" title={collapsed ? 'Back to app' : undefined}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-white/25 hover:bg-white/5 hover:text-white/50 transition-colors">
            <ArrowLeft className="h-[14px] w-[14px] shrink-0" />
            {!collapsed && <span className="truncate">Back to app</span>}
          </Link>

          <div className="flex items-center gap-2.5 px-1 py-1">
            <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold"
              style={{ backgroundColor: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
              {user?.full_name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-white/70 text-[11px] font-semibold truncate">{user?.full_name}</p>
                <div className="flex items-center gap-1 mt-[1px]">
                  <Terminal className="h-2.5 w-2.5 text-indigo-400" />
                  <p className="text-indigo-400/70 text-[10px]">super_admin</p>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleLogout} title={collapsed ? 'Sign out' : undefined}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-white/25 hover:bg-red-500/10 hover:text-red-400 transition-colors">
            <LogOut className="h-[14px] w-[14px] shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F8FAFC' }}>
        {/* Topbar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3"
          style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Internal
            </span>
            <span className="text-[11px] text-gray-400">MedAssist AI Platform Console v2</span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount} alerts
              </span>
            )}
            <span className="text-[11px] text-gray-400 font-mono">
              {new Date().toISOString().slice(0, 10)}
            </span>
          </div>
        </div>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
