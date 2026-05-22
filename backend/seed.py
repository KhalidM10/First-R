"""
Seed script — populates the database with realistic Kenya data.

Includes:
  • 8 verified clinics (Nairobi ×4, Mombasa ×2, Kisumu ×2)
  • 3 doctors per clinic (24 total) with real Kenyan names and photos
  • 1 clinic admin per clinic
  • 50 patients with varied profiles
  • 30 OTC products with real Kenyan medicine names and KES prices
  • 500 triage sessions
  • 200 appointments in various statuses
  • Reviews, notifications, analytics snapshots

Run from backend/ directory:
    python reset_db.py   # drops + recreates schema first
    python seed.py
"""
import random
import sys
import os
import uuid
from datetime import date, datetime, time, timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.core.security import hash_password
from app.models.clinic import Clinic
from app.models.user import User
from app.models.doctor import Doctor
from app.models.triage import TriageSession, SymptomLog
from app.models.appointment import Appointment
from app.models.product import Product
from app.models.order import Order
from app.models.review import Review
from app.models.notification import Notification
from app.models.analytics import AnalyticsSnapshot
import app.models  # noqa — register all mappers

random.seed(42)

TODAY = date.today()
UNSPLASH_DOCTORS = [
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400",
    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400",
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400",
    "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400",
    "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400",
]
UNSPLASH_CLINICS = [
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800",
    "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800",
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800",
]

