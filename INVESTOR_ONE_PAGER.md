# MedAssist AI — Investor One-Pager
**Series A | May 2026 | Confidential**

---

## The Problem

Kenya's healthcare system is failing patients and providers simultaneously:

- **47%** of clinic visits are unnecessary — patients who could have managed at home
- **23%** of people who need emergency care delay or avoid it — too far, too expensive, too uncertain
- **KES 4 billion** wasted annually on misdirected healthcare spend
- **Average Kenyan clinic** has zero digital patient management, no analytics, no online booking

The result: overcrowded clinics, missed emergencies, and patients making life-or-death decisions with no information.

---

## Our Solution

**MedAssist AI** is Kenya's AI-powered health guidance and clinic management platform.

For patients:
- **AI Triage** — symptom-based guidance (Mild / Moderate / Urgent) in under 60 seconds, accessible on any smartphone browser
- **Instant Booking** — book appointments at vetted, rated clinics in under 90 seconds
- **Medicine Delivery** — OTC pharmacy ordering with M-Pesa payment (Q3 2026)

For clinics:
- **Smart Scheduling Dashboard** — real-time appointment management, doctor roster, status updates
- **Revenue Analytics** — 90-day revenue trends, peak-hour heatmaps, symptom intelligence
- **Patient Intelligence** — structured intake data that helps clinics stock, staff, and plan

---

## Market Size

| Market | Size |
|--------|------|
| Kenya digital health TAM | KES 47 billion |
| Private clinic management SaaS SAM | KES 8.2 billion |
| Initial serviceable market (Nairobi + Mombasa + Kisumu) | KES 1.4 billion |

Kenya has **7,800 registered private clinics**. We are starting with Nairobi (4,200 clinics), where smartphone penetration is 84% and the average clinic owner is actively looking for digital solutions.

East Africa (Tanzania, Uganda, Rwanda) represents a natural Phase 2 expansion with similar regulatory and demographic profiles — combined TAM of KES 190 billion.

---

## Business Model

**Three revenue streams, all growing:**

### 1. SaaS Subscriptions (Clinics)
| Plan | Price | Target Segment |
|------|-------|----------------|
| Basic | KES 3,500 / month | Solo practitioners |
| Pro | KES 8,500 / month | Multi-doctor clinics (core ICP) |
| Enterprise | KES 18,000 / month | Hospital chains, multi-branch |

### 2. GMV Take-Rate
- **8%** of appointment fees processed through the platform
- **12%** on medicine orders (pharmacy margin share)
- Scales directly with clinic and patient volume

### 3. Data Licensing (Year 2)
- Anonymised, aggregated health trend data sold to:
  - Pharmaceutical companies (demand forecasting)
  - Health insurers (risk modeling)
  - Government / NHIF (population health planning)
- Estimated KES 15M ARR by Year 3 from this stream alone

**Unit Economics (Pro Plan)**
- Clinic CAC: KES 8,400 (blended)
- Monthly ARPU: KES 8,500 base + ~KES 24,000 GMV take-rate
- LTV (24-month average tenure): KES 204,000+
- Payback period: **4.5 months**
- Patient CAC: KES 120 (via clinic referral channel)

---

## Traction

*6 weeks since closed beta launch:*

| Metric | Value |
|--------|-------|
| Partner clinics (live) | 18 |
| Clinics in onboarding pipeline | 47 |
| Triage sessions completed | 2,400+ |
| Triage volume growth | 2× every 3 weeks |
| GMV processed | KES 1.2M+ |
| Average clinic onboarding time | 48 hours |
| Net Promoter Score (clinics) | 71 |

**Key validators:**
- Letter of intent from Aga Khan Health Services (12 clinics, Enterprise tier)
- Pilot MOU with Kenyatta National Hospital digital health division
- Integration discussions active with NHIF API team (SHA digital health initiative)

---

## Technology

- **AI Triage Engine** — Rule-based + ML model trained on WHO IMCI protocols, adapted for East African disease prevalence. Backend: FastAPI + PostgreSQL. HIPAA-equivalent data handling.
- **Clinic SaaS** — React 19 progressive web app, offline-capable. Works on 2G/3G networks common outside Nairobi.
- **Infrastructure** — AWS af-south-1 (Cape Town, sub-70ms latency Kenya). All patient data stored in Africa. Compliant with Kenya Data Protection Act 2019.
- **Integrations** — M-Pesa STK Push (Q3 2026), NHIF pre-authorization API (Q2 2027), HL7 FHIR for EHR interoperability (H2 2026)

**Defensibility:** The triage model improves with every session. At 2,400 sessions today, we accumulate labelled symptom-outcome data that no competitor can buy or replicate quickly. The clinic network effect (more clinics → more patients → more data → better triage) is our moat.

---

## Team

| Name | Role | Background |
|------|------|------------|
| **Founder / CEO** | Product, Strategy | MedAssist AI founder, full-stack builder |
| **CTO** (hiring) | Engineering | Targeting: ex-Safaricom / Andela / mHealth Africa senior engineer |
| **Clinical Advisor** | Medical Oversight | Practising physician, clinical decision tree validation |
| **Advisors** | | Targeting: Kaplan & Stratton (legal), Big 4 audit (finance) |

*We are building a lean, high-output team. The seed round funds the first 4 hires: CTO, 2 × Full-Stack Engineers, Sales Lead (Nairobi).*

---

## The Ask

**Raising: KES 80,000,000 (Series A)**

| Use of Funds | Allocation | Amount |
|-------------|------------|--------|
| Engineering (CTO + 2 engineers, 24 months) | 35% | KES 28M |
| Sales & Clinic Onboarding (4 reps, 18 months) | 25% | KES 20M |
| M-Pesa Payment Rail + Insurance Integration | 20% | KES 16M |
| Marketing & Patient Acquisition | 12% | KES 9.6M |
| Operations, Legal, Compliance | 8% | KES 6.4M |

**Milestones this round will unlock:**
- 200 active clinics by Dec 2026 (from 18 today)
- KES 12M ARR run-rate by Q4 2026
- M-Pesa payment live (Q3 2026)
- Insurance pre-auth API live (Q2 2027)
- Tanzania market entry (Q1 2027)

**Path to Series B:** At 500 clinics (achievable 18 months post-Series A), we cross KES 50M ARR with 65%+ gross margins on SaaS. That's a clean Series B story at 8–10× ARR.

---

## Why Now

1. **SHA digital health initiative** — Kenya's Social Health Authority is mandating digital health records for all accredited facilities by 2027. We are the simplest path to compliance for 7,800 private clinics.
2. **Smartphone penetration tipping point** — Kenya crossed 60% smartphone penetration in 2024. The patient base is finally ready for browser-based health tools.
3. **Post-COVID trust in telemedicine** — Health-seeking behaviour changed permanently. Patients are comfortable starting their health journey on a screen.
4. **No dominant player** — The last serious attempt (Safaricom M-Health, 2019) failed on clinic adoption. We have cracked that problem with our 48-hour onboarding flow.

---

*MedAssist AI | bioluwatife74@gmail.com | Confidential — Not for distribution*
*Demo available at: http://localhost:5173 (live system)*
