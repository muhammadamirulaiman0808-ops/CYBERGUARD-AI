from datetime import datetime, timedelta, timezone

# Malaysia has no daylight saving time, so a fixed UTC+8 offset is exact.
MYT = timezone(timedelta(hours=8))


def now_str() -> str:
    """Human-readable local time stored in scan_history.date (same format as before)."""
    return datetime.now(MYT).strftime("%d/%m/%Y %H:%M")


def now_iso() -> str:
    """UTC timestamp for API responses; the browser formats it in the viewer's timezone."""
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
