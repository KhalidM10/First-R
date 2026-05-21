"""
Medicine order service.
Phase 1: demo pharmacy data.
Phase 2: integrate real pharmacy inventory API + M-Pesa Daraja STK push.
"""
from typing import List, Optional

from sqlalchemy.orm import Session

# Demo pharmacy catalogue — replace with real inventory DB in Phase 2
_DEMO_PHARMACIES = [
    {"id": "ph-001", "name": "Nairobi Pharmacy",  "county": "Nairobi",  "address": "Kenyatta Avenue, CBD",       "distance_km": 1.2, "accepts_mpesa": True,  "accepts_nhif": True},
    {"id": "ph-002", "name": "Goodlife Pharmacy",  "county": "Nairobi",  "address": "Westlands Shopping Centre",  "distance_km": 3.5, "accepts_mpesa": True,  "accepts_nhif": True},
    {"id": "ph-003", "name": "Haltons Pharmacy",   "county": "Nairobi",  "address": "Moi Avenue, CBD",            "distance_km": 2.1, "accepts_mpesa": True,  "accepts_nhif": False},
    {"id": "ph-004", "name": "Mimosa Pharmacy",    "county": "Nakuru",   "address": "Kenyatta Lane",              "distance_km": 0.8, "accepts_mpesa": True,  "accepts_nhif": True},
    {"id": "ph-005", "name": "Alpha Pharmacy",     "county": "Mombasa",  "address": "Moi Avenue, Mombasa",        "distance_km": 1.5, "accepts_mpesa": True,  "accepts_nhif": False},
]

_DEMO_PRICES: dict[str, int] = {
    "paracetamol": 50, "amoxicillin": 350, "metformin": 280,
    "ciprofloxacin": 420, "ibuprofen": 80, "ors": 40,
}


def find_pharmacies_with_stock(
    db: Session,
    medicine_name: str,
    county: Optional[str] = None,
) -> List[dict]:
    medicine_lower = medicine_name.lower()
    price = next(
        (v for k, v in _DEMO_PRICES.items() if k in medicine_lower),
        200,
    )

    results = _DEMO_PHARMACIES
    if county:
        results = [p for p in results if county.lower() in p["county"].lower()]

    return [
        {**p, "medicine": medicine_name, "price_kes": price, "in_stock": True}
        for p in results
    ]


def initiate_mpesa_payment(phone: str, amount_kes: int, order_id: str) -> dict:
    """
    Initiates M-Pesa STK push via Daraja API.
    Phase 2: requires MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET in .env.
    Returns simulated success for investor demo.
    """
    return {
        "success": True,
        "message": f"M-Pesa payment request sent to {phone}",
        "checkout_request_id": f"ws_CO_demo_{order_id}",
        "amount_kes": amount_kes,
    }
