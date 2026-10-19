"""Small in-memory sliding-window rate limiter.

Good enough for a single server instance. If you ever run several instances,
move this to Redis (e.g. slowapi + Redis) so the counters are shared.
"""
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

from . import config


class RateLimiter:
    def __init__(self, limit: int, window_seconds: int = 60, message: str = "Too many requests."):
        self.limit = limit
        self.window = window_seconds
        self.message = message
        self._hits: dict[str, deque] = defaultdict(deque)
        self._lock = threading.Lock()

    def hit(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            q = self._hits[key]
            while q and now - q[0] > self.window:
                q.popleft()
            if len(q) >= self.limit:
                retry = max(1, int(self.window - (now - q[0])))
                raise HTTPException(
                    status_code=429,
                    detail=f"{self.message} Try again in {retry} seconds.",
                    headers={"Retry-After": str(retry)},
                )
            q.append(now)
            if len(self._hits) > 5000:  # keep memory bounded
                for k in [k for k, v in self._hits.items() if not v]:
                    del self._hits[k]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()

    def by_ip(self):
        """Return a FastAPI dependency that limits per client IP."""

        def dependency(request: Request) -> None:
            self.hit(request.client.host if request.client else "unknown")

        return dependency


login_limiter = RateLimiter(10, 60, "Too many sign-in attempts.")
register_limiter = RateLimiter(5, 60, "Too many sign-up attempts.")
feedback_limiter = RateLimiter(5, 60, "Too many feedback submissions.")
scan_limiter = RateLimiter(config.SCAN_RATE_LIMIT, 60, "You are scanning too quickly.")

ALL_LIMITERS = [login_limiter, register_limiter, feedback_limiter, scan_limiter]
