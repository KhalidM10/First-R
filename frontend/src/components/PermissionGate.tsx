import { usePermissions } from '../contexts/PermissionContext'

interface PermissionGateProps {
  resource: string
  action: string
  /** Rendered when the user lacks the permission. Defaults to null. */
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Renders children only when the current user holds the specified permission.
 *
 * Usage:
 *   <PermissionGate resource="analytics" action="read:advanced">
 *     <AdvancedAnalytics />
 *   </PermissionGate>
 *
 *   <PermissionGate resource="users" action="invite" fallback={<p>No access</p>}>
 *     <InviteUserForm />
 *   </PermissionGate>
 */
export function PermissionGate({ resource, action, fallback = null, children }: PermissionGateProps) {
  const { can } = usePermissions()
  return can(resource, action) ? <>{children}</> : <>{fallback}</>
}