# ── Clinic definitions ─────────────────────────────────────────────────────────
CLINIC_DATA = [
    # ── Nairobi ───────────────────────────────────────────────────────────────
    {
        "name": "Westlands Family Medical Centre",
        "slug": "westlands-fmc",
        "address": "Westlands Rd, Westlands, Nairobi",
        "county": "Nairobi", "sub_county": "Westlands",
        "latitude": Decimal("-1.2676"), "longitude": Decimal("36.8031"),
        "phone": "+254722100001", "email": "info@westlandsfmc.co.ke",
        "license_number": "KMB/PRIV/2018/0042",
        "subscription_plan": "pro",
        "specialties": ["General Practice", "Pediatrics", "Internal Medicine"],
        "description": "Comprehensive family healthcare serving Westlands and surrounding areas since 2008. NHIF accredited.",
        "cover_image_url": UNSPLASH_CLINICS[0],
        "doctors": [
            {"full_name": "Dr. Kamau Njoroge", "specialty": "General Practice", "qualification": "MBChB (UoN)", "bio": "12 years in primary care.", "fee": 1500, "days": [0,1,2,3,4,5]},
            {"full_name": "Dr. Wanjiku Maina", "specialty": "Pediatrics", "qualification": "MBChB, MMed Paediatrics (UoN)", "bio": "Child health specialist.", "fee": 2000, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Brian Gitau", "specialty": "Internal Medicine", "qualification": "MBChB, MMed Internal Medicine (UoN)", "bio": "Chronic disease management.", "fee": 2500, "days": [1,2,3,4,5]},
        ],
    },
    {
        "name": "Karen Medical Centre",
        "slug": "karen-medical",
        "address": "Karen Rd, Karen, Nairobi",
        "county": "Nairobi", "sub_county": "Karen",
        "latitude": Decimal("-1.3186"), "longitude": Decimal("36.7114"),
        "phone": "+254733200002", "email": "care@karenmedical.co.ke",
        "license_number": "KMB/PRIV/2015/0089",
        "subscription_plan": "enterprise",
        "specialties": ["Cardiology", "General Practice", "Obstetrics & Gynecology"],
        "description": "Premium healthcare in Karen with specialist consultants and modern diagnostic facilities.",
        "cover_image_url": UNSPLASH_CLINICS[1],
        "doctors": [
            {"full_name": "Dr. Njoki Kariuki", "specialty": "Cardiology", "qualification": "MBChB, MMed Cardiology (UoN)", "bio": "Heart health and hypertension specialist.", "fee": 4000, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Samuel Muthoni", "specialty": "General Practice", "qualification": "MBChB (Nairobi)", "bio": "Family doctor with 8 years experience.", "fee": 2000, "days": [0,1,2,3,4,5]},
            {"full_name": "Dr. Grace Wambua", "specialty": "Obstetrics & Gynecology", "qualification": "MBChB, MMed O&G (USIU)", "bio": "Women's health and maternity care.", "fee": 3500, "days": [1,2,3,4,5]},
        ],
    },
    {
        "name": "Eastleigh Health Clinic",
        "slug": "eastleigh-health",
        "address": "1st Avenue, Eastleigh, Nairobi",
        "county": "Nairobi", "sub_county": "Kamukunji",
        "latitude": Decimal("-1.2747"), "longitude": Decimal("36.8505"),
        "phone": "+254744300003", "email": "clinic@eastleighhealth.co.ke",
        "license_number": "KMB/PRIV/2020/0156",
        "subscription_plan": "basic",
        "specialties": ["General Practice", "Dentistry", "Pharmacy"],
        "description": "Affordable quality healthcare serving the Eastleigh community. NHIF, M-Pesa accepted.",
        "cover_image_url": UNSPLASH_CLINICS[2],
        "doctors": [
            {"full_name": "Dr. Hassan Abdi Omar", "specialty": "General Practice", "qualification": "MBChB (MOI)", "bio": "Bilingual (English/Somali). Community-focused care.", "fee": 800, "days": [0,1,2,3,4,5,6]},
            {"full_name": "Dr. Fatuma Said", "specialty": "General Practice", "qualification": "MBChB (Egerton)", "bio": "Preventive care and chronic disease management.", "fee": 800, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Abdirahman Yusuf", "specialty": "Dentistry", "qualification": "BDS (UoN)", "bio": "General and cosmetic dentistry.", "fee": 1200, "days": [1,2,3,4,5]},
        ],
    },
    {
        "name": "Lang'ata Medical Hub",
        "slug": "langata-medical-hub",
        "address": "Langata Rd, Lang'ata, Nairobi",
        "county": "Nairobi", "sub_county": "Lang'ata",
        "latitude": Decimal("-1.3333"), "longitude": Decimal("36.7597"),
        "phone": "+254755400004", "email": "info@langatamedical.co.ke",
        "license_number": "KMB/PRIV/2019/0203",
        "subscription_plan": "pro",
        "specialties": ["General Practice", "Orthopedics", "Physiotherapy"],
        "description": "Full-spectrum outpatient care with physiotherapy and minor surgical procedures.",
        "cover_image_url": UNSPLASH_CLINICS[0],
        "doctors": [
            {"full_name": "Dr. Peter Kiprotich", "specialty": "General Practice", "qualification": "MBChB (MOI)", "bio": "Sports medicine and occupational health.", "fee": 1500, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Lydia Akinyi", "specialty": "Orthopedics", "qualification": "MBChB, MMed Orthopedics (KU)", "bio": "Joint and bone specialist.", "fee": 3000, "days": [1,3,5]},
            {"full_name": "Dr. John Mwangi", "specialty": "Physiotherapy", "qualification": "BSc Physiotherapy (UoN)", "bio": "Rehabilitation and sports injury recovery.", "fee": 2000, "days": [0,1,2,3,4,5]},
        ],
    },
    # ── Mombasa ───────────────────────────────────────────────────────────────
    {
        "name": "Coast General Outpatient Clinic",
        "slug": "coast-general-outpatient",
        "address": "Moi Ave, CBD, Mombasa",
        "county": "Mombasa", "sub_county": "Mvita",
        "latitude": Decimal("-4.0435"), "longitude": Decimal("39.6682"),
        "phone": "+254722500005", "email": "coast@outpatient.co.ke",
        "license_number": "KMB/PRIV/2016/0314",
        "subscription_plan": "pro",
        "specialties": ["General Practice", "Tropical Medicine", "ENT"],
        "description": "Mombasa's leading outpatient facility. Specialists in tropical diseases and coastal health needs.",
        "cover_image_url": UNSPLASH_CLINICS[1],
        "doctors": [
            {"full_name": "Dr. Ali Sharif Hassan", "specialty": "Tropical Medicine", "qualification": "MBChB, DTM&H (London)", "bio": "Malaria and infectious disease expert.", "fee": 2500, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Amina Khamisi", "specialty": "General Practice", "qualification": "MBChB (UoN)", "bio": "Primary care with a focus on maternal health.", "fee": 1500, "days": [0,1,2,3,4,5]},
            {"full_name": "Dr. Said Rashid", "specialty": "ENT", "qualification": "MBChB, MMed ENT (Aga Khan)", "bio": "Ear, nose and throat specialist.", "fee": 2800, "days": [1,2,4]},
        ],
    },
    {
        "name": "Tudor Creek Medical Clinic",
        "slug": "tudor-creek-medical",
        "address": "Tudor Rd, Tudor, Mombasa",
        "county": "Mombasa", "sub_county": "Tudor",
        "latitude": Decimal("-4.0589"), "longitude": Decimal("39.6852"),
        "phone": "+254733600006", "email": "info@tudorcreek.co.ke",
        "license_number": "KMB/PRIV/2021/0402",
        "subscription_plan": "basic",
        "specialties": ["General Practice", "Pediatrics"],
        "description": "Neighbourhood clinic serving Tudor and Mikindani residents with affordable care.",
        "cover_image_url": UNSPLASH_CLINICS[2],
        "doctors": [
            {"full_name": "Dr. Rose Chepkemoi", "specialty": "General Practice", "qualification": "MBChB (KU)", "bio": "Family health for all ages.", "fee": 900, "days": [0,1,2,3,4,5]},
            {"full_name": "Dr. Omar Farouk", "specialty": "Pediatrics", "qualification": "MBChB (MOI)", "bio": "Child health and immunization.", "fee": 1200, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Zakia Mwadime", "specialty": "General Practice", "qualification": "MBChB (Nairobi)", "bio": "Community medicine and public health.", "fee": 900, "days": [1,2,3,4,5,6]},
        ],
    },
    # ── Kisumu ────────────────────────────────────────────────────────────────
    {
        "name": "Kisumu Central Health Clinic",
        "slug": "kisumu-central",
        "address": "Oginga Odinga St, Kisumu CBD",
        "county": "Kisumu", "sub_county": "Kisumu Central",
        "latitude": Decimal("-0.0917"), "longitude": Decimal("34.7680"),
        "phone": "+254744700007", "email": "kchu@health.co.ke",
        "license_number": "KMB/PRIV/2017/0521",
        "subscription_plan": "pro",
        "specialties": ["General Practice", "HIV/AIDS", "Internal Medicine"],
        "description": "Western Kenya's premier outpatient facility. NHIF accredited. HIV testing and ART available.",
        "cover_image_url": UNSPLASH_CLINICS[0],
        "doctors": [
            {"full_name": "Dr. Otieno Opiyo", "specialty": "HIV/AIDS", "qualification": "MBChB, MPH (UoN)", "bio": "HIV care and ARV management specialist.", "fee": 1500, "days": [0,1,2,3,4]},
            {"full_name": "Dr. Achieng Omondi", "specialty": "Internal Medicine", "qualification": "MBChB, MMed Internal Medicine (Maseno)", "bio": "Diabetes and hypertension specialist.", "fee": 2500, "days": [0,1,2,3,4,5]},
            {"full_name": "Dr. Jackline Adhiambo", "specialty": "General Practice", "qualification": "MBChB (MOI)", "bio": "Primary care and preventive medicine.", "fee": 1000, "days": [1,2,3,4,5,6]},
        ],
    },
    {
        "name": "Milimani Specialist Clinic",
        "slug": "milimani-specialist",
        "address": "Milimani Rd, Milimani, Kisumu",
        "county": "Kisumu", "sub_county": "Kisumu East",
        "latitude": Decimal("-0.1022"), "longitude": Decimal("34.7555"),
        "phone": "+254755800008", "email": "milimani@specialist.co.ke",
        "license_number": "KMB/PRIV/2018/0634",
        "subscription_plan": "enterprise",
        "specialties": ["Dermatology", "Ophthalmology", "General Practice"],
        "description": "Specialist outpatient care for Kisumu and Nyanza region. State-of-the-art diagnostic equipment.",
        "cover_image_url": UNSPLASH_CLINICS[1],
        "doctors": [
            {"full_name": "Dr. Mercy Chebet", "specialty": "Dermatology", "qualification": "MBChB, MMed Dermatology (Aga Khan)", "bio": "Skin conditions and cosmetic dermatology.", "fee": 3500, "days": [0,2,4]},
            {"full_name": "Dr. Collins Ouma", "specialty": "Ophthalmology", "qualification": "MBChB, MMed Ophthalmology (UoN)", "bio": "Eye care and vision correction specialist.", "fee": 3000, "days": [1,3,5]},
            {"full_name": "Dr. Sharon Auma", "specialty": "General Practice", "qualification": "MBChB (Maseno)", "bio": "Holistic family medicine.", "fee": 1200, "days": [0,1,2,3,4,5]},
        ],
    },
]

# ── Patient names (50 real Kenyan names) ──────────────────────────────────────
PATIENT_DATA = [
    ("Jane Wanjiku Kamau", "jane.wanjiku@test.medassist.co.ke", "+254712001001", "Nairobi", "female", date(1992, 3, 15)),
    ("Michael Odhiambo Otieno", "michael.odhiambo@test.medassist.co.ke", "+254723002002", "Kisumu", "male", date(1985, 7, 22)),
    ("Sarah Mwende Kioko", "sarah.mwende@test.medassist.co.ke", "+254734003003", "Mombasa", "female", date(1998, 11, 5)),
    ("Peter Njoroge Kimani", "peter.njoroge@test.medassist.co.ke", "+254745004004", "Nairobi", "male", date(1979, 2, 18)),
    ("Amina Yusuf Hassan", "amina.yusuf@test.medassist.co.ke", "+254756005005", "Mombasa", "female", date(2001, 9, 30)),
    ("David Kiplagat Ruto", "david.kiplagat@test.medassist.co.ke", "+254767006006", "Nairobi", "male", date(1988, 4, 12)),
    ("Grace Achieng Obiero", "grace.achieng@test.medassist.co.ke", "+254778007007", "Kisumu", "female", date(1995, 6, 8)),
    ("Hassan Abdirahman Mohamed", "hassan.abdi@test.medassist.co.ke", "+254789008008", "Mombasa", "male", date(1982, 1, 25)),
    ("Eunice Wangari Muriuki", "eunice.wangari@test.medassist.co.ke", "+254700009009", "Nairobi", "female", date(1990, 8, 14)),
    ("Emmanuel Ochieng Onyango", "emma.ochieng@test.medassist.co.ke", "+254711010010", "Kisumu", "male", date(1975, 12, 3)),
    ("Fatuma Omar Mwangi", "fatuma.omar@test.medassist.co.ke", "+254722011011", "Mombasa", "female", date(2003, 5, 19)),
    ("Kevin Muthomi Kariuki", "kevin.muthomi@test.medassist.co.ke", "+254733012012", "Nairobi", "male", date(1993, 10, 7)),
    ("Beatrice Nekesa Wafula", "beatrice.nekesa@test.medassist.co.ke", "+254744013013", "Nairobi", "female", date(1987, 3, 28)),
    ("James Kipchoge Bett", "james.bett@test.medassist.co.ke", "+254755014014", "Nairobi", "male", date(1996, 7, 16)),
    ("Caroline Awuor Odhiambo", "caroline.awuor@test.medassist.co.ke", "+254766015015", "Kisumu", "female", date(1999, 1, 11)),
    ("Ahmed Farah Abdi", "ahmed.farah@test.medassist.co.ke", "+254777016016", "Mombasa", "male", date(1980, 6, 23)),
    ("Winnie Cherop Koech", "winnie.cherop@test.medassist.co.ke", "+254788017017", "Nairobi", "female", date(2000, 4, 2)),
    ("Daniel Mbuvi Musyoka", "daniel.mbuvi@test.medassist.co.ke", "+254799018018", "Nairobi", "male", date(1984, 9, 17)),
    ("Lydia Chepkemoi Sang", "lydia.chepkemoi@test.medassist.co.ke", "+254700019019", "Nairobi", "female", date(1991, 12, 29)),
    ("Francis Njoroge Waruhiu", "francis.waruhiu@test.medassist.co.ke", "+254711020020", "Nairobi", "male", date(1977, 8, 6)),
    ("Zainab Khalid Shariff", "zainab.khalid@test.medassist.co.ke", "+254722021021", "Mombasa", "female", date(2002, 2, 14)),
    ("Collins Omondi Ateng", "collins.ateng@test.medassist.co.ke", "+254733022022", "Kisumu", "male", date(1994, 5, 21)),
    ("Mercy Wanjiru Gatundu", "mercy.gatundu@test.medassist.co.ke", "+254744023023", "Nairobi", "female", date(1989, 11, 9)),
    ("Joseph Kimani Mbugua", "joseph.mbugua@test.medassist.co.ke", "+254755024024", "Nairobi", "male", date(1983, 3, 31)),
    ("Aisha Baraka Salim", "aisha.baraka@test.medassist.co.ke", "+254766025025", "Mombasa", "female", date(1997, 7, 4)),
    ("Patrick Otieno Ouko", "patrick.ouko@test.medassist.co.ke", "+254777026026", "Kisumu", "male", date(1986, 10, 18)),
    ("Stella Wambua Ndeto", "stella.ndeto@test.medassist.co.ke", "+254788027027", "Nairobi", "female", date(2004, 1, 27)),
    ("Victor Mwangi Kinyua", "victor.kinyua@test.medassist.co.ke", "+254799028028", "Nairobi", "male", date(1981, 6, 13)),
    ("Priscilla Adhiambo Ouma", "priscilla.ouma@test.medassist.co.ke", "+254700029029", "Kisumu", "female", date(1992, 9, 8)),
    ("Nicholas Gitonga Kuria", "nicholas.gitonga@test.medassist.co.ke", "+254711030030", "Nairobi", "male", date(1976, 4, 22)),
    ("Hawa Ibrahim Farah", "hawa.farah@test.medassist.co.ke", "+254722031031", "Mombasa", "female", date(2005, 8, 3)),
    ("Geoffrey Rotich Kiplimo", "geoffrey.rotich@test.medassist.co.ke", "+254733032032", "Nairobi", "male", date(1990, 12, 15)),
    ("Irene Awino Kogo", "irene.awino@test.medassist.co.ke", "+254744033033", "Kisumu", "female", date(1988, 3, 7)),
    ("Moses Kibet Kipkoech", "moses.kibet@test.medassist.co.ke", "+254755034034", "Nairobi", "male", date(1995, 7, 19)),
    ("Naomi Wairimu Ndungu", "naomi.ndungu@test.medassist.co.ke", "+254766035035", "Nairobi", "female", date(2001, 11, 26)),
    ("Brian Juma Onyango", "brian.juma@test.medassist.co.ke", "+254777036036", "Kisumu", "male", date(1985, 2, 10)),
    ("Tabitha Cheboi Mutai", "tabitha.cheboi@test.medassist.co.ke", "+254788037037", "Nairobi", "female", date(1993, 5, 23)),
    ("Leonard Waweru Kamau", "leonard.waweru@test.medassist.co.ke", "+254799038038", "Nairobi", "male", date(1979, 9, 4)),
    ("Sophia Wanjiku Njeru", "sophia.njeru@test.medassist.co.ke", "+254700039039", "Nairobi", "female", date(1998, 1, 17)),
    ("Anthony Opiyo Owino", "anthony.opiyo@test.medassist.co.ke", "+254711040040", "Kisumu", "male", date(1982, 6, 30)),
    ("Pauline Kemunto Mokaya", "pauline.kemunto@test.medassist.co.ke", "+254722041041", "Kisumu", "female", date(1996, 10, 12)),
    ("Timothy Mbithi Nzau", "timothy.mbithi@test.medassist.co.ke", "+254733042042", "Nairobi", "male", date(1987, 3, 5)),
    ("Esther Chebet Kiprono", "esther.chebet@test.medassist.co.ke", "+254744043043", "Nairobi", "female", date(2003, 8, 24)),
    ("Robert Ouma Odero", "robert.odero@test.medassist.co.ke", "+254755044044", "Kisumu", "male", date(1980, 1, 6)),
    ("Alice Muthoni Mugo", "alice.mugo@test.medassist.co.ke", "+254766045045", "Nairobi", "female", date(1991, 5, 18)),
    ("George Mwenda Murithi", "george.mwenda@test.medassist.co.ke", "+254777046046", "Nairobi", "male", date(1984, 9, 1)),
    ("Rose Kendi Muriungi", "rose.kendi@test.medassist.co.ke", "+254788047047", "Nairobi", "female", date(1999, 12, 13)),
    ("Edwin Kipngetich Biwott", "edwin.kipngetich@test.medassist.co.ke", "+254799048048", "Nairobi", "male", date(1975, 4, 25)),
    ("Jacinta Wanjiku Waithaka", "jacinta.waithaka@test.medassist.co.ke", "+254700049049", "Nairobi", "female", date(1994, 7, 8)),
    ("Samuel Abiud Akoth", "samuel.abiud@test.medassist.co.ke", "+254711050050", "Kisumu", "male", date(1989, 11, 21)),
]

# ── OTC Products (30 items, realistic Kenya prices) ────────────────────────────
PRODUCTS_DATA = [
    # Pain & Fever
    {"name": "Panadol Extra Tabs 500mg", "generic": "Paracetamol", "brand": "GSK", "category": "pain_relief", "price": 50, "stock": 500, "desc": "Fast-acting pain and fever relief. Pack of 12 tablets.", "dosage": "1-2 tablets every 4-6 hours. Max 8 tablets daily.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Brufen 200mg Tablets", "generic": "Ibuprofen", "brand": "Abbott", "category": "pain_relief", "price": 80, "stock": 300, "desc": "Anti-inflammatory pain relief for headaches, muscle pain, period pain.", "dosage": "200-400mg every 4-6 hours with food.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    {"name": "Mara Moja Analgesic Tabs", "generic": "Aspirin", "brand": "Mara Moja", "category": "pain_relief", "price": 30, "stock": 600, "desc": "Kenya's most trusted analgesic for headache and fever.", "dosage": "1-2 tablets every 4 hours. Not for children under 12.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Diclofenac 50mg Tabs", "generic": "Diclofenac Sodium", "brand": "Cosmos", "category": "pain_relief", "price": 120, "stock": 200, "desc": "NSAID for joint pain, backache, and arthritis.", "dosage": "50mg 2-3 times daily after meals.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # Malaria
    {"name": "Coartem 80/480mg Tabs", "generic": "Artemether/Lumefantrine", "brand": "Novartis", "category": "antimalarial", "price": 450, "stock": 150, "desc": "First-line treatment for uncomplicated malaria. Full 24-tab course.", "dosage": "4 tabs at 0,8,24,36,48,60 hours.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Malaria Rapid Test Kit", "generic": "RDT", "brand": "SD Bioline", "category": "diagnostics", "price": 200, "stock": 100, "desc": "Fast 15-minute malaria antigen test. High sensitivity for P. falciparum.", "dosage": "One test per kit. For diagnostic use only.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # Antibiotics (OTC allowed in Kenya for certain)
    {"name": "Amoxicillin 500mg Caps", "generic": "Amoxicillin Trihydrate", "brand": "Cosmos", "category": "antibiotics", "price": 350, "stock": 200, "desc": "Broad-spectrum antibiotic. Requires prescription.", "dosage": "500mg three times daily for 7 days.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600", "rx": True},
    {"name": "Ciprofloxacin 500mg Tabs", "generic": "Ciprofloxacin HCl", "brand": "Dawa", "category": "antibiotics", "price": 420, "stock": 150, "desc": "Fluoroquinolone antibiotic for urinary and respiratory infections.", "dosage": "500mg twice daily for 5-7 days.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600", "rx": True},
    {"name": "Metronidazole 400mg Tabs", "generic": "Metronidazole", "brand": "Beta", "category": "antibiotics", "price": 180, "stock": 250, "desc": "Antibiotic for stomach infections, dental infections, STIs.", "dosage": "400mg three times daily for 7 days.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    # Diabetes
    {"name": "Metformin 500mg Tabs", "generic": "Metformin HCl", "brand": "Glaxo", "category": "diabetes", "price": 280, "stock": 200, "desc": "First-line diabetes medication. Lowers blood glucose.", "dosage": "500mg twice daily with meals. Dose adjusted by doctor.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600", "rx": True},
    {"name": "Glucocheck Blood Glucose Strips", "generic": "Glucose Test Strips", "brand": "GlucoCheck", "category": "diabetes", "price": 650, "stock": 80, "desc": "Compatible with most glucose meters. 50 strips per pack.", "dosage": "Test fasting and 2h post-meal levels.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    # Vitamins & Supplements
    {"name": "Supradyn Multivitamin Tabs", "generic": "Multivitamins", "brand": "Bayer", "category": "vitamins", "price": 850, "stock": 120, "desc": "Complete daily multivitamin for adults. 30 tablets.", "dosage": "1 tablet daily after breakfast.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    {"name": "Vitamin C 1000mg Tabs", "generic": "Ascorbic Acid", "brand": "Vitabiotics", "category": "vitamins", "price": 350, "stock": 200, "desc": "High-strength vitamin C for immunity and antioxidant support. 30 tabs.", "dosage": "1 tablet daily or as directed.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Folic Acid 5mg Tabs", "generic": "Folic Acid", "brand": "Dawa", "category": "vitamins", "price": 120, "stock": 300, "desc": "Essential for pregnancy and neural tube development.", "dosage": "1 tablet daily before and during pregnancy.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    {"name": "Iron & Folate Tabs", "generic": "Ferrous Sulphate + Folic Acid", "brand": "Cosmos", "category": "vitamins", "price": 180, "stock": 250, "desc": "Prevents iron-deficiency anaemia. Recommended for pregnant women.", "dosage": "1 tablet daily with meals.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    # Respiratory
    {"name": "Actifed Syrup 100ml", "generic": "Triprolidine + Pseudoephedrine", "brand": "GSK", "category": "cold_flu", "price": 280, "stock": 150, "desc": "Relieves nasal congestion, runny nose, and sneezing.", "dosage": "10ml three times daily. Not for children under 6.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    {"name": "Ventolin Inhaler 100mcg", "generic": "Salbutamol", "brand": "GSK", "category": "respiratory", "price": 650, "stock": 60, "desc": "Relieves bronchospasm in asthma and COPD.", "dosage": "1-2 puffs as needed. Max 8 puffs per day.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Piriton 4mg Tabs", "generic": "Chlorphenamine Maleate", "brand": "GSK", "category": "cold_flu", "price": 60, "stock": 400, "desc": "Antihistamine for allergies, hay fever, and hives.", "dosage": "4mg every 4-6 hours. Causes drowsiness.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # GI
    {"name": "ORS Sachet (Lemon)", "generic": "Oral Rehydration Salts", "brand": "Dawa ORS", "category": "digestive", "price": 40, "stock": 500, "desc": "Replaces fluids and electrolytes lost during diarrhoea and vomiting.", "dosage": "Dissolve 1 sachet in 200ml clean water. Drink after each loose stool.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Flagyl 200mg Susp 100ml", "generic": "Metronidazole Suspension", "brand": "Sanofi", "category": "digestive", "price": 220, "stock": 100, "desc": "For children with amoebic dysentery and intestinal infections.", "dosage": "Weight-based dosing. Consult pharmacist.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    {"name": "Omeprazole 20mg Caps", "generic": "Omeprazole", "brand": "Cosmos", "category": "digestive", "price": 240, "stock": 200, "desc": "Reduces stomach acid. For ulcers and acid reflux (GERD).", "dosage": "20mg once daily before meals for 4-8 weeks.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Buscopan 10mg Tabs", "generic": "Hyoscine Butylbromide", "brand": "Bayer", "category": "digestive", "price": 180, "stock": 200, "desc": "Relieves abdominal cramps and spasms.", "dosage": "1-2 tablets three times daily.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # Skin
    {"name": "Canesten Cream 20g", "generic": "Clotrimazole", "brand": "Bayer", "category": "skin_care", "price": 320, "stock": 100, "desc": "Antifungal cream for athlete's foot, ringworm, and candidiasis.", "dosage": "Apply thin layer 2-3 times daily for 2-4 weeks.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Betamethasone Cream 15g", "generic": "Betamethasone Valerate 0.1%", "brand": "Beta", "category": "skin_care", "price": 180, "stock": 150, "desc": "Steroid cream for eczema, psoriasis, and allergic skin reactions.", "dosage": "Apply sparingly twice daily. Not for face or broken skin.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # Baby & Child
    {"name": "Calpol 120mg/5ml Syrup 100ml", "generic": "Paracetamol Syrup", "brand": "McNeil", "category": "baby_care", "price": 220, "stock": 200, "desc": "Gentle paracetamol syrup for infants and children. Strawberry flavour.", "dosage": "2.5-10ml every 4-6 hours depending on age/weight.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Zinc 20mg Dispersible Tabs", "generic": "Zinc Sulphate", "brand": "UNICEF", "category": "baby_care", "price": 90, "stock": 300, "desc": "Reduces duration and severity of diarrhoea in under-5s.", "dosage": "10mg (under 6 months) or 20mg (6 months-5 years) daily for 10 days.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # First Aid
    {"name": "Savlon Antiseptic Cream 30g", "generic": "Chlorhexidine + Cetrimide", "brand": "Savlon", "category": "first_aid", "price": 120, "stock": 200, "desc": "Antiseptic cream for minor cuts, wounds, and burns.", "dosage": "Apply to clean wound 2-3 times daily.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600"},
    {"name": "Surgical Spirit 100ml", "generic": "Industrial Methylated Spirits", "brand": "Cosmos", "category": "first_aid", "price": 80, "stock": 300, "desc": "For disinfecting skin before injections and minor procedures.", "dosage": "Apply externally only with cotton wool.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600"},
    # Hypertension
    {"name": "Amlodipine 5mg Tabs", "generic": "Amlodipine Besylate", "brand": "Pfizer", "category": "cardiovascular", "price": 320, "stock": 200, "desc": "Calcium channel blocker for hypertension and angina.", "dosage": "5-10mg once daily. Take at the same time each day.", "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600", "rx": True},
    {"name": "Lisinopril 10mg Tabs", "generic": "Lisinopril", "brand": "Cosmos", "category": "cardiovascular", "price": 280, "stock": 200, "desc": "ACE inhibitor for high blood pressure and heart failure.", "dosage": "10-40mg once daily. Monitor blood pressure.", "image": "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600", "rx": True},
]

# ── Triage symptom patterns ────────────────────────────────────────────────────
TRIAGE_PATTERNS = [
    {"symptoms": {"fever": True, "headache": True}, "severity": "moderate", "action": "visit_clinic", "age_range": (18, 65), "county": "Nairobi"},
    {"symptoms": {"chest_pain": True, "shortness_of_breath": True}, "severity": "urgent", "action": "emergency", "age_range": (35, 80), "county": "Mombasa"},
    {"symptoms": {"cough": True, "runny_nose": True}, "severity": "mild", "action": "rest_at_home", "age_range": (5, 50), "county": "Kisumu"},
    {"symptoms": {"abdominal_pain": True, "diarrhoea": True, "nausea": True}, "severity": "moderate", "action": "visit_clinic", "age_range": (18, 60), "county": "Nairobi"},
    {"symptoms": {"fever": True, "chills": True, "fatigue": True}, "severity": "moderate", "action": "visit_clinic", "age_range": (10, 70), "county": "Mombasa"},
    {"symptoms": {"headache": True, "dizziness": True}, "severity": "mild", "action": "rest_at_home", "age_range": (20, 55), "county": "Nairobi"},
    {"symptoms": {"difficulty_swallowing": True, "neck_stiffness": True, "high_fever": True}, "severity": "emergency", "action": "emergency", "age_range": (5, 40), "county": "Kisumu"},
    {"symptoms": {"rash": True, "itching": True}, "severity": "mild", "action": "visit_clinic", "age_range": (3, 65), "county": "Nairobi"},
    {"symptoms": {"frequent_urination": True, "burning_urination": True}, "severity": "moderate", "action": "visit_clinic", "age_range": (18, 60), "county": "Mombasa"},
    {"symptoms": {"eye_redness": True, "eye_pain": True}, "severity": "moderate", "action": "visit_clinic", "age_range": (10, 70), "county": "Nairobi"},
]

APPOINTMENT_REASONS = [
    "Fever and persistent headache — 3 days",
    "Malaria follow-up — blood test results",
    "Antenatal visit — 28 weeks",
    "Diabetes review — HbA1c check",
    "Hypertension check — medication review",
    "Child vaccination — 18-month schedule",
    "Chest tightness and dry cough — 1 week",
    "Skin rash — possible allergic reaction",
    "Abdominal pain and diarrhoea",
    "Pre-employment medical examination",
    "Back pain — physiotherapy referral",
    "Eye pain and blurred vision",
    "STI screening and counselling",
    "Weight management consultation",
    "Dental pain — wisdom tooth",
]


def generate_order_number() -> str:
    import string
    chars = string.ascii_uppercase + string.digits
    return "MA-" + "".join(random.choices(chars, k=8))


def main() -> None:
    db = SessionLocal()
    try:
        # ── Super admin ────────────────────────────────────────────────────────
        super_admin = User(
            full_name="MedAssist Platform Admin",
            email="admin@medassist.co.ke",
            phone="+254700000001",
            password_hash=hash_password("superadmin123"),
            role="super_admin",
            is_active=True,
            is_email_verified=True,
        )
        db.add(super_admin)
        db.flush()

        clinics = []
        all_doctors = []
        clinic_admins = []

        # ── Clinics, admins, doctors ───────────────────────────────────────────
        for i, cdata in enumerate(CLINIC_DATA):
            clinic = Clinic(
                name=cdata["name"],
                slug=cdata["slug"],
                license_number=cdata["license_number"],
                address=cdata["address"],
                county=cdata["county"],
                sub_county=cdata.get("sub_county"),
                latitude=cdata["latitude"],
                longitude=cdata["longitude"],
                phone=cdata["phone"],
                email=cdata["email"],
                website=f"https://www.{cdata['slug']}.co.ke",
                description=cdata["description"],
                cover_image_url=cdata["cover_image_url"],
                logo_url=UNSPLASH_CLINICS[i % len(UNSPLASH_CLINICS)],
                specialties=cdata["specialties"],
                subscription_plan=cdata["subscription_plan"],
                is_verified=True,
                is_active=True,
                operating_hours={
                    "monday": {"open": "08:00", "close": "18:00"},
                    "tuesday": {"open": "08:00", "close": "18:00"},
                    "wednesday": {"open": "08:00", "close": "18:00"},
                    "thursday": {"open": "08:00", "close": "18:00"},
                    "friday": {"open": "08:00", "close": "17:00"},
                    "saturday": {"open": "09:00", "close": "14:00"},
                },
                subscription_started_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                subscription_expires_at=datetime.utcnow() + timedelta(days=random.randint(60, 365)),
            )
            db.add(clinic)
            db.flush()
            clinics.append(clinic)

            # Clinic admin
            admin = User(
                clinic_id=clinic.id,
                full_name=f"Admin — {clinic.name}",
                email=f"admin{i+1}@test.medassist.co.ke",
                phone=f"+25470099{i+1:04d}",
                password_hash=hash_password("admin1234"),
                role="clinic_admin",
                is_active=True,
                is_email_verified=True,
                county=cdata["county"],
            )
            db.add(admin)
            db.flush()
            clinic_admins.append(admin)

            # Doctors
            for j, ddata in enumerate(cdata["doctors"]):
                photo = UNSPLASH_DOCTORS[(i * 3 + j) % len(UNSPLASH_DOCTORS)]
                doctor = Doctor(
                    clinic_id=clinic.id,
                    full_name=ddata["full_name"],
                    specialty=ddata["specialty"],
                    sub_specialty=ddata.get("sub_specialty"),
                    qualification=ddata["qualification"],
                    bio=ddata["bio"],
                    photo_url=photo,
                    consultation_fee_kes=Decimal(str(ddata["fee"])),
                    available_days=ddata["days"],
                    slot_duration_minutes=30,
                    max_daily_appointments=20,
                    is_active=True,
                    rating=Decimal(str(round(random.uniform(3.8, 5.0), 1))),
                    total_reviews=random.randint(5, 120),
                )
                db.add(doctor)
                all_doctors.append(doctor)

        db.flush()

        # ── Products (assign to all clinics) ────────────────────────────────────
        all_products = []
        for clinic in clinics:
            for pdata in PRODUCTS_DATA:
                prod = Product(
                    clinic_id=clinic.id,
                    name=pdata["name"],
                    generic_name=pdata.get("generic"),
                    brand=pdata.get("brand"),
                    category=pdata["category"],
                    description=pdata["desc"],
                    dosage_info=pdata.get("dosage"),
                    price_kes=Decimal(str(pdata["price"])),
                    stock_quantity=pdata["stock"],
                    low_stock_threshold=20,
                    requires_prescription=pdata.get("rx", False),
                    image_url=pdata.get("image"),
                    is_active=True,
                )
                db.add(prod)
                all_products.append(prod)
        db.flush()

        # ── Patients ────────────────────────────────────────────────────────────
        patients = []
        for pdata in PATIENT_DATA:
            full_name, email, phone, county, gender, dob = pdata
            patient = User(
                full_name=full_name,
                email=email,
                phone=phone,
                password_hash=hash_password("patient123"),
                role="patient",
                county=county,
                gender=gender,
                date_of_birth=dob,
                is_active=True,
                is_email_verified=random.choice([True, False]),
            )
            db.add(patient)
            patients.append(patient)
        db.flush()

        # ── Triage sessions (500 total) ─────────────────────────────────────────
        triage_sessions = []
        for _ in range(500):
            pattern = random.choice(TRIAGE_PATTERNS)
            age = random.randint(*pattern["age_range"])
            user = random.choice(patients + [None] * 10)  # ~16% anonymous
            session = TriageSession(
                user_id=user.id if user else None,
                symptoms=pattern["symptoms"],
                severity_level=pattern["severity"],
                confidence_score=Decimal(str(round(random.uniform(0.65, 0.98), 3))),
                recommendations={
                    "primary": f"Based on your symptoms, we recommend: {pattern['action'].replace('_', ' ')}.",
                    "secondary": "Stay hydrated and rest. Seek emergency care if symptoms worsen.",
                },
                recommended_action=pattern["action"],
                patient_age=age,
                patient_gender=random.choice(["male", "female"]),
                county=pattern["county"],
                session_duration_seconds=random.randint(45, 240),
                device_type=random.choice(["mobile", "desktop", "tablet"]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 90)),
            )
            db.add(session)
            triage_sessions.append(session)

            # Symptom logs
            for symptom_name in list(pattern["symptoms"].keys()):
                db.add(SymptomLog(
                    triage_session_id=session.id,
                    symptom_name=symptom_name.replace("_", " "),
                    duration_days=random.randint(1, 7),
                    severity_score=random.randint(3, 9),
                ))
        db.flush()

        # ── Appointments (200 total) ────────────────────────────────────────────
        appointments = []
        statuses = ["pending"] * 3 + ["confirmed"] * 4 + ["completed"] * 6 + ["cancelled"] * 1 + ["no_show"] * 1
        for i in range(200):
            clinic = random.choice(clinics)
            clinic_doctors = [d for d in all_doctors if d.clinic_id == clinic.id]
            if not clinic_doctors:
                continue
            doctor = random.choice(clinic_doctors)
            patient = random.choice(patients)
            appt_date = TODAY + timedelta(days=random.randint(-60, 30))
            status = random.choice(statuses)
            amount = doctor.consultation_fee_kes

            appt = Appointment(
                clinic_id=clinic.id,
                patient_id=patient.id,
                doctor_id=doctor.id,
                appointment_date=appt_date,
                appointment_time=f"{random.randint(8,16):02d}:{random.choice(['00','30'])}:00",
                duration_minutes=30,
                status=status,
                reason=random.choice(APPOINTMENT_REASONS),
                payment_status="paid" if status == "completed" else "pending",
                amount_kes=amount,
                payment_method="mpesa" if random.random() > 0.2 else "cash",
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 60)),
            )
            db.add(appt)
            appointments.append(appt)

        # Today's appointments for first clinic (Westlands)
        westlands = clinics[0]
        westlands_docs = [d for d in all_doctors if d.clinic_id == westlands.id]
        today_reasons = [
            ("Fever and persistent headache — 3 days", "confirmed"),
            ("Childhood vaccination — 18-month check", "confirmed"),
            ("Chest tightness and dry cough", "pending"),
            ("Malaria follow-up — blood test results", "confirmed"),
            ("Child fever — possible viral infection", "pending"),
            ("Antenatal visit — 24 weeks", "confirmed"),
            ("Hypertension check — medication review", "pending"),
            ("Skin rash — possible allergic reaction", "confirmed"),
        ]
        for idx, (reason, status) in enumerate(today_reasons):
            appt = Appointment(
                clinic_id=westlands.id,
                patient_id=patients[idx % len(patients)].id,
                doctor_id=westlands_docs[idx % len(westlands_docs)].id,
                appointment_date=TODAY,
                appointment_time=f"{8 + idx}:00:00",
                status=status,
                reason=reason,
                payment_status="pending",
                amount_kes=westlands_docs[idx % len(westlands_docs)].consultation_fee_kes,
                payment_method="mpesa",
            )
            db.add(appt)
            appointments.append(appt)

        db.flush()

        # ── Reviews ─────────────────────────────────────────────────────────────
        completed_appts = [a for a in appointments if a.status == "completed"]
        for appt in random.sample(completed_appts, min(40, len(completed_appts))):
            rating = random.choices([3, 4, 4, 5, 5, 5], k=1)[0]
            bodies = [
                "Very professional service. The doctor was thorough and explained everything clearly.",
                "Short waiting time and friendly staff. Highly recommended.",
                "The clinic is clean and well-maintained. Doctor took time to listen.",
                "Good experience overall. Will come back for follow-up.",
                "Excellent care. The nurse was very gentle with my child.",
            ]
            doctor = next((d for d in all_doctors if d.id == appt.doctor_id), None)
            review = Review(
                clinic_id=appt.clinic_id,
                patient_id=appt.patient_id,
                doctor_id=appt.doctor_id,
                appointment_id=appt.id,
                rating=rating,
                title=["Outstanding care", "Great experience", "Highly recommend", "Very satisfied", "Good clinic"][rating - 1],
                body=random.choice(bodies),
                is_verified=True,
                is_published=True,
            )
            db.add(review)

        # ── Analytics snapshots (90 days × 8 clinics) ─────────────────────────
        for clinic in clinics:
            for days_ago in range(90):
                snap_date = TODAY - timedelta(days=days_ago)
                base = {"basic": 8, "pro": 18, "enterprise": 35}[clinic.subscription_plan]
                total = random.randint(base - 3, base + 5)
                completed = int(total * random.uniform(0.55, 0.80))
                cancelled = random.randint(0, 2)
                revenue = float(completed) * float(random.uniform(1200, 2800))
                snap = AnalyticsSnapshot(
                    clinic_id=clinic.id,
                    snapshot_date=snap_date,
                    metrics={
                        "total_appointments": total,
                        "completed_appointments": completed,
                        "cancelled_appointments": cancelled,
                        "no_show_appointments": random.randint(0, 2),
                        "total_revenue_kes": round(revenue, 2),
                        "new_patients": random.randint(1, 6),
                        "returning_patients": completed - random.randint(1, 4),
                        "avg_fee_kes": round(revenue / max(completed, 1), 2),
                    },
                )
                db.add(snap)

        # ── Sample orders ────────────────────────────────────────────────────────
        for _ in range(30):
            patient = random.choice(patients)
            clinic = random.choice(clinics)
            clinic_products = [p for p in all_products if p.clinic_id == clinic.id]
            if not clinic_products:
                continue
            items_count = random.randint(1, 3)
            selected = random.sample(clinic_products, min(items_count, len(clinic_products)))
            items_data = [
                {"product_id": str(p.id), "name": p.name, "qty": random.randint(1, 2), "price_kes": float(p.price_kes)}
                for p in selected
            ]
            subtotal = sum(i["qty"] * i["price_kes"] for i in items_data)
            delivery_fee = 150.0 if random.random() > 0.4 else 0.0
            order = Order(
                order_number=generate_order_number(),
                clinic_id=clinic.id,
                patient_id=patient.id,
                items=items_data,
                subtotal_kes=Decimal(str(round(subtotal, 2))),
                delivery_fee_kes=Decimal(str(delivery_fee)),
                total_kes=Decimal(str(round(subtotal + delivery_fee, 2))),
                status=random.choice(["delivered", "delivered", "processing", "pending"]),
                delivery_method="delivery" if delivery_fee > 0 else "pickup",
                payment_method="mpesa",
                payment_status=random.choice(["paid", "paid", "pending"]),
                created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            )
            db.add(order)

        # ── Notifications (sample) ───────────────────────────────────────────────
        notif_types = [
            ("appointment_reminder", "Appointment Reminder", "Your appointment is tomorrow at 09:00."),
            ("appointment_confirmed", "Appointment Confirmed", "Your booking at Westlands Family Medical Centre has been confirmed."),
            ("order_ready", "Order Ready for Pickup", "Your medicine order MA-XXXXXXXX is ready for pickup."),
            ("triage_followup", "Triage Follow-up", "Based on your recent triage, we recommend booking a clinic visit."),
        ]
        for patient in random.sample(patients, 20):
            ntype, title, body = random.choice(notif_types)
            db.add(Notification(
                user_id=patient.id,
                type=ntype,
                title=title,
                body=body,
                channel=["in_app", "sms"],
                is_read=random.choice([True, False]),
            ))

        db.commit()

        # ── Summary ───────────────────────────────────────────────────────────
        print("\n" + "=" * 60)
        print("  DATABASE SEEDED")
        print("=" * 60)
        print(f"  Clinics:       {len(clinics)} (Nairobi ×4, Mombasa ×2, Kisumu ×2)")
        print(f"  Doctors:       {len(all_doctors)}")
        print(f"  Patients:      {len(patients)}")
        print(f"  Products:      {len(PRODUCTS_DATA)} OTC items × {len(clinics)} clinics")
        print(f"  Triage:        500 sessions")
        print(f"  Appointments:  {len(appointments)}")
        print(f"  Analytics:     90 days × {len(clinics)} clinics")
        print("=" * 60)
        print("  SEED ACCOUNTS")
        print("  Super Admin:  admin@medassist.co.ke           / superadmin123")
        print("  Clinic Admin: admin1@test.medassist.co.ke     / admin1234")
        print("                (Westlands Family Medical Centre)")
        print("  Patient:      jane.wanjiku@test.medassist.co.ke / patient123")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n[FAILED] {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
