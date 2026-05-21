import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Zap, Building2, Sparkles } from 'lucide-react'
import { api } from '../../lib/api'

interface ClinicStats {
  clinic_name: string | null
  total_appointments: number
  total_revenue_kes: number
}

interface Plan {
  id: 'basic' | 'pro' | 'enterprise'
  name: string
  price: number
  icon: React.ElementType
  accent: string
  tagline: string
  features: string[]
  cta: string
}

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 3500,
    icon: Building2,
    accent: '#6B7280',
    tagline: 'For small clinics getting started',
    features: [
      'Up to 50 appointments/month',
      'Basic appointment management',
      'Patient records',
      'Email support',
      'Clinic profile listing',
      'M-Pesa payment integration',
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 8500,
    icon: Zap,
    accent: '#1E40AF',
    tagline: 'For growing clinics — most popular',
    features: [
      'Unlimited appointments',
      'Advanced analytics dashboard',
      'OTC medicine marketplace',
      'Priority support (24h response)',
      'Custom booking page',
      'SMS appointment reminders',
      'Doctor management portal',
      'Revenue & trend reports',
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 18000,
    icon: Sparkles,
    accent: '#7C3AED',
    tagline: 'For hospital groups and chains',
    features: [
      'Everything in Pro',
      'Multi-branch management',
      'Dedicated account manager',
      'SLA guarantee (99.9% uptime)',
      'Custom EHR integrations',
      'White-label booking widget',
      'Bulk SMS & WhatsApp alerts',
      'NHIF integration support',
      'Quarterly business reviews',
    ],
    cta: 'Contact sales',
  },
]

export function ClinicSubscriptionPage() {
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data: stats } = useQuery<ClinicStats>({
    queryKey: ['clinic-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data),
  })

  function handleUpgrade(planId: string, cta: string) {
    if (cta === 'Contact sales') {
      window.open('mailto:sales@medassist.co.ke?subject=Enterprise Plan Inquiry', '_blank')
      return
    }
    setUpgrading(planId)
    setTimeout(() => {
      setUpgrading(null)
      setSuccess(planId)
      setTimeout(() => setSuccess(null), 4000)
    }, 1500)
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-sm text-gray-500 mt-1">
          {stats?.clinic_name ? `Managing plan for ${stats.clinic_name}` : 'Manage your clinic plan'}
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div
          className="rounded-2xl px-5 py-4 mb-6 flex items-center gap-3"
          style={{ backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}
        >
          <Check className="h-5 w-5 text-green-700 shrink-0" />
          <div>
            <p className="text-[14px] font-semibold text-green-800">
              Plan upgraded successfully
            </p>
            <p className="text-[12px] text-green-700 mt-0.5">
              Your new plan is active. Changes will reflect on next billing cycle.
            </p>
          </div>
        </div>
      )}

      {/* Current usage summary */}
      <div
        className="rounded-2xl p-5 mb-8 grid grid-cols-2 gap-6"
        style={{ backgroundColor: 'white', border: '1px solid #eceae4' }}
      >
        <div>
          <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wide">Total appointments</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.total_appointments?.toLocaleString() ?? '—'}</p>
        </div>
        <div>
          <p className="text-[12px] text-gray-400 font-medium uppercase tracking-wide">Total revenue generated</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats?.total_revenue_kes != null
              ? `KES ${stats.total_revenue_kes.toLocaleString()}`
              : '—'}
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          const isPopular = plan.id === 'pro'
          const isUpgrading = upgrading === plan.id

          return (
            <div
              key={plan.id}
              className="rounded-2xl flex flex-col overflow-hidden relative"
              style={{
                backgroundColor: 'white',
                border: isPopular ? `2px solid ${plan.accent}` : '1px solid #eceae4',
              }}
            >
              {isPopular && (
                <div
                  className="text-center text-[11px] font-bold py-1.5 tracking-wide uppercase"
                  style={{ backgroundColor: plan.accent, color: 'white' }}
                >
                  Most popular
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Plan header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.accent}18` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: plan.accent }} />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-gray-900">{plan.name}</p>
                    <p className="text-[11px] text-gray-400">{plan.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      KES {plan.price.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-gray-400">/month</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">Billed monthly · Cancel anytime</p>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div
                        className="mt-0.5 h-4 w-4 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${plan.accent}18` }}
                      >
                        <Check className="h-2.5 w-2.5" style={{ color: plan.accent }} />
                      </div>
                      <span className="text-[12px] text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleUpgrade(plan.id, plan.cta)}
                  disabled={isUpgrading}
                  className="w-full py-3 rounded-xl text-[13px] font-bold transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    backgroundColor: isPopular ? plan.accent : 'transparent',
                    color: isPopular ? 'white' : plan.accent,
                    border: isPopular ? 'none' : `1.5px solid ${plan.accent}`,
                  }}
                >
                  {isUpgrading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      Processing…
                    </span>
                  ) : plan.cta}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-center text-gray-400 mt-8">
        All plans include M-Pesa integration · Prices are exclusive of VAT ·
        Contact <span className="text-blue-700">support@medassist.co.ke</span> for custom pricing
      </p>
    </div>
  )
}
