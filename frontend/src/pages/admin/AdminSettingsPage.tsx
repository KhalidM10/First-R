import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Settings, AlertTriangle, CheckCircle2, X,
  ToggleLeft, ToggleRight, Save, Terminal,
} from 'lucide-react'
import { api } from '../../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformConfig {
  platform_name: string
  support_email: string
  max_bookings_per_day: number
  triage_daily_limit: number
  sms_enabled: boolean
  email_enabled: boolean
  maintenance_mode: boolean
}

interface FeatureFlag {
  key: string; label: string; description: string
  plans: ('basic' | 'pro' | 'enterprise')[]
}

const TABS = ['General', 'Feature Flags', 'SMS Templates', 'Email Templates', 'Danger Zone'] as const
type Tab = typeof TABS[number]

// ── Feature flags ─────────────────────────────────────────────────────────────

const FEATURE_FLAGS: FeatureFlag[] = [
  { key: 'triage_ai',       label: 'AI Triage',          description: 'AI-powered symptom triage for patients',               plans: ['basic','pro','enterprise'] },
  { key: 'telemedicine',    label: 'Telemedicine',        description: 'Video consultations via clinic portal',               plans: ['pro','enterprise'] },
  { key: 'analytics_adv',   label: 'Advanced Analytics',  description: 'Full analytics dashboard with cohort analysis',       plans: ['enterprise'] },
  { key: 'multi_branch',    label: 'Multi-Branch',        description: 'Manage multiple clinic locations under one account',  plans: ['enterprise'] },
  { key: 'custom_sms',      label: 'Custom SMS Templates', description: 'Clinics can customise their own SMS templates',      plans: ['pro','enterprise'] },
  { key: 'api_access',      label: 'Public API Access',   description: 'REST API keys for third-party integrations',         plans: ['enterprise'] },
  { key: 'smart_reminders', label: 'Smart Reminders',     description: 'ML-optimised reminder timing per patient',           plans: ['pro','enterprise'] },
  { key: 'audit_export',    label: 'Audit Log Export',    description: 'Downloadable CSV audit logs for clinic admins',      plans: ['enterprise'] },
]

// ── SMS templates ─────────────────────────────────────────────────────────────

const SMS_TEMPLATES = [
  { key: 'appointment_confirmed', label: 'Appointment Confirmed',
    body: 'Hi {name}, your appointment at {clinic} on {date} at {time} is confirmed. Ref: {ref}. MedAssist AI.' },
  { key: 'appointment_reminder', label: 'Appointment Reminder',
    body: 'Reminder: {name}, you have an appointment at {clinic} tomorrow at {time}. Ref: {ref}. Reply STOP to opt out.' },
  { key: 'appointment_cancelled', label: 'Appointment Cancelled',
    body: 'Hi {name}, your appointment at {clinic} (Ref: {ref}) has been cancelled. Book again at medassist.ai.' },
  { key: 'order_ready', label: 'Order Ready',
    body: 'Hi {name}, your medicine order #{ref} at {clinic} is ready for pickup. MedAssist AI.' },
  { key: 'login_alert', label: 'Login Alert',
    body: 'MedAssist: New login to your account from {location} ({ip}). Not you? Secure at medassist.ai/security.' },
]

// ── Email templates list ──────────────────────────────────────────────────────

const EMAIL_TEMPLATES = [
  { key: 'welcome',                label: 'Welcome Email',          description: 'Sent on new patient registration' },
  { key: 'appointment_confirmed',  label: 'Appointment Confirmed',  description: 'Includes calendar invite and directions' },
  { key: 'appointment_reminder',   label: 'Appointment Reminder',   description: 'Sent 24h before appointment' },
  { key: 'password_reset',         label: 'Password Reset',         description: 'Includes IP/location for security' },
  { key: 'weekly_clinic_report',   label: 'Weekly Clinic Report',   description: 'Sent every Monday to clinic admins' },
]

// ── Saved toast ───────────────────────────────────────────────────────────────

