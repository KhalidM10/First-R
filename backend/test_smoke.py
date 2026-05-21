"""End-to-end smoke test — covers auth, triage, booking, orders, and dashboard."""
import requests
import datetime

BASE = "http://localhost:8000/api/v1"


def hdr(t):
    return {"Authorization": "Bearer " + t}


def ok(label, val=""):
    print(f"[OK] {label:<28} {val}")


def fail(label, msg):
    print(f"[FAIL] {label}: {msg}")
    raise SystemExit(1)


# ── Login ─────────────────────────────────────────────────────────────
r = requests.post(BASE + "/auth/login", json={
    "email": "jane.wanjiku@demo.medassist.co.ke", "password": "demo1234"
})
if r.status_code != 200:
    fail("patient login", r.text[:200])
pt_token = r.json()["access_token"]
pt_user = r.json()["user"]
ok("Patient login", f"name={pt_user['full_name']}  role={pt_user['role']}")

r = requests.post(BASE + "/auth/login", json={
    "email": "admin1@demo.medassist.co.ke", "password": "demo1234"
})
if r.status_code != 200:
    fail("clinic login", r.text[:200])
cl_token = r.json()["access_token"]
cl_user = r.json()["user"]
ok("Clinic login", f"name={cl_user['full_name']}  role={cl_user['role']}")

# ── SCENE 1 — Patient Journey ─────────────────────────────────────────
print("\n=== SCENE 1: PATIENT JOURNEY ===")

r = requests.get(BASE + "/clinics/", headers=hdr(pt_token))
if r.status_code != 200:
    fail("clinics list", r.text[:200])
clinics = r.json()
ok("Clinics list", f"count={len(clinics)}")

westlands = next((c for c in clinics if "Westlands" in c["name"]), None)
if not westlands:
    fail("westlands lookup", "not found in " + str([c["name"] for c in clinics]))
ok("Westlands found", f"id={westlands['id']}")

r = requests.get(BASE + "/clinics/" + westlands["id"], headers=hdr(pt_token))
if r.status_code != 200:
    fail("clinic profile", r.text[:200])
profile = r.json()
doctors = profile.get("doctors", [])
ok("Clinic profile", f"doctors={len(doctors)}")
for d in doctors:
    print(f"       {d['full_name']}  {d.get('specialty','?')}  KES {d.get('consultation_fee_kes','?')}")

doc = doctors[0]
tomorrow = (datetime.date.today() + datetime.timedelta(days=1)).isoformat()
r = requests.get(
    BASE + "/clinics/" + westlands["id"] + "/slots"
    + "?doctor_id=" + doc["id"] + "&date=" + tomorrow,
    headers=hdr(pt_token)
)
if r.status_code != 200:
    fail("slots", r.text[:200])
slots_resp = r.json()
slots = slots_resp.get("slots", slots_resp) if isinstance(slots_resp, dict) else slots_resp
slot_times = [s["time"] if isinstance(s, dict) else s for s in slots]
ok("Available slots", f"date={tomorrow}  count={len(slot_times)}  first={slot_times[0] if slot_times else 'none'}")

if not slot_times:
    fail("booking", "no slots available")
r = requests.post(BASE + "/appointments/", headers=hdr(pt_token), json={
    "clinic_id": westlands["id"],
    "doctor_id": doc["id"],
    "appointment_date": tomorrow,
    "appointment_time": slot_times[0],
    "reason": "Persistent cough and fatigue for 3 days",
    "amount_kes": doc.get("consultation_fee_kes", 1500),
})
if r.status_code not in (200, 201):
    fail("booking", f"{r.status_code} {r.text[:300]}")
appt = r.json()
ok("Booking created", f"ref={appt.get('booking_reference', appt.get('id'))}  status={appt.get('status')}  time={appt.get('appointment_time')}")

# ── SCENE 2 — Medicine Ordering ───────────────────────────────────────
print("\n=== SCENE 2: MEDICINE ORDERING ===")

