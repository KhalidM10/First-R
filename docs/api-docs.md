# MedAssist AI — API Reference

Base URL: `http://localhost:8000/api/v1`  
Interactive docs: `http://localhost:8000/docs` (Swagger UI)

All protected endpoints require: `Authorization: Bearer <access_token>`

---

## Auth

### POST `/auth/register`
Create a new account.

**Body**
```json
{
  "email": "jane@example.com",
  "password": "securepass123",
  "full_name": "Jane Wanjiku",
  "phone": "+254712345678",
  "role": "patient"
}
```

**Response `201`**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user": { "id": "uuid", "email": "...", "role": "patient", ... }
}
```

---

### POST `/auth/login`
```json
{ "email": "jane@example.com", "password": "securepass123" }
```
**Response `200`** — same as register.

---

### GET `/auth/me` 🔒
Returns the authenticated user object.

---

## Triage

### POST `/triage/analyze`
Run symptom analysis through the triage engine.

**Body**
```json
{
  "symptoms": ["fever", "headache", "body aches"],
  "user_age": 32,
  "user_gender": "Female",
  "county": "Kisumu",
  "duration_days": 2,
  "pre_existing_conditions": ["diabetes"]
}
```

**Response `200`**
```json
{
  "session_id": "uuid",
  "severity": "moderate",
  "confidence": 0.84,
  "matched_conditions": ["Possible malaria or systemic infection"],
  "recommendations": {
    "immediate_action": "Visit a clinic for an RDT test today.",
    "home_care": ["Stay hydrated with ORS...", "Take paracetamol for fever..."],
    "when_to_escalate": "If fever rises above 39.5°C...",
    "should_book_appointment": true,
    "emergency": false
  },
  "suggested_specializations": ["General Practice", "Infectious Disease"],
  "disclaimer": "This is not a medical diagnosis...",
  "saved_to_db": true
}
```

**Severity levels**
| Value | Meaning |
|-------|---------|
| `mild` | Self-care, monitor |
| `moderate` | See doctor within 1–2 days |
| `urgent` | Seek care today |

---

### PATCH `/triage/sessions/{session_id}/feedback`
Submit post-visit feedback (did patient visit doctor?).

```
?did_visit_doctor=true
```

---

## Clinics

### GET `/clinics/`
List active clinics.

| Param | Type | Description |
|-------|------|-------------|
| `county` | string | Filter by county (partial match) |
| `specialization` | string | Filter by specialization |
| `limit` | int | Max results (default 20, max 100) |
| `offset` | int | Pagination offset |

---

### POST `/clinics/` 🔒 `clinic_admin`
Create a new clinic profile.

---

### GET `/clinics/{clinic_id}`
Get a single clinic.

---

### GET `/clinics/{clinic_id}/doctors`
List doctors at a clinic.

---

## Appointments

### POST `/appointments/` 🔒
Book an appointment.

```json
{
  "clinic_id": "uuid",
  "doctor_id": "uuid",
  "scheduled_at": "2026-05-25T09:00:00",
  "reason": "Fever and headache follow-up",
  "triage_session_id": "uuid"
}
```

---

### GET `/appointments/my` 🔒
List current user's appointments. Optional `?status=pending|confirmed|completed|cancelled`.

---

### PATCH `/appointments/{id}` 🔒
Update appointment (e.g. reschedule, change status).

---

### DELETE `/appointments/{id}` 🔒
Cancel appointment.

---

## Patients

### GET `/patients/me` 🔒
Get patient profile for the authenticated user.

### PUT `/patients/me` 🔒
Update patient profile (name, DOB, allergies, chronic conditions, etc.)

---

## Orders (Phase 1 — static catalogue)

### GET `/orders/pharmacies/search?medicine=paracetamol`
Search for pharmacies carrying a medicine.

### GET `/orders/my` 🔒
List current user's medicine orders.

---

## Dashboard (clinic_admin only)

### GET `/dashboard/stats` 🔒 `clinic_admin`
Returns appointment counts for the authenticated clinic admin's clinic.

```json
{
  "clinic_name": "Nairobi Health Centre",
  "appointments_today": 8,
  "pending": 3,
  "confirmed": 4,
  "completed": 12,
  "total_appointments": 47
}
```

### GET `/dashboard/appointments/recent` 🔒 `clinic_admin`
Returns the 10 most recent appointments for the clinic.

---

## Error format

All errors return:
```json
{ "detail": "Human-readable error message" }
```

| HTTP status | Meaning |
|-------------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Resource not found |
| 422 | Pydantic validation failure |
| 500 | Internal server error |
