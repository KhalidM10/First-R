# MedAssist AI

**Kenya-first AI health guidance and clinic management platform.**
Series A investor demo MVP — built with FastAPI + React + PostgreSQL.

---

## What it does

- **AI Triage** — symptom-based severity assessment (Mild / Moderate / Urgent) in < 60 seconds
- **Clinic Booking** — find, compare, and book appointments at vetted Kenyan clinics
- **Medicine Ordering** — OTC pharmacy delivery, priced in KES
- **Clinic SaaS Dashboard** — appointment management, revenue analytics, subscription tiers

---

## Architecture

```
MedAssist AI/
├── backend/          FastAPI · SQLAlchemy 2 · PostgreSQL · JWT
├── frontend/         React 19 · TypeScript · Tailwind CSS v4 · Vite
├── nginx/            Reverse proxy configs (dev + prod/SSL)
├── .github/
│   └── workflows/    CI/CD pipeline (GitHub Actions)
├── docker-compose.yml
├── docker-compose.dev.yml
└── .env.example
```

---

## Quick Start (10 minutes)

### Option A — Docker Compose (recommended)

**Prerequisites:** Docker Desktop 4.x+

```bash
# 1. Clone the repo
git clone https://github.com/your-org/medassist-ai.git
cd medassist-ai

# 2. Create your .env
cp .env.example .env
# Edit .env — at minimum set POSTGRES_PASSWORD and SECRET_KEY
# Generate SECRET_KEY: python -c "import secrets; print(secrets.token_hex(32))"

# 3. Start all services (db + backend + frontend + nginx)
docker compose up -d --build

# 4. Seed demo data (first time only)
docker compose exec backend python seed.py

# 5. Open the app
#    App:      http://localhost
#    API docs: http://localhost/docs
```

> For hot-reload development mode (Vite + uvicorn --reload):
> ```bash
> docker compose -f docker-compose.yml -f docker-compose.dev.yml up
> # App runs at http://localhost:5173
> ```

---

### Option B — Local (no Docker)

**Prerequisites:** Python 3.11+, Node.js 20+, PostgreSQL 14+

#### 1. Database

```sql
-- In psql:
CREATE DATABASE medassist_db;
```

#### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY

# Create tables + load demo data
python reset_db.py
python seed.py

# Start API server
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

#### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Patient | jane.wanjiku@demo.medassist.co.ke | demo1234 |
| Clinic Admin | admin1@demo.medassist.co.ke | demo1234 |
| Super Admin | admin@medassist.co.ke | superadmin123 |

---

## Running Tests

```bash
# Backend smoke test (all 4 demo scenes)
cd backend
python test_demo.py

# Frontend type check
cd frontend
npx tsc --noEmit

# Frontend build check
npm run build
```

---

## Production Deployment

See **`DEPLOYMENT_CHECKLIST.md`** for the complete pre-demo deployment runbook.

### Architecture overview

```
Investors → medassist-ai.com (Vercel CDN)
                    ↓ /api/* requests
            api.medassist-ai.com (EC2 + Nginx)
                    ↓
              FastAPI backend (Docker)
                    ↓
              AWS RDS PostgreSQL (af-south-1)
```

