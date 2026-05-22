"""
WebSocket connection manager with Redis pub/sub.

Architecture:
  - Each authenticated user gets one (or more) WS connections in memory.
  - Events are published to Redis channels so all API server instances
    can fan-out to their local connections.
  - Channels:  user:{user_id}     – personal events (patient or clinic staff)
               clinic:{clinic_id} – clinic-wide events (new booking, new order)
  - Falls back gracefully if Redis is unavailable (in-process broadcast only).
"""
import asyncio
import json
import logging
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        # user_id → list of active WebSocket connections
        self._connections: Dict[str, List[WebSocket]] = {}
        # clinic_id → set of user_ids currently connected
        self._clinic_members: Dict[str, Set[str]] = {}
        self._redis = None
        self._redis_pub = None
        self._pubsub_task: Optional[asyncio.Task] = None

    # ── Redis setup ───────────────────────────────────────────────────────────

    async def init_redis(self, redis_url: str) -> None:
        try:
            import redis.asyncio as aioredis
            self._redis = await aioredis.from_url(redis_url, decode_responses=True)
            self._redis_pub = await aioredis.from_url(redis_url, decode_responses=True)
            self._pubsub_task = asyncio.create_task(self._pubsub_listener())
            logger.info("WS manager: Redis pub/sub connected")
        except Exception as exc:
            logger.warning("WS manager: Redis unavailable (%s) — in-process only", exc)

    async def _pubsub_listener(self) -> None:
        """Listen on Redis pub/sub and forward messages to local WS connections."""
        if not self._redis:
            return
        try:
            pubsub = self._redis.pubsub()
            await pubsub.psubscribe("user:*", "clinic:*")
            async for message in pubsub.listen():
                if message["type"] != "pmessage":
                    continue
                channel: str = message["channel"]
                data: str = message["data"]
                try:
                    if channel.startswith("user:"):
                        uid = channel[5:]
                        await self._send_to_user_local(uid, data)
                    elif channel.startswith("clinic:"):
                        cid = channel[7:]
                        await self._send_to_clinic_local(cid, data)
                except Exception as exc:
                    logger.debug("pubsub dispatch error: %s", exc)
        except Exception as exc:
            logger.warning("pubsub listener crashed: %s", exc)

    # ── Connection lifecycle ──────────────────────────────────────────────────

    async def connect(self, websocket: WebSocket, user_id: str, clinic_id: Optional[str] = None) -> None:
        await websocket.accept()
        self._connections.setdefault(user_id, []).append(websocket)
        if clinic_id:
            self._clinic_members.setdefault(clinic_id, set()).add(user_id)
        logger.debug("WS connect: user=%s clinic=%s  total=%d", user_id, clinic_id, self._total())

    def disconnect(self, websocket: WebSocket, user_id: str, clinic_id: Optional[str] = None) -> None:
        conns = self._connections.get(user_id, [])
        if websocket in conns:
            conns.remove(websocket)
        if not conns:
            self._connections.pop(user_id, None)
        if clinic_id and clinic_id in self._clinic_members:
            if user_id not in self._connections:
                self._clinic_members[clinic_id].discard(user_id)
        logger.debug("WS disconnect: user=%s  total=%d", user_id, self._total())

    # ── Public publish API (called from route handlers) ───────────────────────

    async def publish_to_user(self, user_id: str, payload: dict) -> None:
        """Publish an event to a specific user (all their open tabs)."""
        data = json.dumps(payload)
        if self._redis_pub:
            try:
                await self._redis_pub.publish(f"user:{user_id}", data)
                return
            except Exception as exc:
                logger.debug("Redis publish failed: %s — falling back", exc)
        await self._send_to_user_local(user_id, data)

    async def publish_to_clinic(self, clinic_id: str, payload: dict) -> None:
        """Publish an event to all users connected to a clinic dashboard."""
        data = json.dumps(payload)
        if self._redis_pub:
            try:
                await self._redis_pub.publish(f"clinic:{clinic_id}", data)
                return
            except Exception as exc:
                logger.debug("Redis publish failed: %s — falling back", exc)
        await self._send_to_clinic_local(clinic_id, data)

    # ── Internal send helpers ─────────────────────────────────────────────────

    async def _send_to_user_local(self, user_id: str, data: str) -> None:
        dead: List[WebSocket] = []
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            conns = self._connections.get(user_id, [])
            if ws in conns:
                conns.remove(ws)

    async def _send_to_clinic_local(self, clinic_id: str, data: str) -> None:
        for uid in list(self._clinic_members.get(clinic_id, set())):
            await self._send_to_user_local(uid, data)

    def _total(self) -> int:
        return sum(len(v) for v in self._connections.values())


# ── Singleton ─────────────────────────────────────────────────────────────────
ws_manager = ConnectionManager()
