import ssl
import socket
from datetime import datetime


def check_ssl(domain):
    try:
        context = ssl.create_default_context()

        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:

                cert = ssock.getpeercert()

                expiry = datetime.strptime(
                    cert["notAfter"],
                    "%b %d %H:%M:%S %Y %Z"
                )

                return {
                    "status": "Valid",
                    "expiry": expiry.strftime("%Y-%m-%d")
                }

    except Exception as e:
        return {
            "status": "Invalid",
            "expiry": None,
            "error": str(e)
        }