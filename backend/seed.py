"""
Demo seed v2 — investor presentation quality.

Upgrades over v1:
  • 13 clinics (original 8 + 5 new requested locations)
  • 10 patients with richer profiles
  • Appointments seeded for TODAY (visible in clinic dashboard demo)
  • 2,400 anonymised triage sessions (45% mild / 40% moderate / 15% urgent)
  • 90 days of ClinicAnalytics (powers the 6-month revenue chart)
  • Updated OTC product list with requested items and prices

Run from backend/ directory:
    python reset_db.py   # drops + recreates schema first
    python seed.py
"""
import sys, os, uuid, random
from datetime import date, datetime, time, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.clinic import Clinic, Doctor, SubscriptionPlan
from app.models.appointment import Appointment, AppointmentStatus
from app.models.triage import TriageSession, SymptomLog, SeverityLevel, RecommendedAction
from app.models.order import MedicineOrder, OrderStatus, DeliveryMethod, PaymentMethod
from app.models.product import Product
from app.models.analytics import ClinicAnalytics
import app.models  # noqa — registers all mappers

random.seed(42)  # reproducible demo data

WEEKDAYS      = ["monday", "tuesday", "wednesday", "thursday", "friday"]
WEEKDAYS_SAT  = WEEKDAYS + ["saturday"]

# ── Clinic definitions ────────────────────────────────────────────────────────

