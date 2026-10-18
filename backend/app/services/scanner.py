"""Runs one scan: fetch the site once, then check HTTPS, the certificate and the headers."""

import time
from dataclasses import dataclass
from typing import Mapping, Optional
from urllib.parse import urljoin, urlsplit, urlunsplit

import requests
import urllib3

from app import config
from app.clock import now_iso
from app.core import url_guard
from app.core.url_guard import UnsafeTargetError
from app.services.analysis import generate_analysis
from app.services.header_checker import check_headers, find_exposed_tech
from app.services.score import risk_level, score_scan
from app.services.ssl_checker import check_ssl

__all__ = ["run_scan", "ScanError", "UnsafeTargetError"]

USER_AGENT = "CyberGuardAI/2.0 (website security scanner)"
REQUEST_TIMEOUT = (4, 8)  # connect, read (seconds)
MAX_REDIRECTS = 5

# Unverified requests are only used to still read the headers of a site whose certificate
# is broken, and we say so in the report. Silence urllib3's per-request warning.
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class ScanError(Exception):
    """The site could not be scanned (unreachable, timed out, too many redirects)."""


@dataclass
class FetchResult:
    final_url: str
    status_code: int
    headers: Mapping[str, str]
    elapsed_ms: int
    cert_error: Optional[str] = None


def _fetch(url: str, deadline: float, verify: bool = True) -> FetchResult:
    """GET the page, following redirects by hand so every hop is validated first."""
    session = requests.Session()
    session.headers["User-Agent"] = USER_AGENT
    current = url
    started = time.monotonic()

    for _ in range(MAX_REDIRECTS + 1):
        if time.monotonic() > deadline:
            raise ScanError("The scan took too long. Try again in a moment.")

        target = url_guard.parse_target(current)
        response = session.get(
            target.url,
            timeout=REQUEST_TIMEOUT,
            allow_redirects=False,
            verify=verify,
            stream=True,  # we only need the headers, not the page body
        )
        response.close()

        if response.is_redirect:
            current = urljoin(response.url, response.headers["Location"])
            continue

        return FetchResult(
            final_url=response.url,
            status_code=response.status_code,
            headers=response.headers,
            elapsed_ms=int((time.monotonic() - started) * 1000),
        )

    raise ScanError("The site redirected too many times.")


def _candidates(target: url_guard.Target) -> list:
    """If the visitor typed no scheme, try HTTPS first and fall back to HTTP."""
    if target.explicit_scheme:
        return [target.url]
    parts = urlsplit(target.url)
    http_url = urlunsplit(("http", parts.netloc, parts.path, parts.query, ""))
    return [target.url, http_url]


def _fetch_first_working(target: url_guard.Target, deadline: float) -> FetchResult:
    for url in _candidates(target):
        try:
            return _fetch(url, deadline)
        except requests.exceptions.SSLError as exc:
            # HTTPS answers but the certificate or handshake is broken. Read the headers
            # anyway so the report is still useful, and keep the reason for the SSL result.
            try:
                result = _fetch(url, deadline, verify=False)
                result.cert_error = _short_reason(exc)
                return result
            except requests.RequestException:
                continue
        except requests.RequestException:
            continue

    raise ScanError("Could not reach the website. Check the address and try again.")


def _short_reason(exc: Exception) -> str:
    text = str(exc)
    for marker in ("certificate verify failed:", "[SSL:"):
        if marker in text:
            text = text.split(marker, 1)[1]
            break
    return text.strip(" ()'\"")[:200] or "The certificate could not be verified."


def _display_url(final_url: str) -> str:
    parts = urlsplit(final_url)
    path = "" if parts.path in ("", "/") else parts.path.rstrip("/")
    return urlunsplit((parts.scheme, parts.netloc, path, "", ""))


def run_scan(raw_input: str) -> dict:
    """Scan a website and return the complete report. Raises UnsafeTargetError or ScanError."""
    deadline = time.monotonic() + config.SCAN_TIMEOUT_SECONDS

    target = url_guard.parse_target(raw_input)
    fetched = _fetch_first_working(target, deadline)

    final = url_guard.parse_target(fetched.final_url)  # also re-validates the final host
    is_https = final.scheme == "https"

    ssl_port = final.port if is_https else 443
    ssl_info = check_ssl(final.hostname, port=ssl_port, ips=final.ips)
    if fetched.cert_error and ssl_info["status"] == "Valid":
        ssl_info = {**ssl_info, "status": "Invalid", "error": fetched.cert_error}

    https = "Enabled" if is_https else "Not Secure"
    headers = check_headers(fetched.headers, is_https)
    exposed = find_exposed_tech(fetched.headers)

    scoring = score_scan(https, ssl_info, headers)
    risk = risk_level(scoring["score"])

    result = {
        "website": _display_url(fetched.final_url),
        "requested": raw_input.strip()[:200],
        "https": https,
        "ssl": ssl_info,
        "headers": headers,
        "exposed": exposed,
        "status_code": fetched.status_code,
        "response_time_ms": fetched.elapsed_ms,
        "security_score": scoring["score"],
        "score_breakdown": scoring["breakdown"],
        "risk": risk,
        "scanned_at": now_iso(),
    }
    result.update(generate_analysis(result))
    return result
