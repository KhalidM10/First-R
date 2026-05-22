"""
IP Geolocation service.

Uses ip-api.com (free, no key, 45 req/min for HTTP).
Private/loopback IPs return Nairobi defaults for local dev.
Results are cached in-process with a 24-hour TTL.
"""
import ipaddress
import time
from dataclasses import dataclass
from typing import Optional

import httpx

_GEO_CACHE: dict[str, tuple[dict, float]] = {}
_GEO_TTL = 86_400  # 24 hours


@dataclass
class GeoInfo:
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    timezone: Optional[str] = None
    is_private: bool = False


_DEV_GEO = GeoInfo(country="Kenya", country_code="KE", city="Nairobi", region="Nairobi", timezone="Africa/Nairobi", is_private=True)


def _is_private(ip: str) -> bool:
    try:
        return ipaddress.ip_address(ip).is_private or ipaddress.ip_address(ip).is_loopback
    except ValueError:
        return False


def _from_cache(ip: str) -> Optional[GeoInfo]:
    entry = _GEO_CACHE.get(ip)
    if entry and entry[1] > time.monotonic():
        return GeoInfo(**entry[0])
    return None


def _to_cache(ip: str, info: GeoInfo) -> None:
    _GEO_CACHE[ip] = (info.__dict__, time.monotonic() + _GEO_TTL)


def get_geo_sync(ip: str) -> GeoInfo:
    """Synchronous geo lookup — use in non-async contexts."""
    if not ip or ip == "0.0.0.0" or _is_private(ip):
        return _DEV_GEO

    cached = _from_cache(ip)
    if cached:
        return cached

    try:
        resp = httpx.get(
            f"http://ip-api.com/json/{ip}",
            params={"fields": "country,countryCode,city,regionName,timezone,status"},
            timeout=3.0,
        )
        data = resp.json()
        if data.get("status") == "success":
            info = GeoInfo(
                country=data.get("country"),
                country_code=data.get("countryCode"),
                city=data.get("city"),
                region=data.get("regionName"),
                timezone=data.get("timezone"),
            )
        else:
            info = GeoInfo()
    except Exception:
        info = GeoInfo()

    _to_cache(ip, info)
    return info


async def get_geo(ip: str) -> GeoInfo:
    """Async geo lookup — use in FastAPI async contexts."""
    if not ip or ip == "0.0.0.0" or _is_private(ip):
        return _DEV_GEO

    cached = _from_cache(ip)
    if cached:
        return cached

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(
                f"http://ip-api.com/json/{ip}",
                params={"fields": "country,countryCode,city,regionName,timezone,status"},
            )
            data = resp.json()
            if data.get("status") == "success":
                info = GeoInfo(
                    country=data.get("country"),
                    country_code=data.get("countryCode"),
                    city=data.get("city"),
                    region=data.get("regionName"),
                    timezone=data.get("timezone"),
                )
            else:
                info = GeoInfo()
    except Exception:
        info = GeoInfo()

    _to_cache(ip, info)
    return info


def parse_user_agent(ua_string: Optional[str]) -> tuple[str, str, str]:
    """
    Returns (device_type, browser, os) from a User-Agent string.
    Gracefully falls back to 'unknown' if user-agents library is missing.
    """
    if not ua_string:
        return "unknown", "unknown", "unknown"

    try:
        from user_agents import parse
        ua = parse(ua_string)
        if ua.is_mobile:
            device_type = "mobile"
        elif ua.is_tablet:
            device_type = "tablet"
        else:
            device_type = "desktop"
        browser = ua.browser.family or "unknown"
        os_name = ua.os.family or "unknown"
        return device_type, browser, os_name
    except ImportError:
        return "unknown", "unknown", "unknown"
