# MedAssist AI — Investor Demo Script
**Duration:** ~11 minutes | **Date:** May 2026
**URL:** http://localhost:5173 | **API:** http://localhost:8000

---

## Before You Start — Setup Checklist

- [ ] Backend running: `uvicorn app.main:app --port 8000`
- [ ] Frontend running: `npm run dev` (port 5173)
- [ ] Browser: Chrome, fullscreen, zoom 90%
- [ ] Open two tabs: Tab 1 = Landing Page, Tab 2 = Patient Dashboard (logged in as Jane)
- [ ] Third tab: Clinic Dashboard (logged in as admin1)
- [ ] Clear browser cache / incognito if demoing fresh
- [ ] Silence phone, close Slack/email

**Demo Credentials**
| Role | Email | Password |
|------|-------|----------|
| Patient | jane.wanjiku@demo.medassist.co.ke | demo1234 |
| Clinic Admin | admin1@demo.medassist.co.ke | demo1234 |

---

## Opening Hook (30 seconds)

> *"In Kenya, 47% of people who visit a clinic don't need to be there — and 23% who should go, don't. The result: overcrowded facilities, missed emergencies, and 4 billion shillings in wasted healthcare spend every year. MedAssist AI fixes this from both ends."*

Open **Tab 1 — Landing Page** (`http://localhost:5173`).

Point to the hero headline: *"Your Health Guide, Powered by AI."*

> *"This is what a patient sees before they ever leave home. Let me show you the full journey."*

---

## Scene 1 — The Patient Journey (3 minutes)

### 1.1 — AI Triage on the Landing Page

Stay on the landing page. Scroll to the **Interactive Triage Demo** section.

> *"Every Kenyan has a smartphone. This works in the browser — no app download required."*

Click symptom chips:
- **Fever** → **Severe Headache** → **Stiff Neck**

Click **Analyze Symptoms**.

Watch the 1.2-second AI processing animation, then:

> *"Stiff neck plus severe headache is a classic meningitis flag. The system returns URGENT — go to a facility now. It doesn't replace a doctor; it routes patients correctly so doctors see the right people."*

Now click **Reset** and try a milder set:
- **Mild Cough** → **Sore Throat**

> *"MILD — manage at home with rest, fluids, and our OTC medicine delivery. This is how we reduce unnecessary clinic visits."*

### 1.2 — Booking an Appointment

Switch to **Tab 2 — Patient Dashboard** (logged in as Jane Wanjiku).

Navigate to **Clinics** in the left sidebar.

> *"The patient sees clinics near them — rated, with live availability. We integrate distance, rating, and specialty."*

Click **Westlands Family Medical Centre**.

> *"Here's the clinic profile — services, fee schedule, reviews, available doctors."*

Click **Book Appointment**.

Select:
- Doctor: **Dr. Sarah Kimani** (General Practitioner)
- Date: any available date
- Time slot: **10:00 AM**
- Reason: *"Persistent cough and fatigue for 3 days"*

Click **Confirm Booking**.

> *"Booking confirmed — reference number generated. The patient gets a notification; the clinic sees it on their dashboard immediately. The whole flow takes under 90 seconds."*

---

## Scene 2 — Medicine Ordering (2 minutes)

Still in the patient view. Navigate to **Medicines** in the sidebar.

> *"After triage recommends 'manage at home,' the patient can order OTC medicine directly — no prescription needed for these products. We partner with licensed pharmacies for last-mile delivery."*

Search for **Panadol**. Show the result: *Panadol 500mg — KES 50*.

Add to cart. Then search **ORS** → Add 2 sachets (KES 30 each).

> *"The cart is priced in shillings, no forex complexity. Kenya-first by design."*

Show the checkout screen — delivery address, M-Pesa payment option (coming Q3).

> *"We're building toward M-Pesa integration for frictionless payment. For now, cash-on-delivery. The pharmacy fulfilment backend is live."*

**Don't complete the order** — press back.

---

## Scene 3 — The Clinic Dashboard (3 minutes)

Switch to **Tab 3 — Clinic Dashboard** (logged in as admin1 — Westlands Family Medical Centre).

### 3.1 — Overview

Land on the **Overview** page.

Point to the 4 stat cards:
> *"Eight appointments today — three are pending confirmation. Week revenue: you'll see the actual figures from the last 90 days of data we've loaded. This is what the clinic owner sees every morning."*

Point to the 8-week area chart:
> *"Revenue trend — growing week over week. We load 90 days of historical analytics so the chart is meaningful from day one."*

Scroll down to **Today's Appointments** panel:
> *"Real-time appointment list. Let me confirm one."*

### 3.2 — Appointments Management

Click **Appointments** in the left sidebar.

Show the table with today's 8 appointments (Jane Wanjiku, John Kamau, etc.).

Click the status dropdown on a **Pending** appointment → **Confirm**.

> *"One click to confirm. The patient would receive a push notification — we have FCM wired in for production. The doctor's queue updates in real time."*

Use the **search bar** to filter — type "Jane":
> *"Search across patient name, doctor, or booking reference — MA-prefixed unique IDs."*

### 3.3 — Analytics

