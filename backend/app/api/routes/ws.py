"""
WebSocket endpoint — /api/v1/ws

Auth: reads access_token from httpOnly cookie (same as REST endpoints).
WS clients also pass ?token=<access_token> as a fallback for environments
where cookie forwarding to WS upgrades isn't straightforward.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Cookie, Query, WebSocket, WebSocketDisconnect
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.core.ws_manager import ws_manager
from app.database import SessionLocal
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


def _authenticate_ws(token: str) -> Optional[User]:
    """Return the User for a valid access token, or None."""
    if not token:
        return None
    db: Session = SessionLocal()
    try:
        payload = decode_token(token)
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return db.query(User).filter(User.id == user_id, User.is_active == True).first()
    except (JWTError, Exception):
        return None
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    # Query param fallback (for environments where cookie → WS is tricky)
    token: Optional[str] = Query(None),
    # httpOnly cookie (sent automatically by browser on same-origin WS)
    access_token: Optional[str] = Cookie(None),
):
    resolved_token = token or access_token
    user = _authenticate_ws(resolved_token) if resolved_token else None

    if not user:
        await websocket.close(code=4001)  # 4001 = unauthenticated
        return

    clinic_id = str(user.clinic_id) if user.clinic_id else None
    await ws_manager.connect(websocket, str(user.id), clinic_id)

    try:
        # Send initial "connected" handshake so the client knows auth succeeded
        await websocket.send_json({
            "type": "connected",
            "data": {
                "user_id": str(user.id),
                "role": user.role,
                "clinic_id": clinic_id,
            },
        })

        # Keep the connection alive — handle ping/pong or client messages
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")

    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.debug("WS error for user %s: %s", user.id, exc)
    finally:
        ws_manager.disconnect(websocket, str(user.id), clinic_id)
