# MedAssist AI — Production Deployment Checklist
**Target date:** _______________

Mark each item ✓ as completed before going live.

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
- [ ] Seed accounts work (login + correct role redirect):
  - [ ] `jane.wanjiku@demo.medassist.co.ke` / `demo1234` → patient role
  - [ ] `admin1@demo.medassist.co.ke` / `demo1234` → clinic_admin role
  - [ ] `admin@medassist.co.ke` / `superadmin123` → super_admin role

### End-to-End Smoke Test
Run `python test_smoke.py` pointed at production URL. All checks must pass:
- [ ] Auth: patient login, clinic admin login
- [ ] Clinics: list, profile, available slots
- [ ] Booking: appointment created successfully
- [ ] Orders: product catalogue, order placed
- [ ] Dashboard: stats, analytics, appointments, status update
- [ ] Triage: URGENT and MILD assessments return correct severity

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

### Pre-Launch Verification
- [ ] `python test_smoke.py` passes all checks against production URL
- [ ] `https://medassist-ai.com` loads in < 3s
- [ ] Login + booking flow tested end-to-end in browser
- [ ] Mobile layout verified on 390px viewport
- [ ] Error monitoring (Sentry) receiving events

### Go-Live
- [ ] Remove or rotate seed accounts (or document they exist)
- [ ] Set `ENVIRONMENT=production` in all configs
- [ ] Confirm automated DB backups are running
- [ ] DNS propagation confirmed

---

## Emergency Contacts / Recovery

| Issue | Solution |
|-------|----------|
| EC2 down | SSH in, `docker compose restart backend` |
| DB unreachable | Check RDS security group; restart with `docker compose restart db` |
| Frontend 404s | Check Vercel deployment status; use local fallback |
| Slow API | Kill heavy queries: `docker compose exec db psql -U medassist -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state='idle in transaction';"` |
| Cert expired | `docker compose --profile ssl run certbot renew && docker compose restart nginx` |
| Lost admin access | `admin@medassist.co.ke` / `superadmin123` (super admin) |

---

*MedAssist AI · Production Deployment Checklist*
