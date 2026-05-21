import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Calendar, Pill, BarChart2, ArrowRight,
  CheckCircle2, Zap, MapPin, Clock, Users,
  TrendingUp, Heart, Brain, Stethoscope, Star, Menu, X,
  ChevronRight, AlertTriangle, Info,
} from 'lucide-react'

// ── Fonts & base ──────────────────────────────────────────────────────────────
const INTER = "'Inter', system-ui, -apple-system, sans-serif"

// ── Scroll-triggered fade-in ─────────────────────────────────────────────────
function useFadeIn(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function FadeIn({ children, delay = 0, className = '', up = true }: {
  children: React.ReactNode; delay?: number; className?: string; up?: boolean
}) {
  const { ref, visible } = useFadeIn()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : up ? 'translateY(28px)' : 'translateY(8px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// ── Counter animation ─────────────────────────────────────────────────────────
function CountUp({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0)
  const { ref, visible } = useFadeIn()
  useEffect(() => {
    if (!visible) return
    const duration = 1800
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, target])
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
}

// ── Interactive triage ────────────────────────────────────────────────────────
const SYMPTOM_CHIPS = [
  { id: 'chest_pain',   label: 'Chest Pain',            tier: 3 },
  { id: 'diff_breath',  label: 'Difficulty Breathing',  tier: 3 },
  { id: 'high_fever',   label: 'High Fever',            tier: 2 },
  { id: 'headache',     label: 'Severe Headache',       tier: 2 },
  { id: 'fatigue',      label: 'Fatigue',               tier: 1 },
  { id: 'cough',        label: 'Cough',                 tier: 1 },
  { id: 'nausea',       label: 'Nausea',                tier: 1 },
  { id: 'sore_throat',  label: 'Sore Throat',           tier: 1 },
]

type TriageLevel = 'URGENT' | 'MODERATE' | 'MILD'
interface TriageResult {
  level: TriageLevel
  accent: string
  bg: string
  border: string
  icon: React.ElementType
  title: string
  recommendation: string
  action: string
  href: string
}

function computeTriage(ids: string[]): TriageResult | null {
  if (!ids.length) return null
  const chips = ids.map(id => SYMPTOM_CHIPS.find(c => c.id === id)!)
  const maxTier = Math.max(...chips.map(c => c.tier))
  const lowCount  = chips.filter(c => c.tier === 1).length

  if (maxTier >= 3) return {
    level: 'URGENT', accent: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5',
    icon: AlertTriangle,
    title: 'Seek Emergency Care Immediately',
    recommendation: 'Your symptoms may indicate a serious or life-threatening condition. Go to the nearest emergency clinic or call an ambulance now. Do not drive yourself.',
    action: 'Find Emergency Clinic', href: '/clinics',
  }
  if (maxTier >= 2 || lowCount >= 3 || (ids.includes('high_fever') && lowCount >= 1)) return {
    level: 'MODERATE', accent: '#D97706', bg: '#FFFBEB', border: '#FCD34D',
    icon: Info,
    title: 'See a Doctor Within 24 Hours',
    recommendation: 'Your symptoms suggest a condition that needs medical evaluation. Book an appointment with a clinic near you and monitor for any worsening.',
    action: 'Book Appointment', href: '/clinics',
  }
  return {
    level: 'MILD', accent: '#059669', bg: '#F0FDF4', border: '#86EFAC',
    icon: CheckCircle2,
    title: 'Likely Mild — Self-Care First',
    recommendation: 'Your symptoms appear manageable at home. Rest well, stay hydrated, and take over-the-counter medication if needed. Seek care if symptoms worsen or persist beyond 48 hours.',
    action: 'Order Medicine', href: '/medicines',
  }
}

// ── Phone Mockup ──────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260, fontFamily: INTER }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: -40, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,64,175,0.35) 0%, transparent 70%)',
        filter: 'blur(30px)', zIndex: 0,
      }} />
      {/* Floating notification */}
      <div style={{
        position: 'absolute', top: 24, right: -56, zIndex: 10, minWidth: 160,
        background: 'white', borderRadius: 14, padding: '8px 12px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.18)', border: '1px solid #f1f0ec',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#065f46' }}>Booking Confirmed</span>
        </div>
        <p style={{ fontSize: 9, color: '#6b7280', lineHeight: 1.4 }}>Dr. Kamau Njoroge · Today 10:30 AM</p>
      </div>
      {/* Phone frame */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 260, height: 520, borderRadius: 40,
        background: '#111827', border: '7px solid #1f2937',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        {/* Notch */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, background: '#111827', borderRadius: '0 0 16px 16px', zIndex: 10 }} />
        {/* Screen */}
        <div style={{ background: '#f4f3ef', height: '100%', overflow: 'hidden', paddingTop: 28 }}>
          {/* Header */}
          <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, background: '#0d1f10', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 8 }}>
                  <svg viewBox="0 0 22 22" fill="none"><path d="M1 11L6 11L8 7L11 16L13 6L15 11L21 11" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>MedAssist</span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#374151' }}>J</span>
            </div>
          </div>
          {/* Content */}
          <div style={{ padding: '0 12px', overflow: 'hidden' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', marginBottom: 10 }}>Good morning, Jane · Nairobi</p>
            {/* Triage result */}
            <div style={{ background: '#FEF3C7', borderRadius: 14, padding: '10px 12px', marginBottom: 8, border: '1px solid #FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: 8, fontWeight: 800, color: '#92400E', letterSpacing: '0.05em' }}>MODERATE CONCERN</span>
              </div>
              <p style={{ fontSize: 8.5, color: '#78350F', lineHeight: 1.5 }}>Consider seeing a doctor within 24 hours. Symptoms suggest possible infection.</p>
            </div>
            {/* Nearby clinics */}
            <div style={{ background: 'white', borderRadius: 14, padding: '10px 12px', marginBottom: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#0f172a', marginBottom: 7 }}>Nearby Clinics</p>
              {[['Westlands Medical', '0.8 km', 1500], ['City Health Clinic', '1.2 km', 1200]].map(([name, dist, fee]) => (
                <div key={String(name)} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 24, height: 24, background: '#EFF6FF', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, background: '#1E40AF', borderRadius: 2 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 8.5, fontWeight: 600, color: '#0f172a' }}>{name}</p>
                    <p style={{ fontSize: 7.5, color: '#9ca3af' }}>{dist} · KES {Number(fee).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div style={{ background: '#1E40AF', borderRadius: 9, padding: '6px 10px', textAlign: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: 'white' }}>Book Appointment</span>
              </div>
            </div>
            {/* Bottom nav */}
            <div style={{ display: 'flex', justifyContent: 'space-around', background: 'white', borderRadius: 14, padding: '7px 4px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              {[{ l: 'Home', a: true }, { l: 'Clinics', a: false }, { l: 'Rx', a: false }, { l: 'Me', a: false }].map(({ l, a }) => (
                <div key={l} style={{ textAlign: 'center', padding: '0 8px' }}>
                  <div style={{ width: '100%', height: 2.5, background: a ? '#1E40AF' : '#e5e7eb', borderRadius: 2, marginBottom: 2 }} />
                  <span style={{ fontSize: 7, color: a ? '#1E40AF' : '#9ca3af', fontWeight: a ? 700 : 400 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Mockup ──────────────────────────────────────────────────────────
function DashboardMockup() {
  const bars = [45, 62, 58, 71, 80, 76, 90]
  return (
    <div style={{
      background: '#1e293b', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.4)', fontFamily: INTER,
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#0f172a', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 6, padding: '4px 10px', margin: '0 10px' }}>
          <span style={{ fontSize: 9, color: '#4b5563' }}>app.medassist.co.ke/clinic-dashboard</span>
        </div>
      </div>
      {/* Dashboard content */}
      <div style={{ display: 'flex', height: 280 }}>
        {/* Sidebar */}
        <div style={{ width: 44, background: '#0d1f10', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {[BarChart2, Calendar, Activity, Pill].map((Icon, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? 'rgba(74,222,128,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={13} color={i === 0 ? '#4ade80' : 'rgba(255,255,255,0.25)'} />
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, background: '#f4f3ef', padding: 14, overflow: 'hidden' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: "Today's Appts", value: '12', color: '#1E40AF' },
              { label: 'Week Revenue', value: 'KES 48k', color: '#059669' },
              { label: 'Completion', value: '87%', color: '#7C3AED' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'white', borderRadius: 10, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: 8, color: '#9ca3af', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color }}>{value}</p>
              </div>
            ))}
          </div>
          {/* Mini chart */}
          <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 8.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Weekly Appointments</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: i === bars.length - 1 ? '#1E40AF' : '#DBEAFE', height: `${(h / 100) * 100}%`, transition: 'all 0.5s ease' }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const scroll = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      fontFamily: INTER,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 32, height: 32, background: '#0d1f10', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M1 11L6 11L8 7L11 16L13 6L15 11L21 11" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: scrolled ? '#0f172a' : 'white', letterSpacing: '-0.02em' }}>MedAssist AI</span>
        </button>
        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {[['Features', 'solution'], ['How It Works', 'how-it-works'], ['For Clinics', 'for-clinics'], ['Metrics', 'traction']].map(([label, id]) => (
            <button key={id} onClick={() => scroll(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 14, fontWeight: 500, color: scrolled ? '#374151' : 'rgba(255,255,255,0.8)',
              transition: 'color 0.2s',
            }}>{label}</button>
          ))}
        </div>
        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="hidden md:flex">
          <Link to="/login" style={{
            fontSize: 13, fontWeight: 600, color: scrolled ? '#374151' : 'rgba(255,255,255,0.8)',
            textDecoration: 'none', padding: '8px 16px', borderRadius: 10,
            border: `1px solid ${scrolled ? '#e5e7eb' : 'rgba(255,255,255,0.2)'}`,
            transition: 'all 0.2s',
          }}>Sign in</Link>
          <Link to="/register" style={{
            fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none',
            padding: '8px 18px', borderRadius: 10, background: '#1E40AF',
            boxShadow: '0 2px 8px rgba(30,64,175,0.4)', transition: 'all 0.2s',
          }}>Get Started</Link>
        </div>
        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#374151' : 'white', padding: 4 }} className="flex md:hidden">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: 'white', borderTop: '1px solid #f1f0ec', padding: '16px 24px 20px' }}>
          {[['Features', 'solution'], ['How It Works', 'how-it-works'], ['For Clinics', 'for-clinics'], ['Metrics', 'traction']].map(([label, id]) => (
            <button key={id} onClick={() => scroll(id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 500, color: '#374151', padding: '10px 0', borderBottom: '1px solid #f8f7f4' }}>{label}</button>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link to="/login" style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#374151', textDecoration: 'none', padding: '10px', borderRadius: 10, border: '1px solid #e5e7eb' }}>Sign in</Link>
            <Link to="/register" style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'white', textDecoration: 'none', padding: '10px', borderRadius: 10, background: '#1E40AF' }}>Get Started</Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Main LandingPage ──────────────────────────────────────────────────────────
export function LandingPage() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [triageResult, setTriageResult] = useState<TriageResult | null>(null)
  const [investorEmail, setInvestorEmail] = useState('')
  const [deckSent, setDeckSent] = useState(false)

  function toggleSymptom(id: string) {
    setTriageResult(null)
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  function runTriage() {
    if (!selectedSymptoms.length) return
    setAnalyzing(true)
    setTriageResult(null)
    setTimeout(() => {
      setAnalyzing(false)
      setTriageResult(computeTriage(selectedSymptoms))
    }, 1200)
  }

  function handleDeckRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!investorEmail) return
    setDeckSent(true)
  }

  const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' }

  return (
    <div style={{ fontFamily: INTER, background: 'white', color: '#0f172a', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #080f20 0%, #0f1e3d 40%, #132c5e 70%, #1a3a7a 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 68,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(30,64,175,0.2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ ...W, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', padding: '80px 24px' }}>
          {/* Left */}
          <div>
            {/* Eyebrow */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)',
              borderRadius: 100, padding: '6px 14px', marginBottom: 28,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#4ade80', letterSpacing: '0.04em' }}>Kenya-First Health Tech · Series A</span>
            </div>

            <h1 style={{
              fontSize: 'clamp(36px, 5vw, 62px)', fontWeight: 900,
              color: 'white', lineHeight: 1.08, letterSpacing: '-0.03em', marginBottom: 24,
            }}>
              AI-Powered Healthcare<br />
              <span style={{ color: '#60a5fa' }}>Access for Every Kenyan</span>
            </h1>

            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: 40, maxWidth: 480 }}>
              MedAssist AI connects patients with clinics through intelligent triage, instant appointment booking, and seamless medicine ordering — all via M-Pesa.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#1E40AF', color: 'white', textDecoration: 'none',
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                boxShadow: '0 4px 20px rgba(30,64,175,0.5)', transition: 'all 0.2s',
              }}>
                Check Your Symptoms <ArrowRight size={16} />
              </Link>
              <button onClick={() => document.getElementById('for-clinics')?.scrollIntoView({ behavior: 'smooth' })} style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.18)',
                padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                For Clinics <ChevronRight size={16} />
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['Rule-Based AI', 'HIPAA Aware', 'M-Pesa Ready', 'Kenya-First'].map(badge => (
                <div key={badge} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 100, padding: '5px 12px',
                }}>
                  <CheckCircle2 size={11} color="rgba(74,222,128,0.9)" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM ───────────────────────────────────────────────────── */}
      <section id="problem" style={{ background: 'white', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <AlertTriangle size={12} color="#DC2626" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', letterSpacing: '0.06em', textTransform: 'uppercase' }}>The Problem</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Healthcare Access in Kenya is Broken
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
                Millions of Kenyans face critical barriers to basic healthcare. The status quo is failing.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { stat: '73%', desc: 'of Kenyans live more than 5km from a clinic', icon: MapPin, color: '#DC2626', bg: '#FEF2F2' },
              { stat: '4.5h', desc: 'average wait time at public hospitals in Nairobi', icon: Clock, color: '#D97706', bg: '#FFFBEB' },
              { stat: '1:10k', desc: 'doctor-to-patient ratio in rural Kenya', icon: Users, color: '#7C3AED', bg: '#F5F3FF' },
            ].map(({ stat, desc, icon: Icon, color, bg }, i) => (
              <FadeIn key={stat} delay={i * 0.12}>
                <div style={{
                  background: 'white', borderRadius: 20, padding: '32px 28px',
                  border: '1px solid #f1f0ec', boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s', cursor: 'default',
                }}>
                  <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <Icon size={20} color={color} />
                  </div>
                  <p style={{ fontSize: 52, fontWeight: 900, color, lineHeight: 1, letterSpacing: '-0.03em', marginBottom: 12 }}>{stat}</p>
                  <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.5, fontWeight: 500 }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.4}>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 32 }}>
              Source: Kenya Health Policy Framework · Ministry of Health, 2023
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 3. SOLUTION ──────────────────────────────────────────────────── */}
      <section id="solution" style={{ background: '#EFF6FF', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <Zap size={12} color="#1E40AF" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>The Solution</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                MedAssist AI Changes Everything
              </h2>
              <p style={{ fontSize: 17, color: '#4b5563', maxWidth: 540, margin: '0 auto' }}>
                One platform connecting every Kenyan with quality healthcare — intelligent, instant, and affordable.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { icon: Brain, title: 'AI Symptom Triage', desc: 'Know if you need a doctor in 60 seconds. Our rule-based engine analyzes your symptoms and gives clear, safe guidance — not a diagnosis.', color: '#7C3AED', bg: '#F5F3FF', badge: 'Core Feature' },
              { icon: Calendar, title: 'Smart Appointment Booking', desc: 'Book clinic appointments without a single phone call. See real-time availability, pick your doctor, and pay with M-Pesa.', color: '#1E40AF', bg: '#EFF6FF', badge: 'Live' },
              { icon: Pill, title: 'OTC Medicine Ordering', desc: 'Order genuine OTC medicines from verified pharmacies in your area. Delivery or clinic pickup — your choice.', color: '#059669', bg: '#F0FDF4', badge: 'Live' },
              { icon: BarChart2, title: 'Clinic Management SaaS', desc: 'Full-featured dashboard for clinic admins — appointments, revenue analytics, patient data, subscription management.', color: '#D97706', bg: '#FFFBEB', badge: 'For Clinics' },
            ].map(({ icon: Icon, title, desc, color, bg, badge }, i) => (
              <FadeIn key={title} delay={i * 0.1}>
                <div style={{
                  background: 'white', borderRadius: 20, padding: '28px', border: '1px solid #e0eeff',
                  boxShadow: '0 4px 24px rgba(30,64,175,0.06)', height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: bg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={color} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 100, padding: '4px 10px', border: `1px solid ${bg}` }}>{badge}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: 'white', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 72 }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                From Symptoms to Care in 3 Steps
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>No waiting rooms. No phone tag. Just fast, guided access to care.</p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, position: 'relative' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: 52, left: '17%', right: '17%', height: 2, background: 'linear-gradient(90deg, #DBEAFE, #1E40AF, #DBEAFE)', zIndex: 0, borderRadius: 1 }} />
            {[
              { step: '01', icon: Activity, title: 'Describe Your Symptoms', desc: 'Select or type your symptoms into the AI triage engine. Takes under 60 seconds.', color: '#1E40AF', bg: '#EFF6FF' },
              { step: '02', icon: Stethoscope, title: 'Get Guidance + Book', desc: 'Receive a triage result with clear next steps. Book a clinic appointment directly if needed.', color: '#7C3AED', bg: '#F5F3FF' },
              { step: '03', icon: Heart, title: 'Pick Up or Get Delivery', desc: 'Collect prescribed medicines from a verified pharmacy or have them delivered to your door.', color: '#059669', bg: '#F0FDF4' },
            ].map(({ step, icon: Icon, title, desc, color, bg }, i) => (
              <FadeIn key={step} delay={i * 0.15}>
                <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 80, height: 80, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: `3px solid white`, boxShadow: `0 0 0 3px ${bg}, 0 8px 24px rgba(0,0,0,0.08)` }}>
                    <Icon size={28} color={color} />
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#9ca3af', letterSpacing: '0.08em' }}>STEP {step}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, maxWidth: 260, margin: '0 auto' }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. AI TRIAGE ─────────────────────────────────────────────────── */}
      <section id="ai-triage" style={{ background: '#F0FDF4', padding: '100px 0' }}>
        <div style={{ ...W, maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Try It Live</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Try the AI Triage Engine →
              </h2>
              <p style={{ fontSize: 16, color: '#374151' }}>Select any symptoms you're experiencing and get an instant assessment.</p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div style={{ background: 'white', borderRadius: 24, padding: '36px', boxShadow: '0 8px 48px rgba(5,150,105,0.1)', border: '1px solid #D1FAE5' }}>
              {/* Symptom chips */}
              <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Select your symptoms</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
                {SYMPTOM_CHIPS.map(({ id, label, tier }) => {
                  const sel = selectedSymptoms.includes(id)
                  const urgentColor = tier === 3 ? '#DC2626' : tier === 2 ? '#D97706' : '#1E40AF'
                  return (
                    <button
                      key={id}
                      onClick={() => toggleSymptom(id)}
                      style={{
                        padding: '9px 18px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        border: `1.5px solid ${sel ? urgentColor : '#e5e7eb'}`,
                        background: sel ? `${urgentColor}18` : 'white',
                        color: sel ? urgentColor : '#6b7280',
                        transition: 'all 0.2s',
                        boxShadow: sel ? `0 2px 12px ${urgentColor}22` : 'none',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Analyse button */}
              <button
                onClick={runTriage}
                disabled={!selectedSymptoms.length || analyzing}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  background: selectedSymptoms.length ? '#059669' : '#e5e7eb',
                  color: selectedSymptoms.length ? 'white' : '#9ca3af',
                  border: 'none', cursor: selectedSymptoms.length ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', boxShadow: selectedSymptoms.length ? '0 4px 16px rgba(5,150,105,0.35)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {analyzing ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: 'white', animation: 'spin 0.8s linear infinite' }} />
                    Analyzing symptoms…
                  </>
                ) : (
                  <><Activity size={16} /> Analyze Symptoms</>
                )}
              </button>

              {/* Result */}
              {triageResult && (
                <div style={{
                  marginTop: 24, borderRadius: 16, padding: '20px 24px',
                  background: triageResult.bg, border: `1.5px solid ${triageResult.border}`,
                  animation: 'fadeIn 0.4s ease',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <triageResult.icon size={20} color={triageResult.accent} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: triageResult.accent, letterSpacing: '0.05em' }}>
                      {triageResult.level}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{triageResult.title}</h3>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 16 }}>{triageResult.recommendation}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Link to="/register" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                      padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: triageResult.accent, color: 'white',
                      boxShadow: `0 2px 12px ${triageResult.accent}40`,
                    }}>
                      {triageResult.action} <ArrowRight size={14} />
                    </Link>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>Sign up to save your triage history</p>
                  </div>
                </div>
              )}

              {!triageResult && !analyzing && selectedSymptoms.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
                  Select one or more symptoms above, then click Analyze
                </p>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 20 }}>
              This is guidance only, not a medical diagnosis. Always consult a licensed clinician for medical decisions.
            </p>
          </FadeIn>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      </section>

      {/* ── 6. FOR CLINICS ───────────────────────────────────────────────── */}
      <section id="for-clinics" style={{ background: '#080f1f', padding: '100px 0' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
          {/* Left */}
          <FadeIn>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 24 }}>
                <Stethoscope size={12} color="#4ade80" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase' }}>For Clinics</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20 }}>
                Built for Kenyan Clinics
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36 }}>
                Give your clinic a modern operations hub. Manage appointments, track revenue, and grow your patient base — all from one dashboard.
              </p>
              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                {[
                  { icon: TrendingUp, label: 'More Bookings', desc: 'Appear in patient searches. Fill empty slots automatically.' },
                  { icon: Users, label: 'Better Patient Data', desc: 'Unified records, triage history, and appointment logs.' },
                  { icon: BarChart2, label: 'Revenue Analytics', desc: 'Track earnings, completion rates, and seasonal trends.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(74,222,128,0.12)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color="#4ade80" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 3 }}>{label}</p>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link to="/register" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#1E40AF', color: 'white', textDecoration: 'none',
                  padding: '13px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  boxShadow: '0 4px 20px rgba(30,64,175,0.5)',
                }}>
                  Get Your Clinic Listed <ArrowRight size={15} />
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex' }}>
                    {['#1E40AF', '#2563EB', '#3B82F6'].map((c, i) => (
                      <div key={c} style={{ width: 24, height: 24, borderRadius: '50%', background: c, border: '2px solid #080f1f', marginLeft: i ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 8, fontWeight: 800, color: 'white' }}>C</span>
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Join 50+ clinics on MedAssist</span>
                </div>
              </div>
            </div>
          </FadeIn>
          {/* Right — dashboard mockup */}
          <FadeIn delay={0.15}>
            <DashboardMockup />
          </FadeIn>
        </div>
      </section>

      {/* ── 7. TRACTION ──────────────────────────────────────────────────── */}
      <section id="traction" style={{ background: '#1E40AF', padding: '100px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ ...W, position: 'relative', zIndex: 1 }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 12 }}>
                Early Traction in Nairobi
              </h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)' }}>Real users, real clinics, real impact — building fast.</p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
            {[
              { target: 2400, suffix: '+', prefix: '', label: 'Triage Sessions', sub: 'Completed' },
              { target: 18, suffix: '', prefix: '', label: 'Clinics Onboarded', sub: 'Nairobi pilot' },
              { target: 1200000, suffix: '', prefix: 'KES ', label: 'Revenue Processed', sub: 'Via M-Pesa' },
              { target: 48, suffix: '/5', prefix: '', label: 'Patient Satisfaction', sub: 'Star rating' },
            ].map(({ target, suffix, prefix, label, sub }, i) => (
              <FadeIn key={label} delay={i * 0.1}>
                <div style={{ textAlign: 'center', padding: '0 16px' }}>
                  <div style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 10 }}>
                    <CountUp target={target === 48 ? 48 : target} suffix={target === 48 ? '/5' : suffix} prefix={target === 1200000 ? 'KES ' : prefix} />
                    {target === 48 && null}
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{sub}</p>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.5}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 48 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Beta metrics — Nairobi pilot, Q1 2026 · Seeking Series A</p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 8. TEAM ──────────────────────────────────────────────────────── */}
      <section id="team" style={{ background: 'white', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Built by Technologists Who Understand Africa
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
                Our team combines deep technical expertise with lived experience of Africa's healthcare challenges.
              </p>
            </div>
          </FadeIn>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { role: 'CEO & Founder', bg: '#EFF6FF', color: '#1E40AF', init: 'F', bio: 'Healthcare access advocate. Built 3 products in the East African market.' },
              { role: 'CTO', bg: '#F0FDF4', color: '#059669', init: 'T', bio: 'Full-stack engineer with 8 years in health-tech. Ex-Safaricom, ex-Twiga.' },
              { role: 'COO', bg: '#F5F3FF', color: '#7C3AED', init: 'O', bio: 'Operations and go-to-market. Previously scaled a telemedicine startup to 40k users.' },
            ].map(({ role, bg, color, init, bio }, i) => (
              <FadeIn key={role} delay={i * 0.1}>
                <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', border: '1px solid #f1f0ec', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', textAlign: 'center' }}>
                  <div style={{ width: 72, height: 72, background: bg, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: `3px solid ${color}22` }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color }}>{init}</span>
                  </div>
                  <div style={{ width: 80, height: 10, background: '#e5e7eb', borderRadius: 6, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{role}</p>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{bio}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. INVESTORS / PARTNERS ──────────────────────────────────────── */}
      <section id="investors" style={{ background: '#F8FAFC', padding: '80px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 12 }}>
                Backed by Kenya's Health Ecosystem
              </h2>
              <p style={{ fontSize: 15, color: '#6b7280' }}>Building with and for the institutions shaping African healthcare.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
              {['Nairobi Angel Network', 'Kenya Health Fund', 'Safaricom Spark', 'African Tech Ventures', 'AMREF Health', 'GIZ Digital Health'].map(name => (
                <div key={name} style={{
                  background: 'white', borderRadius: 12, padding: '14px 24px',
                  border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{name}</span>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 100, padding: '7px 16px' }}>
                <Star size={13} color="#D97706" fill="#D97706" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>Actively raising Series A — KES 80M target</span>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 10. FINAL CTA ─────────────────────────────────────────────────── */}
      <section id="cta" style={{ background: 'linear-gradient(135deg, #080f20 0%, #0f1e3d 50%, #132c5e 100%)', padding: '120px 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(circle, rgba(30,64,175,0.3) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ ...W, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <FadeIn>
            <div style={{ maxWidth: 620, margin: '0 auto' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 28 }}>
                <Heart size={12} color="#4ade80" fill="rgba(74,222,128,0.5)" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Investor Opportunity</span>
              </div>
              <h2 style={{ fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, color: 'white', letterSpacing: '-0.025em', lineHeight: 1.08, marginBottom: 20 }}>
                Kenya deserves better<br />healthcare access.<br />
                <span style={{ color: '#60a5fa' }}>Help us build it.</span>
              </h2>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 48 }}>
                We're raising Series A to expand beyond Nairobi. Join us in building the healthcare infrastructure that 55 million Kenyans need.
              </p>
              {deckSent ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 16, padding: '16px 28px' }}>
                  <CheckCircle2 size={20} color="#4ade80" />
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#4ade80' }}>Thank you — we'll be in touch within 24 hours.</span>
                </div>
              ) : (
                <form onSubmit={handleDeckRequest} style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="email"
                    placeholder="your@fund.com"
                    value={investorEmail}
                    onChange={e => setInvestorEmail(e.target.value)}
                    required
                    style={{
                      flex: '1 1 280px', maxWidth: 320, padding: '14px 20px', borderRadius: 12, fontSize: 14,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                      color: 'white', outline: 'none', fontFamily: INTER,
                    }}
                  />
                  <button type="submit" style={{
                    padding: '14px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                    background: '#1E40AF', color: 'white', border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(30,64,175,0.5)', fontFamily: INTER,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    Request Investor Deck <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 11. FOOTER ────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0d1f10', padding: '56px 0 36px', fontFamily: INTER }}>
        <div style={W}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M1 11L6 11L8 7L11 16L13 6L15 11L21 11" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>MedAssist AI</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 260 }}>
                AI-powered healthcare access for every Kenyan. Triage, book, and order — all in one place.
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>Nairobi, Kenya · 2026</p>
            </div>
            {/* Product */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Product</p>
              {['Symptom Triage', 'Clinic Finder', 'Book Appointment', 'Medicine Orders'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10, transition: 'color 0.2s' }}>{l}</Link>
              ))}
            </div>
            {/* For Clinics */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>For Clinics</p>
              {['Get Listed', 'Dashboard', 'Pricing', 'API Access'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>{l}</Link>
              ))}
            </div>
            {/* Company */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Company</p>
              {['About', 'Blog', 'Careers', 'Contact'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>{l}</Link>
              ))}
            </div>
          </div>
          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>© 2026 MedAssist AI · Nairobi, Kenya · All rights reserved</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Privacy Policy', 'Terms of Service', 'HIPAA Notice'].map(l => (
                <Link key={l} to="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{l}</Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
