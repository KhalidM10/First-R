# MedAssist AI — System Architecture

## Overview

MedAssist AI is a Kenya-first AI health triage and guidance platform.
The MVP targets **Series A** funding and demonstrates product-market fit
across 5 integrated modules.

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│   React 19 + TypeScript + Tailwind CSS v4 (Vite)                │
│   TanStack Query · Zustand · React Hook Form · Zod               │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS / REST JSON
┌───────────────────────────▼──────────────────────────────────────┐
│                        API LAYER                                 │
│                                                                  │
│   FastAPI 0.111 + Uvicorn (Python 3.11)                         │
│   JWT Auth · Pydantic v2 · SQLAlchemy 2 ORM                     │
│                                                                  │
│   /api/v1/auth          Registration, login, token refresh       │
│   /api/v1/triage        Rule-based symptom analysis              │
│   /api/v1/appointments  Booking CRUD                             │
│   /api/v1/clinics       Clinic/doctor directory                  │
│   /api/v1/patients      Patient profile management               │
│   /api/v1/orders        Medicine ordering (Phase 2)              │
│   /api/v1/dashboard     Clinic SaaS stats                        │
└──────────┬────────────────────────────────┬──────────────────────┘
           │                                │
┌──────────▼──────────┐       ┌─────────────▼─────────────────────┐
│   PostgreSQL 15     │       │       TRIAGE ENGINE (Python)       │
│   (AWS RDS)         │       │                                    │
│                     │       │   Rule-based → Hybrid ML (Phase 2) │
│   Tables:           │       │   20+ red-flag rules               │
│   users             │       │   15 combo condition rules         │
│   patients          │       │   Pre-existing condition escalation│
│   clinics           │       │   Kenya malaria county mapping     │
│   doctors           │       │   Confidence scoring               │
│   appointments      │       │   Structured recommendations       │
│   triage_sessions   │       └────────────────────────────────────┘
│   symptom_logs      │
│   orders            │
└─────────────────────┘
```

---

## 5 Platform Modules

### 1. AI Health Guidance (MVP)
- Rule-based triage engine — conservative by design, escalates on uncertainty
- 4 severity levels: mild / moderate / urgent / emergency
- Kenya-specific: malaria county risk, EAT timezone, Kenyan emergency numbers
- Data collection layer: every session feeds the training corpus for Phase 2 ML

### 2. Appointment Booking (MVP)
- Patient searches verified clinics by county and specialization
- Books slots (30-minute intervals, 08:00–17:00 EAT)
- Booking conflicts prevented at service layer
- Phase 2: SMS reminders via Africa's Talking, calendar sync

### 3. Clinic Directory (MVP)
- Clinic profiles with specializations, operating hours, NHIF/M-Pesa acceptance
- Doctor profiles linked to clinics
- County-based filtering

### 4. Medicine Ordering (Phase 1 stub / Phase 2 full)
- Pharmacy search by medicine name
- Verified pharmacy network
- M-Pesa Daraja STK push payment (Phase 2)

### 5. Clinic SaaS Dashboard (MVP)
- Role-gated (clinic_admin only)
- Appointment stats: today, pending, confirmed, completed
- Revenue analytics
- Patient management

---

## Security Model

| Concern | Implementation |
|---------|----------------|
| Authentication | JWT (access 60 min + refresh 30 days) |
| Password storage | bcrypt (cost factor 12) |
| Role enforcement | Dependency-injected `require_role()` guard |
| CORS | Whitelist: localhost dev + production domain |
| SQL injection | SQLAlchemy ORM (no raw SQL) |
| Input validation | Pydantic v2 strict schemas |

---

## Data Flow — Triage Session

```
Patient enters symptoms
        │
        ▼
POST /api/v1/triage/analyze
        │
        ▼
TriageEngine.analyze()
  1. Normalise input
  2. Pre-existing condition escalation check
  3. Red-flag keyword matching → URGENT
  4. Age-based escalation (under 5, over 65)
  5. County-based malaria risk
  6. Combination rule matching → MODERATE
  7. Single-symptom moderate rules
  8. Mild classification
  9. Confidence scoring
        │
        ▼
TriageResult persisted to triage_sessions + symptom_logs
        │
        ▼
TriageAnalyzeResponse → Frontend results card
        │
        ▼
Patient books appointment (optional)
```

---

## Deployment (AWS)

| Component | Service |
|-----------|---------|
| Frontend | S3 + CloudFront CDN |
| Backend | EC2 (t3.small) behind ALB |
| Database | RDS PostgreSQL (db.t3.micro) |
| File storage | S3 |
| SSL | ACM certificate |

---

## Phase Roadmap

| Phase | Scope | Status |
|-------|-------|--------|
| 1 — MVP | Auth, Triage, Clinics, Appointments, Clinic Dashboard | **In progress** |
| 2 — Payments | M-Pesa Daraja, NHIF claims | Planned |
| 3 — ML | Hybrid ML triage, predictive analytics | Planned |
| 4 — Mobile | Flutter iOS + Android | Planned |
| 5 — Scale | East Africa expansion (UG, TZ, RW) | Planned |
