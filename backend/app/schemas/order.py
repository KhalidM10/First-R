import uuid
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, field_validator, model_validator

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

    @model_validator(mode="before")
    @classmethod
    def enrich(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        cols = [
            "id", "clinic_id", "name", "category", "description",
            "price_kes", "stock_quantity", "requires_prescription",
            "image_url", "is_active",
        ]
        d = {c: getattr(data, c, None) for c in cols}
        try:
            d["clinic_name"] = data.clinic.name if data.clinic else None
        except Exception:
            d["clinic_name"] = None
        return d

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


class OrderItemResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit_price_kes: float
    total_kes: float


class OrderResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    order_reference: str
    items_detail: List[OrderItemResponse] = []
    total_amount_kes: float
    status: OrderStatus
    delivery_method: DeliveryMethod
    delivery_address: Optional[str] = None
    payment_method: PaymentMethod
    mpesa_transaction_id: Optional[str] = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def enrich(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        cols = [
            "id", "patient_id", "total_amount_kes", "status",
            "delivery_method", "delivery_address", "payment_method",
            "mpesa_transaction_id", "created_at",
        ]
        d = {c: getattr(data, c, None) for c in cols}
        d["order_reference"] = f"MO-{str(data.id).upper().replace('-', '')[:8]}"
        try:
            d["items_detail"] = [
                {
                    "product_id": oi.product_id,
                    "product_name": oi.product.name if oi.product else "Unknown",
                    "quantity": oi.quantity,
                    "unit_price_kes": oi.unit_price_kes,
                    "total_kes": oi.quantity * oi.unit_price_kes,
                }
                for oi in (data.order_items or [])
            ]
        except Exception:
            d["items_detail"] = []
        return d

    model_config = {"from_attributes": True}
