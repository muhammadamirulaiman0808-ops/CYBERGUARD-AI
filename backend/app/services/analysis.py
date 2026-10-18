"""Turns raw scan data into findings a person can act on (rule-based, no external AI calls)."""

from app.services.header_checker import HEADER_SPECS
from app.services.score import SSL_EXPIRY_WARN_DAYS

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2, "info": 3, "pass": 4}

SUMMARIES = {
    "Low": "This website has strong baseline protection. Only minor improvements are recommended.",
    "Medium": "This website is partly protected, but several security improvements are needed.",
    "High": "This website has serious weaknesses that should be fixed as soon as possible.",
}


def _finding(severity, title, detail, fix=None):
    return {"severity": severity, "title": title, "detail": detail, "fix": fix}


def generate_analysis(result: dict) -> dict:
    """Expects result to contain https, ssl, headers, exposed and risk."""
    findings = []

    # HTTPS
    if result["https"] == "Enabled":
        findings.append(
            _finding("pass", "HTTPS is enabled", "The site is served over an encrypted connection.")
        )
    else:
        findings.append(
            _finding(
                "high",
                "HTTPS is not enabled",
                "Traffic between visitors and the site is sent as plain text and can be read or changed on the way.",
                "Install a TLS certificate and redirect all HTTP traffic to HTTPS with a 301 redirect.",
            )
        )

    # SSL / TLS certificate
    ssl = result["ssl"]
    status = ssl.get("status")
    if status == "Valid":
        days_left = ssl.get("days_left")
        if days_left is not None and days_left < SSL_EXPIRY_WARN_DAYS:
            findings.append(
                _finding(
                    "medium",
                    "SSL certificate expires soon",
                    f"The certificate expires on {ssl.get('expiry')} ({max(days_left, 0)} days left).",
                    "Renew the certificate now and turn on automatic renewal (for example Let's Encrypt with certbot).",
                )
            )
        else:
            issuer = f" Issued by {ssl['issuer']}." if ssl.get("issuer") else ""
            findings.append(
                _finding(
                    "pass",
                    "SSL certificate is valid",
                    f"Expires on {ssl.get('expiry')} ({days_left} days left).{issuer}",
                )
            )
    elif status == "Invalid":
        findings.append(
            _finding(
                "high",
                "SSL certificate has a problem",
                ssl.get("error") or "The certificate could not be verified.",
                "Install a certificate from a trusted authority that matches the domain name and has not expired.",
            )
        )
    else:
        findings.append(
            _finding(
                "high",
                "No HTTPS service found",
                ssl.get("error") or "A secure connection could not be opened on the HTTPS port.",
                "Enable HTTPS on port 443 with a valid certificate.",
            )
        )

    # Security headers
    for key, spec in HEADER_SPECS.items():
        if result["headers"].get(key) == "Enabled":
            findings.append(_finding("pass", f"{spec['label']} is set", f"The {spec['header']} header is present."))
        else:
            findings.append(_finding(spec["severity"], f"{spec['label']} is missing", spec["why"], spec["fix"]))

    # Server software disclosure
    if result.get("exposed"):
        findings.append(
            _finding(
                "low",
                "Server software details are exposed",
                "Response headers reveal what the server runs: " + "; ".join(result["exposed"]) + ".",
                "Hide version banners (`server_tokens off;` in nginx, `ServerTokens Prod` in Apache) and remove the X-Powered-By header.",
            )
        )

    findings.sort(key=lambda item: SEVERITY_ORDER[item["severity"]])

    recommendations = []
    for item in findings:
        if item["fix"] and item["fix"] not in recommendations:
            recommendations.append(item["fix"])

    return {
        "summary": SUMMARIES[result["risk"]],
        "findings": findings,
        # Plain lists kept for the PDF report and for scans saved by the first version.
        "analysis": [item["title"] for item in findings],
        "recommendations": recommendations,
    }
