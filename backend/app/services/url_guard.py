"""Decides which URLs the scanner may touch.

Without this, a signed-in user could ask the server to "scan" http://localhost,
http://169.254.169.254 (cloud metadata) or anything on the hosting network
(server-side request forgery). Every URL, including every redirect hop, goes
through here before a request is made.

Known limit: DNS can change between this check and the HTTP request (DNS
rebinding). The TLS check connects to the already-validated IP to avoid that;
the HTTP fetch does not. For a hardened deployment, run the scanner in a
network-isolated worker.
"""
import ipaddress
import socket
from urllib.parse import ParseResult, urlparse

from .. import config

ALLOWED_PORTS = {80, 443, 8080, 8443}


class ScanError(Exception):
    """An expected, user-facing scan failure."""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_target(raw: str) -> tuple[ParseResult, bool]:
    """Return (parsed_url, scheme_was_given). Bare domains default to https."""
    raw = (raw or "").strip()
    if not raw:
        raise ScanError("Enter a website address to scan.")
    if len(raw) > 2048:
        raise ScanError("That address is too long.")

    has_scheme = "://" in raw
    parsed = urlparse(raw if has_scheme else f"https://{raw}")

    if parsed.scheme not in ("http", "https"):
        raise ScanError("Only http:// and https:// addresses can be scanned.")
    if not parsed.hostname:
        raise ScanError("That doesn't look like a website address. Try something like example.com.")
    if parsed.username or parsed.password:
        raise ScanError("Addresses with a username or password in them can't be scanned.")
    try:
        port = parsed.port
    except ValueError:
        raise ScanError("The port number in that address isn't valid.")
    if port is not None and port not in ALLOWED_PORTS:
        raise ScanError("Only the standard web ports (80, 443, 8080, 8443) can be scanned.")
    return parsed, has_scheme


def _ip_is_public(ip_text: str) -> bool:
    ip = ipaddress.ip_address(ip_text.split("%")[0])
    if ip.version == 6 and ip.ipv4_mapped:
        ip = ip.ipv4_mapped
    return ip.is_global


def resolve_public_ips(host: str) -> list[str]:
    """Resolve a hostname and refuse private, loopback, link-local or reserved targets."""
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise ScanError("We couldn't find that domain. Check the spelling and try again.")
    except UnicodeError:
        raise ScanError("That domain name isn't valid.")

    ips = list(dict.fromkeys(info[4][0] for info in infos))
    if not ips:
        raise ScanError("We couldn't find that domain. Check the spelling and try again.")
    if not config.ALLOW_PRIVATE_TARGETS and not all(_ip_is_public(ip) for ip in ips):
        raise ScanError("Private, local and reserved addresses can't be scanned.")
    return ips