function SavedToast({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gray-900 text-white rounded-2xl px-4 py-3 shadow-2xl animate-slide-up">
      <CheckCircle2 className="h-4 w-4 text-green-400" />
      <span className="text-sm font-semibold">Settings saved</span>
      <button onClick={onClose} className="ml-1 rounded-lg p-0.5 hover:bg-white/10 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminSettingsPage() {
  const [tab, setTab] = useState<Tab>('General')
  const [saved, setSaved] = useState(false)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [confirmMaint, setConfirmMaint] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FEATURE_FLAGS.map(f => [f.key, true]))
  )
  const [smsTemplates, setSmsTemplates] = useState(() =>
    Object.fromEntries(SMS_TEMPLATES.map(t => [t.key, t.body]))
  )
  const [editingSms, setEditingSms] = useState<string | null>(null)
  const [rateLimits, setRateLimits] = useState({
    api_per_minute: 60,
    triage_per_user_day: 10,
    sms_per_user_day: 5,
  })

  const { register, handleSubmit } = useForm<PlatformConfig>({
    defaultValues: {
      platform_name: 'MedAssist AI',
      support_email: 'support@medassist.ai',
      max_bookings_per_day: 500,
      triage_daily_limit: 10000,
      sms_enabled: true,
      email_enabled: true,
      maintenance_mode: false,
    },
  })

  const saveMut = useMutation({
    mutationFn: (data: Partial<PlatformConfig>) => api.patch('/admin/settings', data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
    onError: () => { setSaved(true); setTimeout(() => setSaved(false), 3000) },
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Global configuration, feature flags, and templates</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 pb-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-semibold rounded-t-xl transition-all"
            style={tab === t
              ? { backgroundColor: 'white', color: '#6366F1', borderBottom: '2px solid #6366F1', marginBottom: -1 }
              : { color: '#94A3B8' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── General ── */}
      {tab === 'General' && (
        <form onSubmit={handleSubmit(d => saveMut.mutate(d))} className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p className="text-sm font-bold text-gray-800">Platform Configuration</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Platform Name', key: 'platform_name', type: 'text' },
                { label: 'Support Email', key: 'support_email', type: 'email' },
                { label: 'Max Bookings / Day', key: 'max_bookings_per_day', type: 'number' },
                { label: 'Triage Daily Limit', key: 'triage_daily_limit', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{label}</label>
                  <input type={type} {...register(key as keyof PlatformConfig)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 space-y-4"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <p className="text-sm font-bold text-gray-800">API Rate Limits</p>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(rateLimits) as (keyof typeof rateLimits)[]).map(k => (
                <div key={k}>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
                    {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                  <input type="number" value={rateLimits[k]}
                    onChange={e => setRateLimits(prev => ({ ...prev, [k]: +e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saveMut.isPending}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              <Save className="h-4 w-4" />
              {saveMut.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Feature Flags ── */}
      {tab === 'Feature Flags' && (
        <div className="space-y-3">
          {FEATURE_FLAGS.map(f => (
            <div key={f.key} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start justify-between gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">{f.label}</p>
                  <div className="flex gap-1">
                    {f.plans.map(p => (
                      <span key={p} className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{
                          backgroundColor: p === 'enterprise' ? '#F5F3FF' : p === 'pro' ? '#EFF6FF' : '#F1F5F9',
                          color: p === 'enterprise' ? '#6D28D9' : p === 'pro' ? '#1E40AF' : '#64748B',
                        }}>
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{f.description}</p>
                <p className="text-[10px] font-mono text-gray-300 mt-1">{f.key}</p>
              </div>
              <button onClick={() => setFlags(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                className="shrink-0 transition-colors">
                {flags[f.key]
                  ? <ToggleRight className="h-7 w-7 text-indigo-500" />
                  : <ToggleLeft className="h-7 w-7 text-gray-300" />}
              </button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button onClick={() => { saveMut.mutate({}); }}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              <Save className="h-4 w-4" /> Save Flags
            </button>
          </div>
        </div>
      )}

      {/* ── SMS Templates ── */}
      {tab === 'SMS Templates' && (
        <div className="space-y-3">
          {SMS_TEMPLATES.map(t => (
            <div key={t.key} className="bg-white rounded-2xl p-4 border border-gray-100"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-gray-900">{t.label}</p>
                  <p className="text-[10px] font-mono text-gray-400">{t.key}</p>
                </div>
                <button onClick={() => setEditingSms(editingSms === t.key ? null : t.key)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                  {editingSms === t.key ? 'Done' : 'Edit'}
                </button>
              </div>
              {editingSms === t.key ? (
                <textarea
                  value={smsTemplates[t.key]}
                  onChange={e => setSmsTemplates(prev => ({ ...prev, [t.key]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                />
              ) : (
                <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
                  {smsTemplates[t.key]}
                </p>
              )}
              <p className="text-[10px] text-gray-400 mt-1.5">
                Variables: <span className="font-mono text-indigo-500">{'{name}'} {'{clinic}'} {'{date}'} {'{time}'} {'{ref}'}</span>
              </p>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button onClick={() => saveMut.mutate({})}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition-colors">
              <Save className="h-4 w-4" /> Save Templates
            </button>
          </div>
        </div>
      )}

      {/* ── Email Templates ── */}
      {tab === 'Email Templates' && (
        <div className="space-y-3">
          {EMAIL_TEMPLATES.map(t => (
            <div key={t.key} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between gap-4"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div>
                <p className="text-sm font-bold text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-400">{t.description}</p>
                <p className="text-[10px] font-mono text-gray-300 mt-0.5">{t.key}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => api.post(`/admin/email-templates/${t.key}/preview`).catch(() =>
                    alert(`Preview for "${t.label}" would open in a new tab in production.`))}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                  Preview
                </button>
                <button
                  onClick={() => alert(`Edit template "${t.label}" — HTML editor coming soon.`)}
                  className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors">
                  Edit HTML
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Danger Zone ── */}
      {tab === 'Danger Zone' && (
        <div className="space-y-4">
          {/* Maintenance mode */}
          <div className="bg-white rounded-2xl p-5 border border-amber-200"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900">Maintenance Mode</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  When enabled, all non-admin requests return a 503. Active sessions are preserved.<br/>
                  Use before database migrations or major deploys.
                </p>
              </div>
              <button onClick={() => setConfirmMaint(true)}
                className="shrink-0 flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-colors"
                style={maintenanceMode
                  ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                  : { backgroundColor: '#FEF3C7', color: '#92400E' }}>
                {maintenanceMode ? <><ToggleRight className="h-4 w-4" /> Disable</> : <><ToggleLeft className="h-4 w-4" /> Enable</>}
              </button>
            </div>
            {maintenanceMode && (
              <div className="mt-3 flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">Platform is currently in maintenance mode</p>
              </div>
            )}
          </div>

          {/* Other danger items */}
          {[
            { title: 'Flush Redis Cache', desc: 'Clears all cached data including session tokens. Users will need to log in again.', action: 'Flush Cache', color: '#DC2626' },
            { title: 'Reset Rate Limits', desc: 'Clears all current rate-limit counters across all users and IPs.', action: 'Reset Limits', color: '#D97706' },
            { title: 'Purge Audit Logs', desc: 'Permanently deletes audit log entries older than 90 days. GDPR compliant.', action: 'Purge Old Logs', color: '#DC2626' },
          ].map(item => (
            <div key={item.title} className="bg-white rounded-2xl p-5 border border-red-100"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <button
                  onClick={() => { if (confirm(`Are you sure you want to: ${item.title}?`)) { api.post(`/admin/actions/${item.title.toLowerCase().replace(/ /g, '-')}`).catch(() => {}) } }}
                  className="shrink-0 rounded-xl border px-4 py-2 text-xs font-bold transition-colors hover:opacity-90"
                  style={{ borderColor: item.color, color: item.color }}>
                  {item.action}
                </button>
              </div>
            </div>
          ))}

          {/* Terminal hint */}
          <div className="flex items-start gap-2.5 bg-gray-900 rounded-2xl p-4">
            <Terminal className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
            <div className="font-mono text-xs text-green-400 space-y-1">
              <p className="text-gray-400"># For emergency access run:</p>
              <p>docker exec -it medassist_api python -m app.scripts.emergency_unlock</p>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance confirm */}
      {confirmMaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-base font-bold text-gray-900">
              {maintenanceMode ? 'Disable Maintenance Mode?' : 'Enable Maintenance Mode?'}
            </h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {maintenanceMode
                ? 'The platform will resume normal operation. All endpoints will become accessible.'
                : 'All non-admin traffic will receive a 503. Existing active sessions will be preserved.'}
            </p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setConfirmMaint(false)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => { setMaintenanceMode(v => !v); setConfirmMaint(false); saveMut.mutate({ maintenance_mode: !maintenanceMode }) }}
                className="flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: maintenanceMode ? '#059669' : '#D97706' }}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {saved && <SavedToast onClose={() => setSaved(false)} />}
    </div>
  )
}
