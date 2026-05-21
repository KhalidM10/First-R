import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, DateTime, Enum, Float, ForeignKey,
    Index, Integer, String,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from app.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    DELIVERED = "delivered"


class DeliveryMethod(str, enum.Enum):
    PICKUP = "pickup"
    DELIVERY = "delivery"


class PaymentMethod(str, enum.Enum):
    MPESA = "mpesa"
    CASH = "cash"


class MedicineOrder(Base):
    __tablename__ = "medicine_orders"
    __table_args__ = (
        Index("ix_medicine_orders_patient_id", "patient_id"),
        Index("ix_medicine_orders_clinic_id", "clinic_id"),
        Index("ix_medicine_orders_status", "status"),
        Index("ix_medicine_orders_created_at", "created_at"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=True)
    items = Column(JSONB, default=list)
    total_amount_kes = Column(Float, default=0.0, nullable=False)
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    delivery_method = Column(Enum(DeliveryMethod), default=DeliveryMethod.PICKUP)
    delivery_address = Column(String(500), nullable=True)
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.MPESA)
    mpesa_transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("User", back_populates="medicine_orders")
    clinic = relationship("Clinic", back_populates="medicine_orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    __table_args__ = (
        Index("ix_order_items_order_id", "order_id"),
        Index("ix_order_items_product_id", "product_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("medicine_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price_kes = Column(Float, nullable=False)

    order = relationship("MedicineOrder", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
