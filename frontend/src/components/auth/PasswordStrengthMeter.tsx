import { useMemo } from 'react'
import { cn } from '../../lib/utils'

interface Props {
  password: string
}

function score(pw: string): number {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

const LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
const BAR_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500']
const TEXT_COLORS = ['text-red-500', 'text-orange-500', 'text-yellow-600', 'text-blue-600', 'text-green-600']

export function PasswordStrengthMeter({ password }: Props) {
  const s = useMemo(() => score(password), [password])
  if (!password) return null

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all duration-300',
              i < s ? BAR_COLORS[s] : 'bg-gray-200',
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', TEXT_COLORS[s])}>{LABELS[s]}</p>
    </div>
  )
}
