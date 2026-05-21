import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_clinic_id", "clinic_id"),
        Index("ix_products_category", "category"),
        Index("ix_products_is_active", "is_active"),
        Index("ix_products_name", "name"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clinic_id = Column(UUID(as_uuid=True), ForeignKey("clinics.id"), nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False, default="general")
    description = Column(Text, nullable=True)
    price_kes = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=100)
    requires_prescription = Column(Boolean, default=False, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    clinic = relationship("Clinic", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
