"""Small in-memory sliding-window rate limiter.

State lives in the process, which is enough for a single-instance deployment. If the API
is ever scaled to several instances, swap this for a shared store such as Redis.
"""

import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, max_calls: int, window_seconds: int):
        self.max_calls = max_calls
        self.window = window_seconds
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def check(self, key: str) -> None:
        now = time.monotonic()
        with self._lock:
            if len(self._hits) > 10_000:
                self._purge(now)
            hits = self._hits[key]
            while hits and now - hits[0] > self.window:
                hits.popleft()
            if len(hits) >= self.max_calls:
                retry_after = int(self.window - (now - hits[0])) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Try again in {retry_after} seconds.",
                    headers={"Retry-After": str(retry_after)},
                )
            hits.append(now)

    def _purge(self, now: float) -> None:
        for key in [k for k, v in self._hits.items() if not v or now - v[-1] > self.window]:
            del self._hits[key]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


def client_ip(request: Request) -> str:
    """Best-effort client address.

    Behind a reverse proxy (Render, Railway...) the proxy appends the real client address to
    the END of X-Forwarded-For, so the last entry is the one that cannot be spoofed.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return request.client.host if request.client else "unknown"


def limit_by_ip(limiter: RateLimiter):
    """Build a FastAPI dependency that rate-limits by client IP."""

    def dependency(request: Request) -> None:
        limiter.check(client_ip(request))

    return dependency