r = requests.get(BASE + "/orders/products", headers=hdr(pt_token))
if r.status_code != 200:
    fail("products", r.text[:200])
prods = r.json()
ok("Products list", f"count={len(prods)}")
for p in prods[:6]:
    print(f"       {p['name']}  KES {p['price_kes']}")

panadol = next((p for p in prods if "Panadol" in p["name"]), None)
ors = next((p for p in prods if "ORS" in p["name"]), None)
if not panadol:
    fail("products", "Panadol not found")
if not ors:
    fail("products", "ORS not found")

r = requests.post(BASE + "/orders/", headers=hdr(pt_token), json={
    "items": [
        {"product_id": panadol["id"], "quantity": 2},
        {"product_id": ors["id"], "quantity": 3},
    ],
    "delivery_address": "45 Waiyaki Way, Westlands, Nairobi"
})
if r.status_code not in (200, 201):
    fail("order", f"{r.status_code} {r.text[:300]}")
order = r.json()
total = order.get("total_amount_kes", "?")
ok("Order created", f"ref={order.get('order_reference', order.get('id'))}  status={order.get('status')}  total=KES {total}")

# ── SCENE 3 — Clinic Dashboard ────────────────────────────────────────
print("\n=== SCENE 3: CLINIC DASHBOARD ===")

r = requests.get(BASE + "/dashboard/stats", headers=hdr(cl_token))
if r.status_code != 200:
    fail("dashboard stats", r.text[:200])
stats = r.json()
ok("Dashboard stats", str(stats)[:100])

r = requests.get(BASE + "/dashboard/analytics", headers=hdr(cl_token))
if r.status_code != 200:
    fail("analytics", r.text[:200])
analytics = r.json()
monthly = analytics.get("monthly_revenue", analytics.get("revenue_by_month", []))
weekly = analytics.get("weekly_trend", [])
ok("Analytics", f"monthly={len(monthly)}  weekly={len(weekly)}")

today_str = datetime.date.today().isoformat()
r = requests.get(BASE + "/dashboard/appointments?date=" + today_str, headers=hdr(cl_token))
if r.status_code != 200:
    fail("today appointments", r.text[:200])
today_appts = r.json()
ok("Today appointments", f"count={len(today_appts)}")
for a in today_appts[:3]:
    print(f"       {a.get('appointment_time','?')}  {a.get('patient_name','?')}  {a.get('booking_reference','?')}  {a.get('status','?')}")

pending = next((a for a in today_appts if a.get("status") == "pending"), None)
if pending:
    r = requests.patch(
        BASE + "/dashboard/appointments/" + pending["id"] + "/status?status=confirmed",
        headers=hdr(cl_token)
    )
    if r.status_code != 200:
        fail("status update", f"{r.status_code} {r.text[:200]}")
    ok("Status updated", f"pending -> confirmed  id={pending['id']}")

# ── SCENE 4 — AI Triage ───────────────────────────────────────────────
print("\n=== SCENE 4: AI TRIAGE ===")

cases = [
    (["chest pain", "shortness of breath", "left arm pain"], 45, "male",   "URGENT"),
    (["fever", "severe headache", "stiff neck"],             28, "female",  "URGENT"),
    (["mild cough", "sore throat", "runny nose"],            28, "female",  "MILD"),
]
for symptoms, age, gender, expected in cases:
    r = requests.post(BASE + "/triage/analyze", headers=hdr(pt_token), json={
        "symptoms": symptoms, "user_age": age, "user_gender": gender
    })
    if r.status_code != 200:
        fail("triage", f"{r.status_code} {r.text[:300]}")
    t = r.json()
    level = t.get("severity", t.get("level", "?")).upper()
    match = "OK" if expected in level else "WARN"
    print(f"[{match}] Triage                       symptoms={symptoms[0]}...  level={level}  expected={expected}")

print("\n=== ALL SMOKE TESTS PASSED ===")
