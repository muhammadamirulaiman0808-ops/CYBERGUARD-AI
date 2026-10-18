import socket
import ssl
from datetime import datetime, timezone
from typing import List, Optional


def _name(parts) -> Optional[str]:
    """Pull a readable name out of a certificate subject/issuer tuple."""
    flat = {key: value for rdn in (parts or ()) for key, value in rdn}
    return flat.get("organizationName") or flat.get("commonName")


def _describe(cert: dict, protocol: Optional[str]) -> dict:
    expires = datetime.fromtimestamp(ssl.cert_time_to_seconds(cert["notAfter"]), timezone.utc)
    days_left = (expires - datetime.now(timezone.utc)).days
    return {
        "status": "Valid",
        "expiry": expires.strftime("%Y-%m-%d"),
        "days_left": days_left,
        "issuer": _name(cert.get("issuer")),
        "protocol": protocol,
        "error": None,
    }


def _failure(status: str, error: str) -> dict:
    return {
        "status": status,
        "expiry": None,
        "days_left": None,
        "issuer": None,
        "protocol": None,
        "error": error,
    }


def check_ssl(hostname: str, port: int = 443, ips: Optional[List[str]] = None, timeout: int = 6) -> dict:
    """Check the TLS certificate.

    status is "Valid", "Invalid" (certificate or handshake problem) or "Unavailable"
    (nothing is listening for HTTPS). When `ips` is given the connection goes to those
    already-validated addresses, so the host cannot resolve somewhere else mid-scan.
    """
    context = ssl.create_default_context()
    last_error = "Could not connect on the HTTPS port."

    for host in ips or [hostname]:
        try:
            with socket.create_connection((host, port), timeout=timeout) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as secure:
                    return _describe(secure.getpeercert(), secure.version())
        except ssl.SSLCertVerificationError as exc:
            return _failure("Invalid", exc.verify_message or str(exc))
        except ssl.SSLError as exc:
            return _failure("Invalid", exc.reason or str(exc))
        except OSError as exc:
            last_error = f"Could not connect on port {port}: {exc.strerror or exc}"

    return _failure("Unavailable", last_error)