CLINIC_DATA = [
    # ── Nairobi (8) ──────────────────────────────────────────────────────────
    {
        "name": "Westlands Family Medical Centre",
        "address": "Westlands Rd, Westlands, Nairobi",
        "county": "Nairobi", "latitude": -1.2676, "longitude": 36.8031,
        "phone": "+254722100001", "email": "info@westlandsfmc.co.ke",
        "license_number": "KMB/PRIV/2018/0042",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Pediatrics", "Internal Medicine"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Kamau Njoroge",   "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "12 years in primary care. Speaks English, Swahili, Kikuyu.", "fee": 1500},
            {"full_name": "Dr. Wanjiku Maina",   "specialty": "Pediatrics",
             "qualification": "MBChB, MMed Paediatrics (UoN)",
             "bio": "Child health specialist focused on immunisation and nutrition.", "fee": 2000},
            {"full_name": "Dr. Brian Gitau",     "specialty": "Internal Medicine",
             "qualification": "MBChB, MMed Internal Medicine (UoN)",
             "bio": "Specialist in chronic disease management and preventive care.", "fee": 2500},
        ],
    },
    {
        "name": "Nairobi West Medical Centre",
        "address": "Langata Rd, Langata, Nairobi",
        "county": "Nairobi", "latitude": -1.3069, "longitude": 36.7694,
        "phone": "+254733201001", "email": "care@nairobiwestmedical.co.ke",
        "license_number": "KMB/PRIV/2019/0134",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Pediatrics", "Family Medicine"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Josephine Wambua", "specialty": "General Practice",
             "qualification": "MBChB (Kenyatta University)",
             "bio": "Serving Langata and Kibera communities. HIV/TB management experience.", "fee": 1500},
            {"full_name": "Dr. Eliud Kipchoge Ng'ang'a", "specialty": "Pediatrics",
             "qualification": "MBChB, MMed Paediatrics (UoN)",
             "bio": "Paediatric specialist with focus on malnutrition and child growth.", "fee": 2000},
            {"full_name": "Dr. Lucy Njeru",       "specialty": "Family Medicine",
             "qualification": "MBChB, MMed Family Medicine (UoN)",
             "bio": "Holistic family care across all age groups and preventive health.", "fee": 1800},
        ],
    },
    {
        "name": "Karen Hospital Clinic",
        "address": "Karen Rd, Karen, Nairobi",
        "county": "Nairobi", "latitude": -1.3176, "longitude": 36.7029,
        "phone": "+254711300003", "email": "care@karenhospitalclinic.co.ke",
        "license_number": "KMB/PRIV/2016/0031",
        "subscription_plan": SubscriptionPlan.ENTERPRISE,
        "specialties": ["General Practice", "Orthopaedics", "Internal Medicine", "Obstetrics & Gynaecology"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Elizabeth Muthoni",  "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "Experienced GP serving Karen's executive community.", "fee": 2000},
            {"full_name": "Dr. Geoffrey Kimani",    "specialty": "Orthopaedics",
             "qualification": "MBChB, MMed Orthopaedics (UoN)",
             "bio": "Sports injuries, joint pain, and musculoskeletal conditions.", "fee": 3500},
            {"full_name": "Dr. Rose Njoroge",       "specialty": "Obstetrics & Gynaecology",
             "qualification": "MBChB, MMed O&G (Aga Khan University)",
             "bio": "Women's health specialist. Antenatal care and family planning.", "fee": 3000},
        ],
    },
    {
        "name": "Kilimani Health Clinic",
        "address": "Ngong Rd, Kilimani, Nairobi",
        "county": "Nairobi", "latitude": -1.2921, "longitude": 36.7892,
        "phone": "+254733200004", "email": "appointments@kilimanihc.co.ke",
        "license_number": "KMB/PRIV/2020/0115",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Obstetrics & Gynaecology", "Dermatology"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Amina Hassan",   "specialty": "Obstetrics & Gynaecology",
             "qualification": "MBChB, MMed O&G (Aga Khan University)",
             "bio": "Women's health specialist. Antenatal care and reproductive health.", "fee": 3000},
            {"full_name": "Dr. James Kariuki",  "specialty": "General Practice",
             "qualification": "MBChB (JKUAT)",
             "bio": "8 years general practice. Chronic disease management and preventive care.", "fee": 1500},
        ],
    },
    {
        "name": "Mombasa Road Health Centre",
        "address": "Enterprise Rd, Industrial Area, Nairobi",
        "county": "Nairobi", "latitude": -1.3012, "longitude": 36.8481,
        "phone": "+254720500010", "email": "info@mombasaroadhealth.co.ke",
        "license_number": "KMB/PRIV/2021/0198",
        "subscription_plan": SubscriptionPlan.BASIC,
        "specialties": ["General Practice", "Occupational Health", "Family Medicine"],
        "hours": WEEKDAYS,
        "doctors": [
            {"full_name": "Dr. Reuben Mutua",       "specialty": "General Practice",
             "qualification": "MBChB (Moi University)",
             "bio": "Serving the Industrial Area workforce. Occupational health certificates.", "fee": 1200},
            {"full_name": "Dr. Catherine Aoko",     "specialty": "Family Medicine",
             "qualification": "MBChB, MMed Family Medicine (JKUAT)",
             "bio": "Preventive care and chronic disease management.", "fee": 1500},
        ],
    },
    {
        "name": "Kasarani Community Health",
        "address": "Thika Superhighway, Kasarani, Nairobi",
        "county": "Nairobi", "latitude": -1.2262, "longitude": 36.8943,
        "phone": "+254700400006", "email": "hello@kasaranihealth.co.ke",
        "license_number": "KMB/PRIV/2021/0203",
        "subscription_plan": SubscriptionPlan.BASIC,
        "specialties": ["General Practice", "Pediatrics", "Family Medicine"],
        "hours": WEEKDAYS,
        "doctors": [
            {"full_name": "Dr. Samuel Otieno",  "specialty": "General Practice",
             "qualification": "MBChB (Moi University)",
             "bio": "Community-focused GP serving Kasarani and Roysambu.", "fee": 1200},
            {"full_name": "Dr. Grace Mutua",    "specialty": "Family Medicine",
             "qualification": "MBChB, MMed Family Medicine (UoN)",
             "bio": "Holistic family care across all age groups.", "fee": 1800},
        ],
    },
    {
        "name": "Nairobi CBD Wellness Clinic",
        "address": "Kimathi Street, Nairobi CBD",
        "county": "Nairobi", "latitude": -1.2833, "longitude": 36.8219,
        "phone": "+254720500007", "email": "info@cbdwellness.co.ke",
        "license_number": "KMB/PRIV/2019/0087",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Dermatology", "Occupational Health"],
        "hours": WEEKDAYS,
        "doctors": [
            {"full_name": "Dr. John Mwangi",    "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "Walk-in GP for city workers. Fast turnaround, occupational health certs.", "fee": 1500},
            {"full_name": "Dr. Mercy Achieng",  "specialty": "Dermatology",
             "qualification": "MBChB, MMed Dermatology (UoN)",
             "bio": "Skin, hair, and nail specialist. Treats acne, eczema, psoriasis.", "fee": 3000},
        ],
    },
    {
        "name": "Parklands Specialist Centre",
        "address": "3rd Parklands Ave, Parklands, Nairobi",
        "county": "Nairobi", "latitude": -1.2608, "longitude": 36.8197,
        "phone": "+254721600008", "email": "info@parklandsspecialist.co.ke",
        "license_number": "KMB/PRIV/2017/0074",
        "subscription_plan": SubscriptionPlan.ENTERPRISE,
        "specialties": ["General Practice", "Cardiology", "Neurology", "Internal Medicine"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Nilesh Patel",    "specialty": "Cardiology",
             "qualification": "MBChB, MMed Cardiology (Aga Khan University)",
             "bio": "Interventional cardiologist. Hypertension and cardiac risk management.", "fee": 3500},
            {"full_name": "Dr. Priya Shah",      "specialty": "Internal Medicine",
             "qualification": "MBChB, MMed Internal Medicine (UoN)",
             "bio": "Diabetes, thyroid, and metabolic disorders specialist.", "fee": 3000},
        ],
    },
    # ── Mombasa (3) ──────────────────────────────────────────────────────────
    {
        "name": "Nyali Medical Centre",
        "address": "Links Rd, Nyali, Mombasa",
        "county": "Mombasa", "latitude": -4.0307, "longitude": 39.7167,
        "phone": "+254741600009", "email": "nyali@nyalimedical.co.ke",
        "license_number": "KMB/PRIV/2017/0056",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Pediatrics", "Internal Medicine"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Omar Sheikh",    "specialty": "General Practice",
             "qualification": "MBChB (Aga Khan University Nairobi)",
             "bio": "15 years serving the Coast region. Speaks English, Swahili, Arabic.", "fee": 1500},
            {"full_name": "Dr. Fatuma Ali",     "specialty": "Pediatrics",
             "qualification": "MBChB, MMed Paediatrics (UoN)",
             "bio": "Coast paediatric specialist. Expertise in tropical childhood illness.", "fee": 2000},
        ],
    },
    {
        "name": "Coastal Medical Centre",
        "address": "Moi Avenue, Mombasa CBD",
        "county": "Mombasa", "latitude": -4.0634, "longitude": 39.6662,
        "phone": "+254753700010", "email": "info@coastalmedical.co.ke",
        "license_number": "KMB/PRIV/2018/0091",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Obstetrics & Gynaecology", "Dermatology"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Salim Bakar",        "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "Serving Mombasa CBD and Old Town. Speaks English, Swahili, Arabic.", "fee": 1500},
            {"full_name": "Dr. Mariam Said",        "specialty": "Obstetrics & Gynaecology",
             "qualification": "MBChB, MMed O&G (Aga Khan University)",
             "bio": "Maternal health specialist. Antenatal care and safe delivery.", "fee": 2500},
        ],
    },
    {
        "name": "Mombasa Island Clinic",
        "address": "Nkrumah Rd, Mombasa CBD",
        "county": "Mombasa", "latitude": -4.0532, "longitude": 39.6648,
        "phone": "+254752700011", "email": "info@mombasaislandclinic.co.ke",
        "license_number": "KMB/PRIV/2022/0267",
        "subscription_plan": SubscriptionPlan.BASIC,
        "specialties": ["General Practice", "Obstetrics & Gynaecology"],
        "hours": WEEKDAYS,
        "doctors": [
            {"full_name": "Dr. David Omondi",       "specialty": "General Practice",
             "qualification": "MBChB (Moi University)",
             "bio": "Affordable primary care for Mombasa Island residents.", "fee": 1200},
            {"full_name": "Dr. Zainab Mohammed",    "specialty": "Obstetrics & Gynaecology",
             "qualification": "MBChB, MMed O&G (University of Nairobi)",
             "bio": "Maternal health specialist. Safe delivery and antenatal education.", "fee": 2500},
        ],
    },
    # ── Kisumu (2) ───────────────────────────────────────────────────────────
    {
        "name": "Kisumu Specialists Clinic",
        "address": "Oginga Odinga St, Kisumu Town, Kisumu",
        "county": "Kisumu", "latitude": -0.0917, "longitude": 34.7680,
        "phone": "+254763800012", "email": "info@kisumuspecialists.co.ke",
        "license_number": "KMB/PRIV/2015/0019",
        "subscription_plan": SubscriptionPlan.PRO,
        "specialties": ["General Practice", "Internal Medicine", "Pediatrics", "Malaria Clinic"],
        "hours": WEEKDAYS_SAT,
        "doctors": [
            {"full_name": "Dr. Boniface Opiyo",  "specialty": "Internal Medicine",
             "qualification": "MBChB, MMed Internal Medicine (Moi University)",
             "bio": "Malaria and tropical disease specialist serving the Lake Victoria region.", "fee": 2000},
            {"full_name": "Dr. Winnie Auma",     "specialty": "Pediatrics",
             "qualification": "MBChB, MMed Paediatrics (UoN)",
             "bio": "Child health specialist. HIV-exposed infant care and nutrition support.", "fee": 1800},
            {"full_name": "Dr. Charles Omondi",  "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "Preventive health in Nyanza region. HIV/TB management.", "fee": 1500},
        ],
    },
    {
        "name": "Kisumu Lake View Medical Centre",
        "address": "Lake Rd, Milimani, Kisumu",
        "county": "Kisumu", "latitude": -0.1022, "longitude": 34.7580,
        "phone": "+254764900013", "email": "info@kisumulakeview.co.ke",
        "license_number": "KMB/PRIV/2020/0188",
        "subscription_plan": SubscriptionPlan.BASIC,
        "specialties": ["General Practice", "Family Medicine"],
        "hours": WEEKDAYS,
        "doctors": [
            {"full_name": "Dr. Akinyi Adhiambo",    "specialty": "General Practice",
             "qualification": "MBChB (University of Nairobi)",
             "bio": "Community GP serving Milimani and Kondele. Affordable quality care.", "fee": 1200},
        ],
    },
]


