import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, ProductResponse

router = APIRouter()


def _fetch_order(order_id: str, db: Session) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Product).filter(Product.is_active == True, Product.requires_prescription == False)
    if category and category != "all":
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    products = q.order_by(Product.category, Product.name).all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.get("/my", response_model=List[OrderResponse])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(Order)
        .filter(Order.patient_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [OrderResponse.model_validate(o) for o in orders]


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resolved: list[tuple[Product, int]] = []
    clinic_id = None

    for item in data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id, Product.is_active == True
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {item.product_id}")
        if product.requires_prescription:
            raise HTTPException(
                status_code=400,
                detail=f'"{product.name}" requires a prescription and cannot be ordered here.',
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name} (available: {product.stock_quantity})",
            )
        resolved.append((product, item.quantity))
        if clinic_id is None:
            clinic_id = product.clinic_id

    if clinic_id is None:
        raise HTTPException(status_code=400, detail="No valid products")

    subtotal = sum(p.price_kes * qty for p, qty in resolved)
    delivery_fee = 200.0 if str(data.delivery_method) == "delivery" else 0.0

    items_snapshot = [
        {
            "product_id": str(p.id),
            "name": p.name,
            "qty": qty,
            "unit_price": float(p.price_kes),
            "total": float(p.price_kes * qty),
        }
        for p, qty in resolved
    ]

    order = Order(
        order_number=f"MO-{str(uuid.uuid4()).upper().replace('-', '')[:8]}",
        clinic_id=clinic_id,
        patient_id=current_user.id,
        items=items_snapshot,
        subtotal_kes=subtotal,
        delivery_fee_kes=delivery_fee,
        total_kes=subtotal + delivery_fee,
        delivery_method=str(data.delivery_method),
        payment_method=str(data.payment_method),
    )
    db.add(order)

    for product, qty in resolved:
        product.stock_quantity = max(0, product.stock_quantity - qty)

    db.commit()
    return OrderResponse.model_validate(_fetch_order(str(order.id), db))


@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    status: OrderStatus = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in [UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")
    order = _fetch_order(order_id, db)
    order.status = str(status)
    db.commit()
    return OrderResponse.model_validate(_fetch_order(order_id, db))
