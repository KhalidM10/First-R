# MedAssist AI — Demo Day Deployment Checklist
**Event:** Series A Investor Demonstration
**Target date:** _______________

Mark each item ✓ as completed. Do not present until all items are checked.

---

## T-48 Hours — Infrastructure

### Database
- [ ] AWS RDS instance running (db.t3.micro, PostgreSQL 15, af-south-1)
- [ ] Security group allows EC2 → RDS on port 5432 only
- [ ] Automated backups enabled (7-day retention)
- [ ] **Manual backup taken:** `pg_dump medassist_db > backup_$(date +%Y%m%d_%H%M).sql`
- [ ] `DATABASE_URL` confirmed in `.env`

### Backend (EC2)
- [ ] EC2 instance running (t3.small minimum, Ubuntu 22.04)
- [ ] Docker + Docker Compose installed
- [ ] Port 8000 open in security group (or Nginx on 80/443)
- [ ] `.env` file on server with all production values
- [ ] `SECRET_KEY` is a real 64-char hex (`python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] `uvicorn` workers set to 2+ in Dockerfile

### Frontend (Vercel)
- [ ] Vercel project linked to GitHub repo
- [ ] `VITE_API_BASE_URL` set to backend URL in Vercel environment variables
- [ ] Custom domain configured: `medassist-ai.com`
- [ ] Vercel deployment is `Production` (not Preview)

### SSL
- [ ] SSL certificate issued via Let's Encrypt (`certbot certonly`)
- [ ] Certificate auto-renewal configured (`crontab -l` shows certbot renew)
- [ ] `https://medassist-ai.com` loads without browser warnings
- [ ] HTTP → HTTPS redirect working (`curl -I http://medassist-ai.com`)

### DNS
- [ ] A record: `medassist-ai.com` → EC2 IP
- [ ] CNAME: `www.medassist-ai.com` → `medassist-ai.com`
- [ ] CNAME: `api.medassist-ai.com` → EC2 IP (if using subdomain)
- [ ] DNS propagated (`nslookup medassist-ai.com` returns correct IP)

---

## T-24 Hours — Data & Application

### Seed Data
- [ ] Run full reset + seed on production DB:
  ```bash
  # On EC2 or via ssh tunnel
  python reset_db.py && python seed.py
  ```
- [ ] Verify seed output:
  - [ ] 13 clinics
  - [ ] 29 doctors
  - [ ] 2,400+ triage sessions
  - [ ] 1,170 analytics rows (90 days)
  - [ ] 31 OTC products
  - [ ] 8 appointments for TODAY at Westlands
- [ ] Demo credentials work:
  - [ ] `jane.wanjiku@demo.medassist.co.ke` / `demo1234` → patient role
  - [ ] `admin1@demo.medassist.co.ke` / `demo1234` → clinic_admin role
  - [ ] `admin@medassist.co.ke` / `superadmin123` → super_admin role

### End-to-End Demo Flow Test
Run `python test_demo.py` pointed at production URL. All checks must pass:
- [ ] Scene 1: Patient login → clinics list → Westlands profile → slots → booking created
- [ ] Scene 2: Products list (Panadol KES 50, ORS KES 30) → order created
- [ ] Scene 3: Dashboard stats → analytics (monthly + weekly) → today appointments → status update
- [ ] Scene 4: Triage URGENT (chest pain) → Triage MILD (cough) → Triage URGENT (meningitis)

---

## T-4 Hours — Performance

### Page Load (Chrome DevTools → Lighthouse)
- [ ] Landing page: < 3s on Slow 3G (Lighthouse Performance > 70)
- [ ] Dashboard: < 3s on Slow 3G
- [ ] Triage page: < 3s on Slow 3G
- [ ] All pages pass Lighthouse Accessibility > 80

### Mobile (Android)
- [ ] Tested on actual Android device OR Chrome DevTools device emulation (Pixel 7)
- [ ] Landing page hero section looks correct on 390px width
- [ ] Symptom chips wrap correctly on mobile
- [ ] Clinic cards scroll correctly
- [ ] Booking flow usable on mobile keyboard

### API Performance
- [ ] `/api/v1/clinics/` responds in < 500ms
- [ ] `/api/v1/dashboard/analytics` responds in < 1s
- [ ] `/api/v1/triage/analyze` responds in < 2s

---

## T-2 Hours — Final Checks

### Browser Prep
- [ ] Chrome opened, zoom set to 90%
- [ ] Three tabs pre-loaded:
  - Tab 1: `https://medassist-ai.com` (landing page)
  - Tab 2: `https://medassist-ai.com/dashboard` (Jane logged in)
  - Tab 3: `https://medassist-ai.com/clinic-dashboard` (admin1 logged in)
- [ ] DevTools closed
- [ ] Browser history cleared (no autocomplete embarrassments)
- [ ] Incognito mode as backup tab

### Demo Machine
- [ ] Laptop charged to 100%, charger plugged in
- [ ] External display tested (HDMI/USB-C adaptor in bag)
- [ ] Screen resolution set to 1920×1080
- [ ] Notifications silenced (Focus mode / Do Not Disturb on)
- [ ] Slack, email, and chat apps hidden/closed
- [ ] VPN disabled (can slow connections)

### Backup Plan
- [ ] Recorded walkthrough video saved locally (screen recording of full demo)
- [ ] Video is < 6 minutes, plays without audio dependencies
- [ ] `python test_demo.py` pointed at localhost as fallback
- [ ] Local backend running and tested: `python test_demo.py`

### DEMO_SCRIPT.md
- [ ] Printed or on second device
- [ ] Recovery lines section reviewed
- [ ] Q&A talking points memorized

---

## T-0 — Day-Of

- [ ] Arrive 20 minutes early; test display + internet connection
- [ ] Run `python test_demo.py` one final time (production target)
- [ ] Check `https://medassist-ai.com` loads in < 3s on venue WiFi
- [ ] Water available at presentation station
- [ ] Phone on silent

---

## Post-Demo

- [ ] Take database backup immediately after demo
- [ ] Archive investor contact details
- [ ] Follow up within 24 hours with one-pager PDF (`INVESTOR_ONE_PAGER.md`)
- [ ] Note any questions that exposed product gaps → backlog

---

## Emergency Contacts / Recovery

| Issue | Solution |
|-------|----------|
| EC2 down | SSH in, `docker compose restart backend` |
| DB unreachable | Check RDS security group; restart with `docker compose restart db` |
| Frontend 404s | Check Vercel deployment status; use local fallback |
| Slow API | Kill heavy queries: `docker compose exec db psql -U medassist -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle in transaction';"` |
| Cert expired | `docker compose --profile ssl run certbot renew && docker compose restart nginx` |
| Lost demo credentials | `admin@medassist.co.ke` / `superadmin123` (super admin, works from any page) |

---

*Checklist version: May 2026 | Confidential*
