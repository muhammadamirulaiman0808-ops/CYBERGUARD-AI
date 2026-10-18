"""Validates scan targets so the scanner cannot be used to reach internal systems (SSRF).

Every URL, including each redirect hop, goes through parse_target() before a request is made.
"""

import ipaddress
import socket
from dataclasses import dataclass, field
from typing import List
from urllib.parse import urlsplit, urlunsplit

from app import config

ALLOWED_PORTS = {80, 443, 8080, 8443}
MAX_INPUT_LENGTH = 2048


class UnsafeTargetError(ValueError):
    """The address is invalid or points somewhere the scanner must not connect to."""


@dataclass
class Target:
    url: str
    scheme: str
    hostname: str
    port: int
    explicit_scheme: bool
    ips: List[str] = field(default_factory=list)


def is_public_ip(value: str) -> bool:
    ip = ipaddress.ip_address(value)
    mapped = getattr(ip, "ipv4_mapped", None)
    if mapped is not None:  # ::ffff:127.0.0.1 and friends
        ip = mapped
    return bool(ip.is_global and not ip.is_multicast and not ip.is_reserved)


def parse_target(raw: str) -> Target:
    raw = (raw or "").strip()
    if not raw:
        raise UnsafeTargetError("Enter a website address to scan.")
    if len(raw) > MAX_INPUT_LENGTH:
        raise UnsafeTargetError("That address is too long.")

    explicit = "://" in raw
    if explicit and not raw.lower().startswith(("http://", "https://")):
        raise UnsafeTargetError("Only http:// and https:// addresses can be scanned.")
    candidate = raw if explicit else f"https://{raw}"

    try:
        parts = urlsplit(candidate)
        port = parts.port
        hostname = parts.hostname
    except ValueError:
        raise UnsafeTargetError("That doesn't look like a valid website address.")

    if not hostname:
        raise UnsafeTargetError("That doesn't look like a valid website address.")
    if parts.username or parts.password:
        raise UnsafeTargetError("Addresses with a username or password are not allowed.")

    scheme = parts.scheme.lower()
    port = port or (443 if scheme == "https" else 80)
    if port not in ALLOWED_PORTS:
        raise UnsafeTargetError("Only ports 80, 443, 8080 and 8443 can be scanned.")

    hostname = hostname.rstrip(".").lower()
    try:
        hostname = hostname.encode("idna").decode("ascii")
    except UnicodeError:
        raise UnsafeTargetError("That doesn't look like a valid website address.")

    try:
        infos = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        raise UnsafeTargetError(f"Could not find {hostname}. Check the spelling and try again.")

    ips = []
    for info in infos:
        ip = info[4][0].split("%")[0]  # drop IPv6 zone id
        if ip not in ips:
            ips.append(ip)
    if not ips:
        raise UnsafeTargetError(f"Could not find {hostname}. Check the spelling and try again.")

    if not config.ALLOW_PRIVATE_TARGETS and not all(is_public_ip(ip) for ip in ips):
        raise UnsafeTargetError(
            "That address points to a private or internal network, so it can't be scanned."
        )

    netloc = hostname if ":" not in hostname else f"[{hostname}]"
    if parts.port:
        netloc = f"{netloc}:{parts.port}"
    url = urlunsplit((scheme, netloc, parts.path or "/", parts.query, ""))

    return Target(
        url=url,
        scheme=scheme,
        hostname=hostname,
        port=port,
        explicit_scheme=explicit,
        ips=ips,
    )
