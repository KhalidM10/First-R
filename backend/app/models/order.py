import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint, DateTime, ForeignKey,
    Index, Numeric, String, Text, func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY = "ready"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class DeliveryMethod(str, Enum):
    PICKUP = "pickup"
    DELIVERY = "delivery"


class PaymentMethod(str, Enum):
    MPESA = "mpesa"
    CASH = "cash"
    CARD = "card"
    INSURANCE = "insurance"

if TYPE_CHECKING:
    from app.models.clinic import Clinic
    from app.models.user import User


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending','confirmed','processing','ready','out_for_delivery','delivered','cancelled','refunded')",
            name="ck_order_status",
        ),
        CheckConstraint(
            "delivery_method IN ('pickup','delivery')",
            name="ck_order_delivery_method",
        ),
        CheckConstraint(
            "payment_status IN ('pending','paid','failed','refunded')",
            name="ck_order_payment_status",
        ),
        Index("ix_orders_clinic_id", "clinic_id"),
        Index("ix_orders_patient_id", "patient_id"),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_order_number", "order_number"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    clinic_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    patient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    items: Mapped[dict] = mapped_column(JSONB, nullable=False)
    subtotal_kes: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_fee_kes: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_kes: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    delivery_method: Mapped[Optional[str]] = mapped_column(String(20))
    delivery_address: Mapped[Optional[dict]] = mapped_column(JSONB)

    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    payment_status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    mpesa_transaction_id: Mapped[Optional[str]] = mapped_column(String(100))
    mpesa_receipt_number: Mapped[Optional[str]] = mapped_column(String(100))

    notes: Mapped[Optional[str]] = mapped_column(Text)
    estimated_ready_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    clinic: Mapped["Clinic"] = relationship("Clinic", back_populates="orders")
    patient: Mapped["User"] = relationship("User", back_populates="orders")

    def __repr__(self) -> str:
        return f"<Order id={self.id} number={self.order_number!r} status={self.status!r}>"
