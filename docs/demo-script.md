# MedAssist AI — Investor Demo Script

**Duration:** 8–12 minutes  
**Audience:** Series A investors  
**Goal:** Demonstrate working product, Kenyan market insight, and data flywheel

---

## Setup (before the call)

- [ ] Backend running: `cd backend && uvicorn app.main:app --reload --port 8000`
- [ ] Frontend running: `cd frontend && npm run dev`
- [ ] Open app at http://localhost:5173
- [ ] Log out so you're on the landing/login screen
- [ ] Have demo credentials ready:
  - **Patient:** `jane.wanjiku@example.com` / `demo1234`
  - **Clinic admin:** `admin@nairobi-health.co.ke` / `demo1234`
- [ ] Open a second browser tab in incognito for the clinic admin view

---

## Act 1: The Patient Journey (5 min)

### 1.1 — The problem (30 sec)
> "Most Kenyans don't know whether their symptoms need a hospital visit today,
> or if they can wait. They end up either ignoring serious conditions or
> overwhelming clinics with minor ones. MedAssist solves that."

### 1.2 — Sign in as Jane Wanjiku
Log in with the patient credentials. Point out:
- Clean, fast UI — optimised for low-bandwidth Kenyan mobile data
- Warm greeting on dashboard — personalised experience

### 1.3 — Run a triage session
Click **Symptom Check** in the sidebar.

1. Select: **Fever** + **Headache** + **Body aches** + **Chills**
2. Click Continue
3. Enter: Age **28**, County **Kisumu**, Duration **2 days**
4. Click **Analyse my symptoms**

> "Watch the triage engine — it's running 20+ red-flag rules, age-specific
> escalation, and here's the important part: it knows Kisumu is a high malaria
> risk county. That's Kenyan-specific intelligence no generic health app has."

5. Show the results card — point out:
   - **Severity badge + confidence** — not a black box
   - **Matched conditions** — transparent reasoning
   - **Home care tips** — immediately actionable
   - **Book appointment CTA** — direct conversion from triage to revenue

### 1.4 — Find a clinic and book
Click **Book an appointment**.
- Show the clinic listing — verified clinics, M-Pesa + NHIF badges
- Select a clinic, choose a date and time slot, submit
- Show the success screen

> "That booking generates KES 200 commission for us. Every triage session
> is a funnel directly into our booking revenue."

---

## Act 2: The Clinic Dashboard (3 min)

Switch to the incognito tab. Log in as `admin@nairobi-health.co.ke`.

> "This is the SaaS layer — clinics pay us a subscription for this dashboard."

Walk through:
- **Today's appointments** — 8 bookings, real-time
- **Stats grid** — pending, confirmed, completed
- **Revenue chart** — KES 48,500 this month, 75% of target
- **Recent appointments table** — patient names, reasons, status

> "Clinics pay KES 5,000/month for this. We're signing 3 clinics per week
> in Nairobi. At scale, this is higher-margin than booking commissions."

---

## Act 3: The Data Flywheel (2 min)

Back to slides or screen share the architecture diagram.

> "Every triage session generates structured medical data — symptoms, duration,
> county, outcome. We're building the largest labelled health dataset in East
> Africa. Phase 2 trains a hybrid ML model on this corpus. The more patients,
> the smarter the engine, the better the outcomes, the more patients trust it.
> That's the flywheel."

---

## Key Numbers to Have Ready

| Metric | Value |
|--------|-------|
| Triage engine rules | 20+ red-flag + 15 combination rules |
| Kenya counties covered | All 47 |
| Malaria high-risk counties mapped | 15 |
| Pre-existing conditions escalated | 11 |
| Booking commission per appointment | KES 150–300 |
| Clinic SaaS monthly fee | KES 5,000–15,000 |
| Target TAM (Kenya) | 55M people, 8,000+ clinics |

---

## Likely Questions

**"How do you prevent misdiagnosis liability?"**
> "MedAssist is a triage and guidance tool — legally we're in the same category
> as WebMD or NHS 111. Every result includes a medical disclaimer. We never
> diagnose; we guide. Our conservative rule set means we escalate rather than
> under-triage."

**"What's stopping M-Kopa or Safaricom from copying this?"**
> "Data moat. Our labelled Kenyan symptom dataset is our defensible asset.
> Safaricom could build the interface; they can't easily replicate 18 months
> of structured triage data with outcomes. We're also applying for patents
> on the Kenya-specific triage logic."

**"What's your CAC?"**
> "Currently zero — all organic through clinic referrals and community health
> workers. Clinics refer patients to MedAssist because it reduces no-shows
> (triaged patients show up). That's our growth engine."

**"Why not just build the ML model first?"**
> "Cold start problem. You can't train a Kenyan-specific model without Kenyan
> health data. The rule engine generates the labelled training data while
> delivering real value to users. This is how Ada Health started."

---

## Closing

> "We're raising [amount] at [valuation] to hire 2 ML engineers, sign 50
> clinic partnerships in Nairobi, and launch the M-Pesa medicine ordering
> module. Here's our 18-month plan..."