# ── Patient definitions ───────────────────────────────────────────────────────

PATIENT_DATA = [
    {"full_name": "Jane Wanjiku Kamau",        "email": "jane.wanjiku@demo.medassist.co.ke",
     "phone": "+254712001001", "location": "Nairobi",  "password": "demo1234"},
    {"full_name": "Michael Odhiambo Otieno",   "email": "michael.odhiambo@demo.medassist.co.ke",
     "phone": "+254723002002", "location": "Kisumu",   "password": "demo1234"},
    {"full_name": "Sarah Mwende Kioko",        "email": "sarah.mwende@demo.medassist.co.ke",
     "phone": "+254734003003", "location": "Mombasa",  "password": "demo1234"},
    {"full_name": "Peter Njoroge Kimani",       "email": "peter.njoroge@demo.medassist.co.ke",
     "phone": "+254745004004", "location": "Nairobi",  "password": "demo1234"},
    {"full_name": "Amina Yusuf Hassan",         "email": "amina.yusuf@demo.medassist.co.ke",
     "phone": "+254756005005", "location": "Mombasa",  "password": "demo1234"},
    {"full_name": "David Kiplagat Ruto",        "email": "david.kiplagat@demo.medassist.co.ke",
     "phone": "+254767006006", "location": "Nairobi",  "password": "demo1234"},
    {"full_name": "Grace Achieng Obiero",       "email": "grace.achieng@demo.medassist.co.ke",
     "phone": "+254778007007", "location": "Kisumu",   "password": "demo1234"},
    {"full_name": "Hassan Abdirahman Mohamed",  "email": "hassan.abdi@demo.medassist.co.ke",
     "phone": "+254789008008", "location": "Mombasa",  "password": "demo1234"},
]


# ── OTC Products ──────────────────────────────────────────────────────────────