### GitHub Actions secrets required

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel personal access token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `EC2_HOST` | EC2 public IP or hostname |
| `EC2_USER` | EC2 SSH user (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | EC2 private key (PEM, entire file contents) |
| `DATABASE_URL` | Production RDS connection string |
| `SECRET_KEY` | 64-char hex JWT signing key |
| `ALLOWED_ORIGINS` | Comma-separated prod origins |
| `MPESA_CONSUMER_KEY` | Safaricom Daraja API key |
| `MPESA_CONSUMER_SECRET` | Safaricom Daraja secret |

### SSL certificate (Let's Encrypt)

```bash
# On EC2, first time:
docker compose --profile ssl run certbot

# After cert is issued, switch nginx to SSL config:
cp nginx/nginx.conf nginx/nginx.dev.conf.bak
# Edit docker-compose.yml: change nginx volume to nginx/nginx.conf
docker compose restart nginx

# Auto-renew (add to EC2 crontab):
0 3 * * * cd ~/medassist-ai && docker compose --profile ssl run certbot renew --quiet && docker compose restart nginx
```

### Performance targets (Kenya 3G)

| Page | Target | How |
|------|--------|-----|
| Landing page | < 3s | Vite code-split, Vercel CDN edge |
| Dashboard | < 3s | TanStack Query caching |
| Triage analyze | < 2s | FastAPI async, < 10ms DB |
| All pages | < 500ms TTFB | Nginx gzip, CloudFront |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Vite 8 |
| State | Zustand (auth), TanStack Query v5 (server state) |
| Forms | React Hook Form + Zod |
| Charts | Recharts v3 |
| Backend | FastAPI 0.111, Python 3.11 |
| ORM | SQLAlchemy 2, Alembic |
| Auth | JWT (python-jose), bcrypt |
| Database | PostgreSQL 15 (JSONB for medical data) |
| Proxy | Nginx 1.25 |
| CI/CD | GitHub Actions |
| Frontend hosting | Vercel |
| Backend hosting | AWS EC2 (t3.small) |
| Database hosting | AWS RDS PostgreSQL (af-south-1) |
| SSL | Let's Encrypt / Certbot |

---

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | — | Create account |
| POST | `/api/v1/auth/login` | — | Get JWT tokens |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| POST | `/api/v1/triage/analyze` | Bearer | Run AI triage |
| GET | `/api/v1/clinics/` | Bearer | List clinics |
| GET | `/api/v1/clinics/{id}` | Bearer | Clinic profile + doctors |
| GET | `/api/v1/clinics/{id}/slots` | Bearer | Available booking slots |
| POST | `/api/v1/appointments/` | Bearer | Book appointment |
| GET | `/api/v1/appointments/my` | Bearer | Patient's appointments |
| GET | `/api/v1/orders/products` | Bearer | OTC product catalogue |
| POST | `/api/v1/orders/` | Bearer | Place medicine order |
| GET | `/api/v1/dashboard/stats` | clinic_admin | Overview stats |
| GET | `/api/v1/dashboard/analytics` | clinic_admin | Revenue + trends |
| GET | `/api/v1/dashboard/appointments` | clinic_admin | Appointment list |
| PATCH | `/api/v1/dashboard/appointments/{id}/status` | clinic_admin | Update status |

Full interactive docs: `/docs` (Swagger) or `/redoc`

---

## Project Files

```
backend/
├── app/
│   ├── api/routes/      auth · triage · clinics · appointments · orders · dashboard
│   ├── models/          SQLAlchemy ORM models
│   ├── schemas/         Pydantic request/response schemas
│   ├── services/        Business logic (triage engine, booking, analytics)
│   ├── config.py        Pydantic Settings (reads .env)
│   ├── database.py      SQLAlchemy engine + session
│   └── main.py          FastAPI app, middleware, route registration
├── seed.py              Demo data (13 clinics, 2,400 triage sessions, 90-day analytics)
├── reset_db.py          Drop + recreate all tables
├── test_demo.py         End-to-end smoke test (all 4 demo scenes)
└── Dockerfile

frontend/
├── src/
│   ├── components/      Reusable UI (AppLayout, ClinicLayout, forms, cards)
│   ├── pages/           Route-level page components
│   │   └── clinic/      Clinic admin portal pages
│   ├── store/           Zustand auth store
│   └── lib/             Axios client, query client
├── nginx.conf           SPA nginx config (inside frontend container)
├── Dockerfile           Multi-stage build → nginx serve
├── Dockerfile.dev       Dev mode (Vite hot reload)
└── vercel.json          Vercel deployment config
```

---

## Important Notice

MedAssist AI is a **triage and guidance tool** — not a diagnostic or prescribing service.
All medical logic is conservative and escalates to professional care when uncertain.
**Kenya emergency line: 0800 723 253**

---

*MedAssist AI · Kenya-first health tech · Series A 2026*
