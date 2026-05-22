import { createContext, useContext, useMemo } from 'react'
import { useAuthStore } from '../store/auth'

interface PermissionContextValue {
  /**
   * Check if the current user holds a specific permission.
   *
   * Usage:
   *   can('appointments', 'read')       → checks "appointments:read"
   *   can('appointments', 'read:own')   → checks "appointments:read:own"
   *   can('clinic', 'manage:doctors')   → checks "clinic:manage:doctors"
   */
  can: (resource: string, action: string) => boolean
  /** The raw permission name list from the auth store. */
  permissions: string[]
  /** True if this user has any clinic-staff role. */
  isClinicStaff: boolean
  /** True only for super_admin. */
  isSuperAdmin: boolean
}

const PermissionContext = createContext<PermissionContextValue>({
  can: () => false,
  permissions: [],
  isClinicStaff: false,
  isSuperAdmin: false,
})

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const permissions = useAuthStore((s) => s.permissions)
  const user = useAuthStore((s) => s.user)

  const value = useMemo<PermissionContextValue>(() => {
    const permSet = new Set(permissions)

    return {
      permissions,
      can: (resource, action) => permSet.has(`${resource}:${action}`),
      isClinicStaff: !!user && user.role !== 'patient',
      isSuperAdmin: user?.role === 'super_admin',
    }
  }, [permissions, user])

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions(): PermissionContextValue {
  return useContext(PermissionContext)
}
