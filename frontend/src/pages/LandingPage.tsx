import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, Calendar, Pill, BarChart2, ArrowRight,
  CheckCircle2, Zap, MapPin, Clock, Users,
  TrendingUp, Heart, Brain, Stethoscope, Star, Menu, X,
  ChevronRight, AlertTriangle, Shield, Smartphone,
  Quote,
} from 'lucide-react'
import { TriageDemo } from '../components/landing/TriageDemo'
import { SEO } from '../components/seo/SEO'

const JSON_LD_MEDICAL_BUSINESS = {
  '@context': 'https://schema.org',
  '@type': 'MedicalBusiness',
  name: 'MedAssist AI',
  description: 'AI-powered healthcare platform connecting Kenyan patients with clinics through intelligent triage, instant booking, and medicine ordering.',
  url: 'https://medassist.ai',
  areaServed: { '@type': 'Country', name: 'Kenya' },
  availableService: [
    { '@type': 'MedicalTherapy', name: 'AI Symptom Triage' },
    { '@type': 'MedicalTherapy', name: 'Clinic Appointment Booking' },
    { '@type': 'MedicalTherapy', name: 'Online Medicine Ordering' },
  ],
}

const JSON_LD_WEB_APP = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'MedAssist AI',
  url: 'https://medassist.ai',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'KES' },
}

const INTER = "'Inter', system-ui, -apple-system, sans-serif"

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

