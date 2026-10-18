"""Which browser security headers we look for, how much each is worth, and how to read them."""

import re
from typing import List, Mapping

# key -> metadata. "weight" is the number of score points (all weights add up to 50).
HEADER_SPECS = {
    "HSTS": {
        "header": "Strict-Transport-Security",
        "label": "HSTS",
        "weight": 12,
        "severity": "high",
        "why": "Without HSTS, a visitor's first request can be downgraded to plain HTTP and intercepted.",
        "fix": "Send `Strict-Transport-Security: max-age=31536000; includeSubDomains` on every HTTPS response.",
    },
    "CSP": {
        "header": "Content-Security-Policy",
        "label": "Content Security Policy",
        "weight": 12,
        "severity": "high",
        "why": "Without a CSP, a single cross-site scripting (XSS) bug lets an attacker run any script on your pages.",
        "fix": "Add a Content-Security-Policy that limits where scripts and resources can load from, starting with `default-src 'self'`.",
    },
    "Clickjacking": {
        "header": "X-Frame-Options",
        "label": "Clickjacking protection",
        "weight": 10,
        "severity": "medium",
        "why": "Another site can embed your page in a hidden frame and trick visitors into clicking buttons on it.",
        "fix": "Send `X-Frame-Options: DENY` (or `SAMEORIGIN`), or use the CSP directive `frame-ancestors 'self'`.",
    },
    "MIME": {
        "header": "X-Content-Type-Options",
        "label": "MIME sniffing protection",
        "weight": 6,
        "severity": "low",
        "why": "Browsers may guess a file's type and run an uploaded file as a script.",
        "fix": "Send `X-Content-Type-Options: nosniff`.",
    },
    "Referrer": {
        "header": "Referrer-Policy",
        "label": "Referrer policy",
        "weight": 5,
        "severity": "low",
        "why": "Full page URLs, which can contain tokens or IDs, may be sent to other sites your visitors click through to.",
        "fix": "Send `Referrer-Policy: strict-origin-when-cross-origin`.",
    },
    "Permissions": {
        "header": "Permissions-Policy",
        "label": "Permissions policy",
        "weight": 5,
        "severity": "low",
        "why": "Browser features such as camera, microphone and location stay available to embedded or injected content.",
        "fix": "Send a Permissions-Policy that turns off features you don't use, e.g. `camera=(), microphone=(), geolocation=()`.",
    },
}

# Headers that reveal what software the server runs.
_DISCLOSURE_HEADERS = ("server", "x-powered-by", "x-aspnet-version", "x-aspnetmvc-version")


def _lower(headers: Mapping[str, str]) -> dict:
    return {str(k).lower(): str(v) for k, v in headers.items()}


def check_headers(headers: Mapping[str, str], is_https: bool) -> dict:
    """Return {key: "Enabled" | "Missing"} for every header in HEADER_SPECS."""
    h = _lower(headers)
    csp = h.get("content-security-policy", "")

    result = {}
    for key, spec in HEADER_SPECS.items():
        present = spec["header"].lower() in h

        if key == "HSTS":
            # HSTS is ignored over plain HTTP, and max-age=0 switches it off.
            max_age = re.search(r"max-age\s*=\s*(\d+)", h.get("strict-transport-security", ""), re.I)
            present = present and is_https and not (max_age and int(max_age.group(1)) == 0)
        elif key == "MIME":
            present = "nosniff" in h.get("x-content-type-options", "").lower()
        elif key == "Clickjacking":
            present = present or "frame-ancestors" in csp.lower()
        elif key == "Permissions":
            present = present or "feature-policy" in h

        result[key] = "Enabled" if present else "Missing"
    return result


def find_exposed_tech(headers: Mapping[str, str]) -> List[str]:
    """List headers that disclose server software or versions, e.g. 'Server: nginx/1.18.0'."""
    h = _lower(headers)
    exposed = []
    for name in _DISCLOSURE_HEADERS:
        value = h.get(name, "").strip()
        if not value:
            continue
        # A bare "Server: nginx" is common and low value; flag versions and framework headers.
        if name != "server" or re.search(r"\d", value):
            exposed.append(f"{name.title()}: {value[:80]}")
    return exposed