PRODUCTS = [
    # Pain Relief
    ("Panadol 500mg (20 tabs)",          "pain_relief", "Fast-acting paracetamol for headache, fever and body pain.",                                   50,   0),
    ("Voltaren Gel 1% (50g)",            "pain_relief", "Diclofenac topical anti-inflammatory gel for joint and muscle pain.",                         650,  0),
    ("Hedex Ibuprofen 400mg (12 tabs)",  "pain_relief", "NSAID anti-inflammatory for pain, fever and inflammation relief.",                            120,  0),
    ("Brufen 400mg (20 tabs)",           "pain_relief", "Ibuprofen for mild-to-moderate pain, toothache and menstrual cramps.",                         90,  0),
    ("Aspirin 300mg (20 tabs)",          "pain_relief", "Classic aspirin for pain relief, fever reduction and mild blood thinning.",                    50,  0),
    ("Mefenamic Acid 500mg (20 caps)",   "pain_relief", "For period pain, dental pain and mild-to-moderate musculoskeletal pain.",                     150,  0),
    # Vitamins & Supplements
    ("Centrum Multivitamin (30 tabs)",   "vitamins",    "Complete daily multivitamin with 24 essential micronutrients.",                              1350,  0),
    ("Vitamin C 1000mg (30 tabs)",       "vitamins",    "High-dose vitamin C for immune support and antioxidant protection.",                          480,  0),
    ("B-Complex + Folic Acid (30 tabs)", "vitamins",    "Full B-complex formula supporting energy and nervous system health.",                         320,  0),
    ("Zinc Sulfate 50mg (30 tabs)",      "vitamins",    "Essential zinc supplement for immunity and wound healing support.",                           280,  0),
    ("Calcium + Vitamin D3 (60 tabs)",   "vitamins",    "Bone health supplement combining calcium and vitamin D3.",                                    750,  0),
    ("Iron + Folic Acid (30 tabs)",      "vitamins",    "Iron supplement with folic acid for anaemia prevention in pregnancy.",                        220,  0),
    # Cold & Flu
    ("Strepsils Throat Lozenges (16s)", "cold_flu",    "Antibacterial throat lozenges for sore throat and dry cough.",                                180,  0),
    ("Actifed Syrup 100ml",             "cold_flu",    "Decongestant and antihistamine syrup for cold and flu relief.",                               280,  0),
    ("Vicks VapoRub 50g",               "cold_flu",    "Medicated rub for nasal congestion, cough and muscle aches.",                                 420,  6),
    ("Cold Cap Tablets (20 tabs)",      "cold_flu",    "Combination cold remedy for sneezing, blocked nose and headache.",                            180,  6),
    # Digestive Health
    ("Rennies Antacid (24 tabs)",       "digestive",   "Fast-acting calcium carbonate antacid for heartburn and indigestion.",                        120,  0),
    ("ORS Sachets (10 pack)",           "digestive",   "Oral rehydration salts to replace fluids and electrolytes lost to diarrhoea.",                 30,  0),
    ("ENO Antacid Lemon 150g",          "digestive",   "Effervescent antacid granules for rapid heartburn and indigestion relief.",                   180,  0),
    ("Loperamide 2mg (12 caps)",        "digestive",   "Anti-diarrhoeal capsules for traveller's diarrhoea and IBS.",                                 140,  0),
    ("Buscopan 10mg (20 tabs)",         "digestive",   "Antispasmodic for stomach cramps, colic and IBS.",                                            380,  0),
    # Skin Care
    ("Dettol Antiseptic Liquid 200ml",  "skin_care",   "Broad-spectrum antiseptic for wound cleansing and surface disinfection.",                     320,  6),
    ("Canesten Antifungal Cream 20g",   "skin_care",   "Clotrimazole cream for athlete's foot, ringworm and skin thrush.",                            520,  0),
    ("Betnovate-C Cream 15g",           "skin_care",   "Corticosteroid cream for eczema, dermatitis and skin inflammation.",                          420,  0),
    ("Sudocrem Antiseptic 125g",        "skin_care",   "Antiseptic healing cream for nappy rash, cuts and minor burns.",                              620,  6),
    ("Hydrocortisone Cream 1% (15g)",   "skin_care",   "Mild steroid cream for itching, insect bites and allergic rashes.",                           280,  6),
    # Baby & Child
    ("Calpol Paediatric 100ml",         "baby_care",   "Paracetamol suspension for children's pain and fever.",                                       480,  0),
    ("Infacol Colic Relief 50ml",       "baby_care",   "Anti-colic drops to relieve infant wind and tummy discomfort.",                               750,  0),
    ("Baby Saline Nasal Drops 10ml",    "baby_care",   "Gentle isotonic saline to relieve nasal congestion in infants.",                              320,  0),
    # First Aid
    ("Elastoplast Bandaids (30 pack)",  "first_aid",   "Assorted sterile adhesive bandages for cuts and minor wounds.",                               280,  6),
    ("Savlon Antiseptic Cream 30g",     "first_aid",   "Antiseptic cream for burns, cuts and minor skin infections.",                                 300,  6),
]
# column 5 = secondary clinic index (0 = Westlands, 6 = CBD Wellness)


# ── Triage bulk profiles ──────────────────────────────────────────────────────

MILD_PROFILES = [
    (["Headache"],                          [("Headache", 1, 3, "head")]),
    (["Fatigue"],                           [("Fatigue", 2, 2, None)]),
    (["Sore Throat"],                       [("Sore Throat", 2, 3, "throat")]),
    (["Mild Cough"],                        [("Cough", 1, 2, "throat")]),
    (["Runny Nose", "Sneezing"],            [("Runny Nose", 1, 2, "nose"), ("Sneezing", 1, 2, None)]),
    (["Mild Back Pain"],                    [("Back Pain", 3, 4, "lower back")]),
    (["Skin Rash"],                         [("Skin Rash", 2, 3, "arms")]),
    (["Mild Stomach Ache"],                 [("Stomach Ache", 1, 3, "abdomen")]),
    (["Eye Strain", "Mild Headache"],       [("Eye Strain", 2, 2, "eyes"), ("Headache", 1, 2, "head")]),
    (["Mild Nausea"],                       [("Nausea", 1, 2, None)]),
    (["Insomnia", "Fatigue"],               [("Insomnia", 5, 3, None), ("Fatigue", 5, 3, None)]),
    (["Mild Dizziness"],                    [("Dizziness", 1, 3, "head")]),
]

MODERATE_PROFILES = [
    (["Fever", "Headache"],                 [("Fever", 2, 6, None), ("Headache", 2, 5, "head")]),
    (["Persistent Cough", "Fever"],         [("Cough", 5, 6, "chest"), ("Fever", 3, 7, None)]),
    (["Stomach Pain", "Vomiting", "Nausea"],[("Stomach Pain", 1, 7, "abdomen"), ("Vomiting", 1, 6, None), ("Nausea", 1, 5, None)]),
    (["Body Aches", "Chills", "Fatigue"],   [("Body Aches", 2, 6, "whole body"), ("Chills", 2, 5, None), ("Fatigue", 2, 4, None)]),
    (["Fever", "Chills", "Sweating"],       [("Fever", 2, 8, None), ("Chills", 2, 7, None), ("Sweating", 1, 5, None)]),
    (["Chest Tightness", "Cough"],          [("Chest Tightness", 2, 7, "chest"), ("Cough", 7, 5, "chest")]),
    (["Joint Pain", "Swelling"],            [("Joint Pain", 7, 7, "knees"), ("Swelling", 5, 6, "knees")]),
    (["Severe Headache", "Fever"],          [("Severe Headache", 1, 8, "head"), ("Fever", 1, 7, None)]),
    (["Abdominal Pain", "Diarrhoea"],       [("Abdominal Pain", 1, 6, "abdomen"), ("Diarrhoea", 1, 5, None)]),
    (["High Fever", "Muscle Aches"],        [("Fever", 3, 7, None), ("Muscle Aches", 3, 6, "legs")]),
]