function PhoneMockup() {
  return (
    <div className="relative mx-auto" style={{ width: 260, fontFamily: INTER }}>
      <div style={{
        position: 'absolute', inset: -40, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(30,64,175,0.35) 0%, transparent 70%)',
        filter: 'blur(30px)', zIndex: 0,
      }} />
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
      <div style={{
        position: 'relative', zIndex: 1,
        width: 260, height: 520, borderRadius: 40,
        background: '#111827', border: '7px solid #1f2937',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, background: '#111827', borderRadius: '0 0 16px 16px', zIndex: 10 }} />
        <div style={{ background: '#f4f3ef', height: '100%', overflow: 'hidden', paddingTop: 28 }}>
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
          <div style={{ padding: '0 12px', overflow: 'hidden' }}>
            <p style={{ fontSize: 9, color: '#9ca3af', marginBottom: 10 }}>Good morning, Jane · Nairobi</p>
            <div style={{ background: '#FEF3C7', borderRadius: 14, padding: '10px 12px', marginBottom: 8, border: '1px solid #FDE68A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#F59E0B' }} />
                <span style={{ fontSize: 8, fontWeight: 800, color: '#92400E', letterSpacing: '0.05em' }}>MODERATE CONCERN</span>
              </div>
              <p style={{ fontSize: 8.5, color: '#78350F', lineHeight: 1.5 }}>Consider seeing a doctor within 24 hours. Symptoms suggest possible infection.</p>
            </div>
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

function DashboardMockup() {
  const bars = [45, 62, 58, 71, 80, 76, 90]
  return (
    <div style={{
      background: '#1e293b', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.4)', fontFamily: INTER,
    }}>
      <div style={{ background: '#0f172a', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: '#1e293b', borderRadius: 6, padding: '4px 10px', margin: '0 10px' }}>
          <span style={{ fontSize: 9, color: '#4b5563' }}>app.medassist.co.ke/clinic-dashboard</span>
        </div>
      </div>
      <div style={{ display: 'flex', height: 280 }}>
        <div style={{ width: 44, background: '#0d1f10', padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          {[BarChart2, Calendar, Activity, Pill].map((Icon, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 8, background: i === 0 ? 'rgba(74,222,128,0.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={13} color={i === 0 ? '#4ade80' : 'rgba(255,255,255,0.25)'} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1, background: '#f4f3ef', padding: 14, overflow: 'hidden' }}>
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
          <div style={{ background: 'white', borderRadius: 10, padding: '10px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 8.5, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Weekly Appointments</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: i === bars.length - 1 ? '#1E40AF' : '#DBEAFE', height: `${(h / 100) * 100}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

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
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ width: 32, height: 32, background: '#0d1f10', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M1 11L6 11L8 7L11 16L13 6L15 11L21 11" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: scrolled ? '#0f172a' : 'white', letterSpacing: '-0.02em' }}>MedAssist AI</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }} className="hidden md:flex">
          {[['For Patients', 'solution'], ['How It Works', 'how-it-works'], ['For Clinics', 'for-clinics'], ['Pricing', 'pricing']].map(([label, id]) => (
            <button key={id} onClick={() => scroll(id)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 14, fontWeight: 500, color: scrolled ? '#374151' : 'rgba(255,255,255,0.8)',
              transition: 'color 0.2s',
            }}>{label}</button>
          ))}
        </div>
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
        <button onClick={() => setMobileOpen(v => !v)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? '#374151' : 'white', padding: 4 }} className="flex md:hidden">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileOpen && (
        <div style={{ background: 'white', borderTop: '1px solid #f1f0ec', padding: '16px 24px 20px' }}>
          {[['For Patients', 'solution'], ['How It Works', 'how-it-works'], ['For Clinics', 'for-clinics'], ['Pricing', 'pricing']].map(([label, id]) => (
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

export function LandingPage() {
  const [billingAnnual, setBillingAnnual] = useState(true)
  const [investorEmail, setInvestorEmail] = useState('')
  const [deckSent, setDeckSent] = useState(false)

  function handleDeckRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!investorEmail) return
    setDeckSent(true)
  }

  const W = { maxWidth: 1200, margin: '0 auto', padding: '0 24px' }

  const pricing = {
    patient: { monthly: 0, annual: 0 },
    pro: { monthly: 4999, annual: 3999 },
    enterprise: { monthly: 14999, annual: 11999 },
  }

  return (
    <div style={{ fontFamily: INTER, background: 'white', color: '#0f172a', overflowX: 'hidden' }}>
      <SEO
        canonical="https://medassist.ai/"
        keywords="healthcare Kenya, AI triage, clinic booking Nairobi, online doctor, medicine delivery Kenya"
        jsonLd={[JSON_LD_MEDICAL_BUSINESS, JSON_LD_WEB_APP]}
      />
      <Navbar />

      {/* ── 1. HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #080f20 0%, #0f1e3d 40%, #132c5e 70%, #1a3a7a 100%)',
        minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 68,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(30,64,175,0.2) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

        <div style={{ ...W, width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', padding: '80px 24px' }}>
          <div>
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

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── 2. PROBLEM ──────────────────────────────────────────────────────── */}
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

      {/* ── 3. FOR PATIENTS ─────────────────────────────────────────────────── */}
      <section id="solution" style={{ background: '#EFF6FF', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <Smartphone size={12} color="#1E40AF" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>For Patients</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Everything You Need, One App
              </h2>
              <p style={{ fontSize: 17, color: '#4b5563', maxWidth: 540, margin: '0 auto' }}>
                From knowing when to see a doctor to ordering medicine — MedAssist has you covered.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
            {[
              { icon: Brain, title: 'AI Symptom Triage', desc: 'Know if you need a doctor in 60 seconds. Our rule-based engine analyzes your symptoms and gives clear, safe guidance — not a diagnosis.', color: '#7C3AED', bg: '#F5F3FF', badge: 'Core Feature' },
              { icon: Calendar, title: 'Smart Appointment Booking', desc: 'Book clinic appointments without a single phone call. See real-time availability, pick your doctor, and pay with M-Pesa.', color: '#1E40AF', bg: '#EFF6FF', badge: 'Live' },
              { icon: Pill, title: 'OTC Medicine Ordering', desc: 'Order genuine OTC medicines from verified pharmacies in your area. Delivery or clinic pickup — your choice.', color: '#059669', bg: '#F0FDF4', badge: 'Live' },
              { icon: Shield, title: 'Secure Health Records', desc: 'Your triage history, appointment records, and allergies — safely stored and accessible only to you and your care providers.', color: '#D97706', bg: '#FFFBEB', badge: 'Patients' },
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
                    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 100, padding: '4px 10px' }}>{badge}</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65 }}>{desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW IT WORKS ─────────────────────────────────────────────────── */}
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

      {/* ── 5. LIVE TRIAGE DEMO ─────────────────────────────────────────────── */}
      <section id="ai-triage" style={{ background: '#F0FDF4', padding: '100px 0' }}>
        <div style={{ ...W, maxWidth: 860, margin: '0 auto', padding: '0 24px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Try It Live · Real Backend</span>
              </div>
              <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Try the AI Triage Engine
              </h2>
              <p style={{ fontSize: 16, color: '#374151', maxWidth: 480, margin: '0 auto' }}>
                Select your symptoms and get an instant AI-powered assessment — connected to our live backend.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <TriageDemo />
          </FadeIn>
        </div>
      </section>

      {/* ── 6. FOR CLINICS ──────────────────────────────────────────────────── */}
      <section id="for-clinics" style={{ background: '#080f1f', padding: '100px 0' }}>
        <div style={{ ...W, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'center' }}>
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
          <FadeIn delay={0.15}>
            <DashboardMockup />
          </FadeIn>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section id="testimonials" style={{ background: '#F8FAFC', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <Star size={12} color="#D97706" fill="#D97706" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Trusted by Users</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Real People. Real Impact.
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 480, margin: '0 auto' }}>
                From rural patients to Nairobi clinic admins — here's what early users are saying.
              </p>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                quote: "I had a fever for two days and wasn't sure if I should go to hospital. MedAssist told me to see a doctor within 24 hours — turned out I had a UTI. Caught it early because of this app.",
                name: 'Amina W.',
                role: 'Patient · Westlands, Nairobi',
                rating: 5,
                initials: 'AW',
                color: '#1E40AF',
                bg: '#EFF6FF',
              },
              {
                quote: "We onboarded to MedAssist in one afternoon. Within a week, we had 23 new bookings from patients we'd never seen before. The dashboard analytics alone are worth the subscription.",
                name: 'Dr. James Mwangi',
                role: 'Medical Director · Kisumu Medics',
                rating: 5,
                initials: 'JM',
                color: '#059669',
                bg: '#F0FDF4',
              },
              {
                quote: "My mum is in Eldoret and I'm in Nairobi. I used MedAssist to book her an appointment at a verified clinic and pay with M-Pesa from here. That peace of mind is priceless.",
                name: 'Brian K.',
                role: 'Patient · CBD, Nairobi',
                rating: 5,
                initials: 'BK',
                color: '#7C3AED',
                bg: '#F5F3FF',
              },
            ].map(({ quote, name, role, rating, initials, color, bg }, i) => (
              <FadeIn key={name} delay={i * 0.1}>
                <div style={{
                  background: 'white', borderRadius: 20, padding: '28px 24px',
                  border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                  display: 'flex', flexDirection: 'column', height: '100%',
                }}>
                  {/* Stars */}
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} size={14} color="#F59E0B" fill="#F59E0B" />
                    ))}
                  </div>
                  {/* Quote mark */}
                  <Quote size={24} color={color} style={{ opacity: 0.3, marginBottom: 12 }} />
                  {/* Quote text */}
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 24, flex: 1 }}>
                    {quote}
                  </p>
                  {/* Author */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, border: `2px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{initials}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{name}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af' }}>{role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* Trust row */}
          <FadeIn delay={0.3}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 56, flexWrap: 'wrap' }}>
              {[
                { icon: Shield, label: 'HIPAA Aware', color: '#1E40AF' },
                { icon: CheckCircle2, label: 'Verified Clinics', color: '#059669' },
                { icon: Zap, label: 'M-Pesa Integrated', color: '#D97706' },
                { icon: Users, label: '2,400+ Triage Sessions', color: '#7C3AED' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</span>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── 8. TRACTION / METRICS ───────────────────────────────────────────── */}
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
                    <CountUp target={target} suffix={suffix} prefix={prefix} />
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

      {/* ── 9. PRICING ──────────────────────────────────────────────────────── */}
      <section id="pricing" style={{ background: 'white', padding: '100px 0' }}>
        <div style={W}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#DBEAFE', border: '1px solid #93C5FD', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
                <Zap size={12} color="#1E40AF" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Pricing</span>
              </div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 16 }}>
                Simple, Transparent Pricing
              </h2>
              <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 480, margin: '0 auto 32px' }}>
                Free for patients, affordable SaaS for clinics. No hidden fees.
              </p>
              {/* Billing toggle */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 0, background: '#F1F5F9', borderRadius: 12, padding: 4 }}>
                <button
                  onClick={() => setBillingAnnual(false)}
                  style={{
                    padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: !billingAnnual ? 'white' : 'transparent',
                    color: !billingAnnual ? '#0f172a' : '#9ca3af',
                    boxShadow: !billingAnnual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >Monthly</button>
                <button
                  onClick={() => setBillingAnnual(true)}
                  style={{
                    padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                    background: billingAnnual ? 'white' : 'transparent',
                    color: billingAnnual ? '#0f172a' : '#9ca3af',
                    boxShadow: billingAnnual ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  Annual
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 100, padding: '1px 7px' }}>Save 20%</span>
                </button>
              </div>
            </div>
          </FadeIn>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {/* Patient — Free */}
            <FadeIn delay={0}>
              <div style={{
                background: 'white', borderRadius: 24, padding: '32px 28px',
                border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Patient</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>Free</span>
                </div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>Always free for patients</p>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: '#F1F5F9', color: '#374151', textDecoration: 'none', marginBottom: 28,
                  transition: 'all 0.2s',
                }}>
                  Get Started Free
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'AI Symptom Triage',
                    'Find Clinics Near You',
                    'Book Appointments',
                    'Order OTC Medicines',
                    'Triage History',
                    'M-Pesa Payments',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={15} color="#059669" />
                      <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Pro Clinic — highlighted */}
            <FadeIn delay={0.08}>
              <div style={{
                background: '#0f1e3d', borderRadius: 24, padding: '32px 28px',
                border: '2px solid #1E40AF', boxShadow: '0 16px 48px rgba(30,64,175,0.3)',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#1E40AF', borderRadius: 100, padding: '4px 16px' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Most Popular</span>
                </div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Pro Clinic</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>KES</span>
                  <span style={{ fontSize: 48, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>
                    {billingAnnual ? pricing.pro.annual.toLocaleString() : pricing.pro.monthly.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>/month</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>
                  {billingAnnual ? 'Billed annually · 2 months free' : 'Billed monthly'}
                </p>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: '#1E40AF', color: 'white', textDecoration: 'none', marginBottom: 28,
                  boxShadow: '0 4px 16px rgba(30,64,175,0.5)', transition: 'all 0.2s',
                }}>
                  Start 14-Day Free Trial
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Everything in Patient',
                    'Clinic Dashboard',
                    'Appointment Management',
                    'Revenue Analytics',
                    'Patient Records',
                    'Doctor Profiles',
                    'Unlimited Appointments',
                    'M-Pesa Payouts',
                    'Email Support',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={15} color="#60a5fa" />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* Enterprise */}
            <FadeIn delay={0.16}>
              <div style={{
                background: 'white', borderRadius: 24, padding: '32px 28px',
                border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Enterprise</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>KES</span>
                  <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                    {billingAnnual ? pricing.enterprise.annual.toLocaleString() : pricing.enterprise.monthly.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>/month</span>
                </div>
                <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 28 }}>
                  {billingAnnual ? 'Billed annually · 2 months free' : 'Billed monthly'}
                </p>
                <Link to="/register" style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                  background: 'white', color: '#1E40AF', textDecoration: 'none', marginBottom: 28,
                  border: '2px solid #1E40AF', transition: 'all 0.2s',
                }}>
                  Contact Sales
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Everything in Pro',
                    'Multi-Branch Management',
                    'Custom Branding',
                    'API Access',
                    'Priority Support',
                    'Dedicated Account Manager',
                    'Custom Integrations',
                    'SLA Guarantee',
                    'Compliance Reports',
                  ].map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle2 size={15} color="#059669" />
                      <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.3}>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 32 }}>
              All clinic plans include a 14-day free trial · No credit card required · Cancel any time
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── 10. TEAM ────────────────────────────────────────────────────────── */}
      <section id="team" style={{ background: '#F8FAFC', padding: '100px 0' }}>
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

      {/* ── 11. BACKED BY ───────────────────────────────────────────────────── */}
      <section id="investors" style={{ background: 'white', padding: '80px 0' }}>
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

      {/* ── 12. FINAL CTA ───────────────────────────────────────────────────── */}
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

      {/* ── 13. FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: '#0d1f10', padding: '56px 0 36px', fontFamily: INTER }}>
        <div style={W}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
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
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Product</p>
              {['Symptom Triage', 'Clinic Finder', 'Book Appointment', 'Medicine Orders'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>For Clinics</p>
              {['Get Listed', 'Dashboard', 'Pricing', 'API Access'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>{l}</Link>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Company</p>
              {['About', 'Blog', 'Careers', 'Contact'].map(l => (
                <Link key={l} to="/register" style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: 10 }}>{l}</Link>
              ))}
            </div>
          </div>
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