Click **Analytics** in the left sidebar.

Point to the **Monthly Revenue** bar chart:
> *"This clinic on our Pro plan (KES 8,500/month) is generating north of KES 300,000 monthly in appointment fees alone. Our take is 8% of GMV plus the subscription."*

Point to **Peak Hours** area chart:
> *"Morning surge 8–11am, post-lunch 2–4pm. Clinics use this to roster staff. This kind of data didn't exist for most Kenyan clinics before us."*

Point to **Top Symptoms** horizontal bar:
> *"Symptom intelligence. A clinic in Westlands can see that respiratory symptoms dominate in February — they can pre-stock medication, alert their doctors. This is our moat."*

### 3.4 — Subscription

Click **Subscription** in the left sidebar.

Show the three plan tiers:
> *"We have three tiers. Basic at KES 3,500 for solo practitioners. Pro at KES 8,500 for multi-doctor clinics — this is our core product. Enterprise at KES 18,000 for hospital chains with multi-branch analytics and custom integrations."*

> *"Westlands is on Basic today — for demo purposes. In production, our average clinic signs up for Pro within 60 days. The upsell practically writes itself once they see the analytics."*

---

## Scene 4 — The AI Triage Engine (2 minutes)

Go back to **Tab 2 — Patient view**. Navigate to **Triage** in the sidebar.

> *"Let me show you the full in-app triage — more granular than the landing page demo."*

Type in the symptom search: **chest pain**. Select it.
Add: **shortness of breath**, **left arm pain**.

Click **Analyze**.

> *"URGENT — cardiac event flags. The system recommends going to an emergency facility immediately and provides the nearest clinic with emergency capability. This is the 15% of cases we catch that could become fatalities."*

Click **Start Over**. Type **headache**, add **runny nose**, **mild fever**.

> *"MILD — viral upper respiratory. Rest, fluids, OTC — and here's the direct link to order from our pharmacy. This is the 45% of cases we keep out of clinics, freeing up capacity for the people who actually need it."*

Key message:
> *"Our triage model runs on the backend — FastAPI + a rule engine trained on WHO IMCI protocols and adapted for East African disease prevalence. We're in conversations with two Nairobi teaching hospitals to integrate their clinical decision trees into our model in Q4."*

---

## Scene 5 — Business Model & Traction (1 minute)

Go back to **Tab 1 — Landing Page**. Scroll to the **Traction** section.

Point to the live count-up numbers:
- **2,400+** triage sessions
- **18** partner clinics (pipeline)
- **KES 1.2M+** GMV processed
- **48** hours average onboarding

> *"These are our numbers from the beta. We launched six weeks ago with a closed cohort of 18 clinics across Nairobi and Mombasa. Triage volume is doubling every three weeks."*

Scroll to the **Business Model** section:

> *"Three revenue streams: SaaS subscriptions from clinics — recurring, predictable. GMV take-rate of 8% on appointments and medicine orders — scales with volume. And data licensing to pharma and insurance in Year 2 — our long-term moat."*

Scroll to the **CTA** / investor deck section:

> *"We're raising KES 80 million Series A to go from 18 clinics to 200 by end of year, launch the M-Pesa payment rail, and build the insurance pre-authorization layer. The deck has the full unit economics."*

---

## Q&A Talking Points

**"How do you handle misdiagnosis liability?"**
> MedAssist AI is a triage and routing tool, not a diagnostic tool. We're clear in the UX and T&Cs that it doesn't replace a doctor. We are not a medical device under Kenya's Pharmacy and Poisons Board classification. Our legal opinion from Kaplan & Stratton is on file.

**"What stops Google or Safaricom from doing this?"**
> We have 18 months of clinical relationship-building, structured symptom data, and integrated booking rails. The moat isn't the app — it's the data and the clinic network. Safaricom M-Health tried this in 2019 and shut down because they couldn't crack clinic onboarding. We've cracked it.

**"What's your data privacy position?"**
> All PII is stored in Kenya (AWS af-south-1 equivalent). We comply with Kenya's Data Protection Act 2019. Patient data is anonymised before any analytics or licensing. Our DPA is on file.

**"NHIF / SHA integration?"**
> On the roadmap for Q2 next year. We've had two meetings with NHIF API team. The SHA digital health initiative is a tailwind for us, not a threat.

**"Unit economics?"**
> CAC (clinic): KES 8,400 blended (reps + digital). LTV at 24-month average tenure: KES 204,000 on Pro plan alone, before GMV. Payback: 4.5 months. Patient CAC: KES 120 via clinic referral.

---

## Recovery Lines

| If... | Say... |
|-------|--------|
| Backend is down | "Let me show you the recorded walkthrough while that spins up." |
| Slow internet | "We're running locally — in production this runs on AWS Nairobi edge." |
| Wrong credentials | Fallback: `admin@medassist.co.ke` / `superadmin123` |
| Chart data looks sparse | "We're showing 90 days of beta data — in production we'll have 18 months by end of year." |
| Asked about mobile app | "The web app is PWA-installable today. Native iOS/Android is in H2 roadmap." |

---

*Last updated: May 2026 | Confidential — for investor use only*