URGENT_PROFILES = [
    (["Chest Pain", "Difficulty Breathing"],[("Chest Pain", 1, 9, "chest"), ("Difficulty Breathing", 1, 8, "chest")]),
    (["High Fever", "Severe Headache", "Neck Stiffness"],
                                            [("Fever", 1, 8, None), ("Severe Headache", 1, 9, "head"), ("Neck Stiffness", 1, 8, "neck")]),
    (["Chest Pain", "Left Arm Pain"],       [("Chest Pain", 1, 10, "chest"), ("Left Arm Pain", 1, 8, "left arm")]),
    (["Seizure"],                           [("Seizure", 0, 10, None)]),
    (["Severe Abdominal Pain", "Bloody Stools"],
                                            [("Severe Abdominal Pain", 1, 8, "abdomen"), ("Bloody Stools", 1, 8, None)]),
    (["Difficulty Breathing", "Coughing Blood"],
                                            [("Difficulty Breathing", 3, 9, "chest"), ("Coughing Blood", 2, 9, "chest")]),
]

MILD_RECS      = ["Rest well and stay hydrated", "Monitor symptoms for 48 hours", "Take OTC pain relief if needed"]
MODERATE_RECS  = ["See a doctor within 24 hours", "Monitor temperature and hydration", "Avoid self-medicating with antibiotics"]
URGENT_RECS    = ["URGENT: Seek emergency medical care immediately", "Call 999 or go to the nearest A&E now", "Do not drive yourself"]

COUNTIES = [("Nairobi", 60), ("Mombasa", 20), ("Kisumu", 10), ("Nakuru", 5), ("Eldoret", 3), ("Thika", 2)]
GENDERS  = [("male", 45), ("female", 55)]

def weighted_pick(weighted_list):
    total = sum(w for _, w in weighted_list)
    r = random.randint(1, total)
    cumulative = 0
    for val, weight in weighted_list:
        cumulative += weight
        if r <= cumulative:
            return val
    return weighted_list[0][0]

def pick_age():
    r = random.random()
    if r < 0.15:   return random.randint(1, 14)
    if r < 0.55:   return random.randint(15, 35)
    if r < 0.85:   return random.randint(36, 55)
    return random.randint(56, 85)

def make_hours(days: list) -> dict:
    return {d: {"open": "08:00", "close": "17:00"} for d in days}


# ── Seed ─────────────────────────────────────────────────────────────────────

