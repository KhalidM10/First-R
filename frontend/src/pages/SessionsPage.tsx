import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Smartphone, Globe, MapPin, Clock, LogOut, ShieldAlert, Laptop,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { api } from '../lib/api'
import { cn } from '../lib/utils'

interface Session {
  id: string
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  city: string | null
  country: string | null
  created_at: string | null
  last_active_at: string | null
  expires_at: string | null
  is_active: boolean
}

function DeviceIcon({ type }: { type: string | null }) {
  if (type === 'mobile') return <Smartphone className="h-5 w-5" />
  if (type === 'tablet') return <Laptop className="h-5 w-5" />
  return <Monitor className="h-5 w-5" />
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 2) return 'Just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

export function SessionsPage() {
  const qc = useQueryClient()
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false)

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/sessions/').then((r) => r.data),
  })

  const revokeOne = useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const revokeOthers = useMutation({
    mutationFn: () => api.delete('/sessions/others'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      setConfirmRevokeAll(false)
    },
  })

  const currentSession = sessions[0] // most recent = current (sorted by last_active_at desc)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Active sessions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Devices currently signed in to your account. Revoke any you don&apos;t recognise.
        </p>
      </div>

      {/* Sign out all others */}
      {sessions.length > 1 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-700">
              {sessions.length - 1} other session{sessions.length > 2 ? 's' : ''} active on other devices.
            </p>
          </div>
          {confirmRevokeAll ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmRevokeAll(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <Button
                size="sm"
                variant="danger"
                loading={revokeOthers.isPending}
                onClick={() => revokeOthers.mutate()}
              >
                Confirm
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="shrink-0"
              onClick={() => setConfirmRevokeAll(true)}
            >
              Sign out all others
            </Button>
          )}
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {sessions.map((session, index) => {
            const isCurrent = session.id === currentSession?.id
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className={cn(
                  'rounded-xl border bg-white p-4 flex items-start gap-4',
                  isCurrent ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200',
                )}
              >
                {/* Device icon */}
                <div
                  className={cn(
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <DeviceIcon type={session.device_type} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {[session.browser, session.os].filter(Boolean).join(' on ') || 'Unknown device'}
                    </span>
                    {isCurrent && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        This device
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    {session.ip_address && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe className="h-3 w-3" />
                        {session.ip_address}
                      </span>
                    )}
                    {(session.city || session.country) && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {[session.city, session.country].filter(Boolean).join(', ')}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Active {relativeTime(session.last_active_at)}
                    </span>
                  </div>
                </div>

                {/* Revoke */}
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    loading={revokeOne.isPending && revokeOne.variables === session.id}
                    onClick={() => revokeOne.mutate(session.id)}
                    title="Revoke this session"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>

        {sessions.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 py-12 text-center">
            <Monitor className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No active sessions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
