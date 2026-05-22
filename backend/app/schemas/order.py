import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator

from app.models.order import DeliveryMethod, OrderStatus, PaymentMethod


class ProductResponse(BaseModel):
    id: uuid.UUID
    clinic_id: uuid.UUID
    clinic_name: Optional[str] = None
    name: str
    category: str
    description: Optional[str] = None
    price_kes: float
    stock_quantity: int
    requires_prescription: bool
    image_url: Optional[str] = None
    is_active: bool

    @classmethod
    def model_validate(cls, obj: Any, **kw):  # type: ignore[override]
        if isinstance(obj, dict):
            return super().model_validate(obj, **kw)
        d = {
            "id": obj.id,
            "clinic_id": obj.clinic_id,
            "name": obj.name,
            "category": obj.category,
            "description": obj.description,
            "price_kes": float(obj.price_kes),
            "stock_quantity": obj.stock_quantity,
            "requires_prescription": obj.requires_prescription,
            "image_url": obj.image_url,
            "is_active": obj.is_active,
        }
        try:
            d["clinic_name"] = obj.clinic.name if obj.clinic else None
        except Exception:
            d["clinic_name"] = None
        return super().model_validate(d, **kw)

    model_config = {"from_attributes": True}


class OrderItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderCreate(BaseModel):
    items: List[OrderItemCreate]
    delivery_method: DeliveryMethod = DeliveryMethod.PICKUP
    delivery_address: Optional[str] = None
    payment_method: PaymentMethod = PaymentMethod.MPESA

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


class OrderResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    order_number: str
    items: List[Dict[str, Any]] = []
    subtotal_kes: float
    delivery_fee_kes: float
    total_kes: float
    status: str
    delivery_method: Optional[str] = None
    delivery_address: Optional[Any] = None
    payment_method: Optional[str] = None
    mpesa_transaction_id: Optional[str] = None
    created_at: datetime

    @classmethod
    def model_validate(cls, obj: Any, **kw):  # type: ignore[override]
        if isinstance(obj, dict):
            return super().model_validate(obj, **kw)
        d = {
            "id": obj.id,
            "patient_id": obj.patient_id,
            "order_number": obj.order_number,
            "items": obj.items or [],
            "subtotal_kes": float(obj.subtotal_kes),
            "delivery_fee_kes": float(obj.delivery_fee_kes),
            "total_kes": float(obj.total_kes),
            "status": obj.status,
            "delivery_method": obj.delivery_method,
            "delivery_address": obj.delivery_address,
            "payment_method": obj.payment_method,
            "mpesa_transaction_id": obj.mpesa_transaction_id,
            "created_at": obj.created_at,
        }
        return super().model_validate(d, **kw)

    model_config = {"from_attributes": True}
