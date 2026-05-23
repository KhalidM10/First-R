import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, Bell, Building2, Calendar, LayoutDashboard,
  LogOut, Pill, User,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/auth'
import { usePermissions } from '../../contexts/PermissionContext'
import { useWs } from '../../contexts/WebSocketContext'
import { CLINIC_ROLES } from '../../types'

/* ── Logo ── */
function Logo() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ background: 'var(--color-brand-light)' }}
      >
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path
            d="M1 11 L6 11 L8 7 L11 16 L13 6 L15 11 L21 11"
            stroke="var(--color-brand)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span
        className="hidden sm:block text-[15px] font-semibold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
      >
        MedAssist
        <span
          className="ml-1.5 inline-flex items-center px-1.5 py-px text-[9px] font-bold text-white rounded align-middle"
          style={{ backgroundColor: 'var(--color-brand)', letterSpacing: '0.06em', lineHeight: 1.8 }}
        >
          AI
        </span>
      </span>
    </Link>
  )
}

/* ── Initials avatar ── */
function Avatar({ name, size = 32 }: { name?: string; size?: number }) {
  const initials = name
    ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold select-none"
      style={{
        height: size, width: size,
        fontSize: size < 36 ? 11 : 13,
        background: 'var(--color-brand-light)',
        color: 'var(--color-brand)',
        border: '1.5px solid var(--color-brand-light)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {initials}
    </div>
  )
}

/* ── Navigation config ── */
interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  permission?: [string, string]
  excludeRoles?: string[]
}

const DESKTOP_NAV: NavItem[] = [
  { href: '/triage',       label: 'Check Symptoms',  icon: Activity,   excludeRoles: [...CLINIC_ROLES] },
  { href: '/clinics',      label: 'Find Clinics',    icon: Building2,  excludeRoles: [...CLINIC_ROLES] },
  { href: '/appointments', label: 'Appointments',    icon: Calendar,   permission: ['appointments', 'read:own'] },
  { href: '/medicines',    label: 'Medicines',       icon: Pill,       permission: ['orders', 'create'] },
]

const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard',    label: 'Home',        icon: LayoutDashboard },
  { href: '/triage',       label: 'Symptoms',    icon: Activity,   excludeRoles: [...CLINIC_ROLES] },
  { href: '/clinics',      label: 'Clinics',     icon: Building2,  excludeRoles: [...CLINIC_ROLES] },
  { href: '/appointments', label: 'Appointments',icon: Calendar,   permission: ['appointments', 'read:own'] },
  { href: '/profile',      label: 'Profile',     icon: User },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const { can } = usePermissions()
  const { unreadCount } = useWs()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  function isVisible(item: NavItem) {
    if (item.excludeRoles && user && item.excludeRoles.includes(user.role)) return false
    if (item.permission && !can(item.permission[0], item.permission[1])) return false
    return true
  }

  const visibleDesktopNav = DESKTOP_NAV.filter(isVisible)
  const visibleBottomNav  = BOTTOM_NAV.filter(isVisible)
  const isClinicStaff     = user ? CLINIC_ROLES.includes(user.role) : false

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-canvas)' }}>

      {/* ── Top navigation bar ── */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          height: 64,
        }}
      >
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-6">

          {/* Left: logo */}
          <Logo />

          {/* Center: desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {visibleDesktopNav.map(({ href, label }) => {
              const active = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  to={href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    color:           active ? 'var(--color-brand)'       : 'var(--color-text-secondary)',
                    backgroundColor: active ? 'var(--color-brand-light)' : 'transparent',
                  }}
                >
                  {label}
                </Link>
              )
            })}
            {isClinicStaff && (
              <Link
                to="/clinic-dashboard"
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
                style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--color-text-secondary)' }}
              >
                Clinic Portal
              </Link>
            )}
          </nav>

          {/* Right: bell + avatar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors duration-150"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span
                  className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px] rounded-full"
                  style={{ backgroundColor: 'var(--color-danger)' }}
                />
              )}
            </button>

            <div className="h-5 w-px mx-1" style={{ backgroundColor: 'var(--color-border)' }} />

            {/* Avatar dropdown (simple click to profile) */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150"
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar name={user?.full_name} size={28} />
              <span
                className="hidden sm:block text-[13px] font-medium"
                style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)' }}
              >
                {user?.full_name?.split(' ')[0]}
              </span>
            </button>

            {/* Sign out (desktop, subtle) */}
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
              title="Sign out"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--color-danger-light)'
                e.currentTarget.style.color = 'var(--color-danger)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--color-text-tertiary)'
              }}
            >
              <LogOut className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main
        className="mx-auto max-w-6xl px-6 pb-28 md:pb-8"
        style={{ paddingTop: 32 }}
      >
        {children}
      </main>

      {/* ── Mobile bottom navigation ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 md:hidden z-40"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          height: 64,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
        }}
      >
        <div
          className={cn(
            'h-full grid',
            visibleBottomNav.length === 5 ? 'grid-cols-5' : 'grid-cols-4',
          )}
        >
          {visibleBottomNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                to={href}
                className="flex flex-col items-center justify-center gap-1 transition-colors duration-150"
                style={{
                  color: active ? 'var(--color-brand)' : 'var(--color-text-tertiary)',
                }}
              >
                <Icon className="h-5 w-5" />
                <span
                  className="text-[10px]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
