from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.models.order import MedicineOrder, OrderItem, OrderStatus
from app.models.product import Product
from app.schemas.order import OrderCreate, OrderResponse, ProductResponse

router = APIRouter()


def _fetch_order(order_id: str, db: Session) -> MedicineOrder:
    order = (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.order_items).joinedload(OrderItem.product))
        .filter(MedicineOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.get("/products", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = (
        db.query(Product)
        .filter(Product.is_active == True, Product.requires_prescription == False)
        .options(joinedload(Product.clinic))
    )
    if category and category != "all":
        q = q.filter(Product.category == category)
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    products = q.order_by(Product.category, Product.name).all()
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/products/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    product = (
        db.query(Product)
        .options(joinedload(Product.clinic))
        .filter(Product.id == product_id, Product.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.get("/my", response_model=List[OrderResponse])
def my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(MedicineOrder)
        .options(joinedload(MedicineOrder.order_items).joinedload(OrderItem.product))
        .filter(MedicineOrder.patient_id == current_user.id)
        .order_by(MedicineOrder.created_at.desc())
        .all()
    )
    return [OrderResponse.model_validate(o) for o in orders]


@router.post("/", response_model=OrderResponse, status_code=201)
def create_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = 0.0
    resolved: list[tuple[Product, int]] = []

    for item in data.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id, Product.is_active == True)
            .first()
        )
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
        total += product.price_kes * item.quantity

    order = MedicineOrder(
        patient_id=current_user.id,
        total_amount_kes=total,
        delivery_method=data.delivery_method,
        delivery_address=data.delivery_address,
        payment_method=data.payment_method,
        items=[],
    )
    db.add(order)
    db.flush()

    items_snapshot = []
    for product, qty in resolved:
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price_kes=product.price_kes,
        ))
        product.stock_quantity = max(0, product.stock_quantity - qty)
        items_snapshot.append({
            "name": product.name,
            "qty": qty,
            "unit_price": product.price_kes,
            "total": qty * product.price_kes,
        })

    order.items = items_snapshot
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
    order.status = status
    db.commit()
    return OrderResponse.model_validate(_fetch_order(order_id, db))