def seed():
    db = SessionLocal()
    try:
        today = date.today()

        # ── Super Admin ───────────────────────────────────────────────────────
        super_admin = User(
            full_name="MedAssist Admin",
            email="admin@medassist.co.ke",
            phone="+254700000000",
            password_hash=hash_password("superadmin123"),
            role=UserRole.SUPER_ADMIN,
            location="Nairobi",
            is_active=True,
        )
        db.add(super_admin)
        db.flush()

        # ── Clinics, admins, doctors ──────────────────────────────────────────
        clinics = []
        doctor_map = {}   # clinic_name -> [Doctor, ...]

        for i, cd in enumerate(CLINIC_DATA):
            admin = User(
                full_name=f"{cd['name']} Admin",
                email=f"admin{i+1}@demo.medassist.co.ke",
                phone=f"+25471100{i+1:04d}",
                password_hash=hash_password("demo1234"),
                role=UserRole.CLINIC_ADMIN,
                location=cd["county"],
                is_active=True,
            )
            db.add(admin)
            db.flush()

            clinic = Clinic(
                owner_id=admin.id,
                name=cd["name"],
                address=cd["address"],
                county=cd["county"],
                latitude=cd["latitude"],
                longitude=cd["longitude"],
                phone=cd["phone"],
                email=cd["email"],
                license_number=cd["license_number"],
                is_verified=True,
                is_active=True,
                subscription_plan=cd["subscription_plan"],
                subscription_expires_at=datetime.utcnow() + timedelta(days=365),
                operating_hours=make_hours(cd["hours"]),
                specialties=cd["specialties"],
            )
            db.add(clinic)
            db.flush()
            clinics.append(clinic)

            doctors_for_clinic = []
            for dd in cd["doctors"]:
                doctor = Doctor(
                    clinic_id=clinic.id,
                    full_name=dd["full_name"],
                    specialty=dd["specialty"],
                    qualification=dd["qualification"],
                    bio=dd["bio"],
                    available_days=cd["hours"],
                    consultation_fee_kes=float(dd["fee"]),
                    is_active=True,
                )
                db.add(doctor)
                db.flush()
                doctors_for_clinic.append(doctor)
            doctor_map[cd["name"]] = doctors_for_clinic

        # Convenience aliases for appointments
        westlands    = clinics[0]
        nairobi_west = clinics[1]
        karen        = clinics[2]
        kilimani     = clinics[3]
        kisumu_spec  = clinics[11]
        coastal      = clinics[9]

        w_docs = doctor_map[westlands.name]     # [Kamau, Wanjiku, Brian]
        nw_docs = doctor_map[nairobi_west.name] # [Josephine, Eliud, Lucy]
        k_docs  = doctor_map[karen.name]        # [Elizabeth, Geoffrey, Rose]
        ks_docs = doctor_map[kisumu_spec.name]  # [Boniface, Winnie, Charles]
        c_docs  = doctor_map[coastal.name]      # [Salim, Mariam]

        # ── Patients ──────────────────────────────────────────────────────────
        patients = []
        for pd in PATIENT_DATA:
            patient = User(
                full_name=pd["full_name"],
                email=pd["email"],
                phone=pd["phone"],
                password_hash=hash_password(pd["password"]),
                role=UserRole.PATIENT,
                location=pd["location"],
                is_active=True,
            )
            db.add(patient)
            db.flush()
            patients.append(patient)

        # ── Appointments ──────────────────────────────────────────────────────
        # Critical: multiple appointments TODAY for Westlands (admin1's clinic dashboard demo)
        today_appts = [
            # (patient, clinic, doctor, time, status, reason, amount_kes)
            (patients[0], westlands, w_docs[0], time(8, 30),  AppointmentStatus.CONFIRMED,  "Fever and persistent headache — 3 days",               1500),
            (patients[3], westlands, w_docs[1], time(9, 0),   AppointmentStatus.CONFIRMED,  "Childhood vaccination — 18-month check",                2000),
            (patients[5], westlands, w_docs[0], time(9, 30),  AppointmentStatus.PENDING,    "Chest tightness and dry cough",                         1500),
            (patients[1], westlands, w_docs[2], time(10, 0),  AppointmentStatus.CONFIRMED,  "Malaria follow-up — blood test results",                2500),
            (patients[6], westlands, w_docs[1], time(10, 30), AppointmentStatus.PENDING,    "Child fever and rash — possible viral infection",       2000),
            (patients[2], westlands, w_docs[0], time(11, 0),  AppointmentStatus.CONFIRMED,  "Antenatal visit — 24 weeks",                            1500),
            (patients[7], westlands, w_docs[2], time(14, 0),  AppointmentStatus.PENDING,    "Hypertension check — medication review",                2500),
            (patients[4], westlands, w_docs[1], time(15, 0),  AppointmentStatus.CONFIRMED,  "Skin rash — possible allergic reaction",                2000),
        ]
        for pat, clin, doc, appt_time, status, reason, amount in today_appts:
            db.add(Appointment(
                patient_id=pat.id, clinic_id=clin.id, doctor_id=doc.id,
                appointment_date=today, appointment_time=appt_time,
                status=status, reason=reason,
                amount_kes=float(amount),
                payment_status="paid" if status == AppointmentStatus.COMPLETED else "pending",
            ))

        # Historic + upcoming appointments (cross-clinic)
        other_appts = [
            (patients[0], nairobi_west, nw_docs[0], today + timedelta(days=3),  time(10, 0),  AppointmentStatus.CONFIRMED,  "Follow-up — headache management",           1500),
            (patients[0], karen,        k_docs[0],  today + timedelta(days=7),  time(11, 30), AppointmentStatus.PENDING,    "General health check",                      2000),
            (patients[1], kisumu_spec,  ks_docs[0], today - timedelta(days=3),  time(9, 0),   AppointmentStatus.COMPLETED,  "Malaria — diagnosis and treatment",          2000),
            (patients[1], kisumu_spec,  ks_docs[1], today + timedelta(days=2),  time(14, 0),  AppointmentStatus.CONFIRMED,  "Paediatric check for child",                 1800),
            (patients[2], coastal,      c_docs[1],  today - timedelta(days=7),  time(9, 30),  AppointmentStatus.COMPLETED,  "Antenatal visit — 20 weeks",                 2500),
            (patients[2], coastal,      c_docs[1],  today + timedelta(days=14), time(9, 30),  AppointmentStatus.PENDING,    "Antenatal visit — 28 weeks",                 2500),
            (patients[3], karen,        k_docs[1],  today - timedelta(days=1),  time(15, 0),  AppointmentStatus.COMPLETED,  "Knee pain — sports injury assessment",       3500),
            (patients[4], coastal,      c_docs[0],  today - timedelta(days=2),  time(11, 30), AppointmentStatus.CANCELLED,  "Routine check-up",                           1500),
            (patients[5], kilimani,     doctor_map[kilimani.name][1], today - timedelta(days=5), time(10, 0), AppointmentStatus.COMPLETED, "Work medical certificate",  1500),
            (patients[6], kisumu_spec,  ks_docs[2], today - timedelta(days=4),  time(8, 30),  AppointmentStatus.COMPLETED,  "Chest pain assessment",                      1500),
        ]
        for pat, clin, doc, appt_date, appt_time, status, reason, amount in other_appts:
            db.add(Appointment(
                patient_id=pat.id, clinic_id=clin.id, doctor_id=doc.id,
                appointment_date=appt_date, appointment_time=appt_time,
                status=status, reason=reason,
                amount_kes=float(amount),
                payment_status="paid" if status == AppointmentStatus.COMPLETED else "pending",
            ))

        # ── Detailed triage sessions (for demo scenarios) ─────────────────────
        detail_sessions = [
            {
                "user": patients[0], "county": "Nairobi", "age": 32, "gender": "female",
                "severity": SeverityLevel.MODERATE, "action": RecommendedAction.VISIT_CLINIC,
                "symptoms": ["Fever", "Persistent Headache", "Fatigue"],
                "recs": ["Stay hydrated and rest", "Take paracetamol for fever above 38°C", "Visit a clinic if symptoms persist beyond 48 hours"],
                "logs": [("Fever", 3, 6, None), ("Persistent Headache", 3, 7, "head"), ("Fatigue", 3, 4, None)],
                "days_ago": 1,
            },
            {
                "user": patients[1], "county": "Kisumu", "age": 45, "gender": "male",
                "severity": SeverityLevel.URGENT, "action": RecommendedAction.VISIT_CLINIC,
                "symptoms": ["High Fever", "Chills", "Muscle Aches", "Sweating"],
                "recs": ["Seek immediate medical attention — malaria risk is high in your area", "Get a malaria RDT test", "Do not self-medicate without diagnosis"],
                "logs": [("High Fever", 2, 8, None), ("Chills", 2, 7, None), ("Muscle Aches", 2, 6, "legs"), ("Sweating", 1, 5, None)],
                "days_ago": 3,
            },
            {
                "user": patients[2], "county": "Mombasa", "age": 28, "gender": "female",
                "severity": SeverityLevel.MILD, "action": RecommendedAction.REST_AT_HOME,
                "symptoms": ["Lower Back Pain", "Mild Nausea"],
                "recs": ["Rest and avoid heavy lifting", "Apply warm compress", "Eat small frequent meals"],
                "logs": [("Lower Back Pain", 5, 4, "lower back"), ("Mild Nausea", 5, 3, None)],
                "days_ago": 6,
            },
            {
                "user": None, "county": "Nairobi", "age": 58, "gender": "male",
                "severity": SeverityLevel.URGENT, "action": RecommendedAction.EMERGENCY,
                "symptoms": ["Chest Pain", "Difficulty Breathing"],
                "recs": ["URGENT: Seek emergency medical care immediately", "Call 999 or go to A&E now", "Do not drive yourself"],
                "logs": [("Chest Pain", 1, 9, "chest"), ("Difficulty Breathing", 1, 8, "chest")],
                "days_ago": 0,
            },
            {
                "user": patients[3], "county": "Nairobi", "age": 56, "gender": "male",
                "severity": SeverityLevel.MODERATE, "action": RecommendedAction.VISIT_CLINIC,
                "symptoms": ["Knee Pain", "Swelling"],
                "recs": ["Rest and elevate the affected leg", "Apply ice pack 20 min every 2 hours", "See a doctor if swelling does not reduce within 24 hours"],
                "logs": [("Knee Pain", 7, 7, "left knee"), ("Swelling", 5, 6, "left knee")],
                "days_ago": 2,
            },
        ]
        for ts in detail_sessions:
            session = TriageSession(
                user_id=ts["user"].id if ts["user"] else None,
                symptoms=ts["symptoms"],
                severity_level=ts["severity"],
                recommendations=ts["recs"],
                recommended_action=ts["action"],
                user_age=ts["age"],
                user_gender=ts["gender"],
                county=ts["county"],
                did_visit_doctor=random.choice([True, False, None]),
                session_duration_seconds=random.randint(45, 200),
                created_at=datetime.utcnow() - timedelta(days=ts["days_ago"]),
            )
            db.add(session)
            db.flush()
            for sym_name, dur, score, body in ts["logs"]:
                db.add(SymptomLog(
                    triage_session_id=session.id, symptom_name=sym_name,
                    duration_days=dur, severity_score=score, body_part=body,
                ))

        # ── Bulk triage sessions (2,400 anonymised) ───────────────────────────
        # Distribution: 45% mild, 40% moderate, 15% urgent
        # County: 60% Nairobi, 20% Mombasa, 10% Kisumu, 5% Nakuru, 3% Eldoret, 2% Thika
        print("  Generating 2,400 triage sessions...", end=" ", flush=True)
        bulk_sessions = []
        bulk_logs = []

        severity_dist = (
            [(SeverityLevel.MILD, MILD_PROFILES, MILD_RECS, RecommendedAction.REST_AT_HOME)] * 45 +
            [(SeverityLevel.MODERATE, MODERATE_PROFILES, MODERATE_RECS, RecommendedAction.VISIT_CLINIC)] * 40 +
            [(SeverityLevel.URGENT, URGENT_PROFILES, URGENT_RECS, RecommendedAction.EMERGENCY)] * 15
        )

        for i in range(2400):
            severity, profiles, recs, action = random.choice(severity_dist)
            profile_syms, profile_logs = random.choice(profiles)
            county = weighted_pick(COUNTIES)
            age = pick_age()
            gender = weighted_pick(GENDERS)
            days_ago = random.randint(0, 89)
            session_id = uuid.uuid4()

            bulk_sessions.append({
                "id": session_id,
                "user_id": None,
                "symptoms": profile_syms,
                "severity_level": severity,
                "recommendations": recs,
                "recommended_action": action,
                "user_age": age,
                "user_gender": gender,
                "county": county,
                "did_visit_doctor": random.choice([True, False, None]),
                "session_duration_seconds": random.randint(30, 300),
                "created_at": datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(0, 23)),
            })

            for sym_name, dur, score, body in profile_logs:
                bulk_logs.append({
                    "id": uuid.uuid4(),
                    "triage_session_id": session_id,
                    "symptom_name": sym_name,
                    "duration_days": max(1, dur + random.randint(-1, 2)),
                    "severity_score": max(1, min(10, score + random.randint(-1, 1))),
                    "body_part": body,
                    "created_at": datetime.utcnow() - timedelta(days=days_ago),
                })

        db.bulk_insert_mappings(TriageSession, bulk_sessions)
        db.bulk_insert_mappings(SymptomLog, bulk_logs)
        print(f"done ({len(bulk_sessions)} sessions, {len(bulk_logs)} symptom logs)")

        # ── Medicine Orders ───────────────────────────────────────────────────
        order_data = [
            {"patient": patients[0], "clinic": westlands,
             "items": [{"name": "Panadol 500mg (20 tabs)", "qty": 2, "unit_price": 50.0, "total": 100.0},
                       {"name": "Vitamin C 1000mg (30 tabs)", "qty": 1, "unit_price": 480.0, "total": 480.0}],
             "total": 580.0, "status": OrderStatus.DELIVERED,
             "method": DeliveryMethod.DELIVERY, "payment": PaymentMethod.MPESA,
             "mpesa_ref": "QHJ8X2K4PL", "address": "Apt 4B, Westlands Gardens, Nairobi"},
            {"patient": patients[1], "clinic": kisumu_spec,
             "items": [{"name": "ORS Sachets (10 pack)", "qty": 2, "unit_price": 30.0, "total": 60.0},
                       {"name": "Panadol 500mg (20 tabs)", "qty": 3, "unit_price": 50.0, "total": 150.0}],
             "total": 210.0, "status": OrderStatus.DELIVERED,
             "method": DeliveryMethod.PICKUP, "payment": PaymentMethod.MPESA,
             "mpesa_ref": "PRT5N9M1QZ", "address": None},
            {"patient": patients[2], "clinic": coastal,
             "items": [{"name": "Iron + Folic Acid (30 tabs)", "qty": 1, "unit_price": 220.0, "total": 220.0},
                       {"name": "B-Complex + Folic Acid (30 tabs)", "qty": 1, "unit_price": 320.0, "total": 320.0}],
             "total": 540.0, "status": OrderStatus.READY,
             "method": DeliveryMethod.PICKUP, "payment": PaymentMethod.MPESA,
             "mpesa_ref": "LKW2B7C5FN", "address": None},
            {"patient": patients[3], "clinic": karen,
             "items": [{"name": "Voltaren Gel 1% (50g)", "qty": 1, "unit_price": 650.0, "total": 650.0},
                       {"name": "Buscopan 10mg (20 tabs)", "qty": 1, "unit_price": 380.0, "total": 380.0}],
             "total": 1030.0, "status": OrderStatus.PROCESSING,
             "method": DeliveryMethod.DELIVERY, "payment": PaymentMethod.MPESA,
             "mpesa_ref": "MNV4X8Y2HJ", "address": "House 12, Karen Close, Nairobi"},
            {"patient": patients[4], "clinic": coastal,
             "items": [{"name": "Canesten Antifungal Cream 20g", "qty": 1, "unit_price": 520.0, "total": 520.0},
                       {"name": "Hydrocortisone Cream 1% (15g)", "qty": 1, "unit_price": 280.0, "total": 280.0}],
             "total": 800.0, "status": OrderStatus.PENDING,
             "method": DeliveryMethod.DELIVERY, "payment": PaymentMethod.MPESA,
             "mpesa_ref": None, "address": "Flat 7, Nyali Heights, Mombasa"},
        ]
        for od in order_data:
            db.add(MedicineOrder(
                patient_id=od["patient"].id, clinic_id=od["clinic"].id,
                items=od["items"], total_amount_kes=od["total"],
                status=od["status"], delivery_method=od["method"],
                delivery_address=od["address"], payment_method=od["payment"],
                mpesa_transaction_id=od["mpesa_ref"],
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 10)),
            ))

        # ── OTC Products ──────────────────────────────────────────────────────
        for name, cat, desc, price, clinic_idx in PRODUCTS:
            db.add(Product(
                clinic_id=clinics[clinic_idx].id,
                name=name, category=cat, description=desc,
                price_kes=float(price),
                stock_quantity=random.randint(50, 300),
                requires_prescription=False,
                is_active=True,
            ))

        # ── Clinic Analytics (90 days) ────────────────────────────────────────
        print("  Generating analytics rows...", end=" ", flush=True)
        analytics_rows = []
        for clinic in clinics:
            plan = clinic.subscription_plan
            base_appts = {"basic": 8, "pro": 18, "enterprise": 32}[plan.value]
            base_rev   = {"basic": 14000, "pro": 42000, "enterprise": 75000}[plan.value]

            for days_ago in range(90, 0, -1):
                d = today - timedelta(days=days_ago)
                is_weekend = d.weekday() >= 5
                is_peak = d.weekday() in (0, 2, 4)  # Mon, Wed, Fri busier
                factor = 0.25 if is_weekend else (1.2 if is_peak else 1.0)
                # Gentle growth trend: clinics grow ~1% per week
                growth = 1 + ((90 - days_ago) / 90) * 0.3
                noise = random.uniform(0.85, 1.15)
                total = max(1, int(base_appts * factor * growth * noise))
                completed = int(total * random.uniform(0.72, 0.92))
                cancelled = random.randint(0, max(0, total - completed - 1))
                revenue = round(base_rev / 30 * factor * growth * noise, 2)

                analytics_rows.append({
                    "id": uuid.uuid4(),
                    "clinic_id": clinic.id,
                    "date": d,
                    "total_appointments": total,
                    "completed_appointments": completed,
                    "cancelled_appointments": cancelled,
                    "total_revenue_kes": revenue,
                    "new_patients": random.randint(1, max(2, total // 4)),
                    "returning_patients": max(0, completed - random.randint(1, max(1, completed // 3))),
                })

        db.bulk_insert_mappings(ClinicAnalytics, analytics_rows)
        print(f"done ({len(analytics_rows)} rows for {len(clinics)} clinics)")

        db.commit()

        total_doctors = sum(len(v) for v in doctor_map.values())
        print("\n" + "=" * 60)
        print("  DATABASE SEEDED - INVESTOR DEMO READY")
        print("=" * 60)
        print(f"  Clinics:      {len(clinics)} (Nairobi × 8, Mombasa × 3, Kisumu × 2)")
        print(f"  Doctors:      {total_doctors}")
        print(f"  Patients:     {len(patients)}")
        print(f"  Appointments: {len(today_appts)} today + {len(other_appts)} historic/upcoming")
        print(f"  Triage:       2,400 bulk sessions + 5 detailed")
        print(f"  Products:     {len(PRODUCTS)} OTC items")
        print(f"  Analytics:    90 days × {len(clinics)} clinics = {len(analytics_rows)} rows")
        print("=" * 60)
        print("  DEMO CREDENTIALS")
        print("  Super Admin:  admin@medassist.co.ke          / superadmin123")
        print("  Clinic Admin: admin1@demo.medassist.co.ke    / demo1234")
        print("                (Westlands Family Medical Centre)")
        print("  Patient:      jane.wanjiku@demo.medassist.co.ke / demo1234")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[FAILED] {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
