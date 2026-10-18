from app.services.header_checker import HEADER_SPECS

HTTPS_POINTS = 25
SSL_POINTS = 25
SSL_EXPIRING_POINTS = 15  # certificate valid but expires within SSL_EXPIRY_WARN_DAYS
SSL_EXPIRY_WARN_DAYS = 14
# HTTPS (25) + SSL (25) + headers (50) = 100


def score_scan(https: str, ssl: dict, headers: dict) -> dict:
    """Return {"score": int, "breakdown": [{key, label, points, max}, ...]}."""
    breakdown = [
        {
            "key": "https",
            "label": "HTTPS",
            "points": HTTPS_POINTS if https == "Enabled" else 0,
            "max": HTTPS_POINTS,
        }
    ]

    ssl_points = 0
    if ssl.get("status") == "Valid":
        days_left = ssl.get("days_left")
        expiring = days_left is not None and days_left < SSL_EXPIRY_WARN_DAYS
        ssl_points = SSL_EXPIRING_POINTS if expiring else SSL_POINTS
    breakdown.append({"key": "ssl", "label": "SSL certificate", "points": ssl_points, "max": SSL_POINTS})

    for key, spec in HEADER_SPECS.items():
        present = headers.get(key) == "Enabled"
        breakdown.append(
            {
                "key": key,
                "label": spec["label"],
                "points": spec["weight"] if present else 0,
                "max": spec["weight"],
            }
        )

    return {"score": sum(item["points"] for item in breakdown), "breakdown": breakdown}


def risk_level(score: int) -> str:
    if score >= 80:
        return "Low"
    if score >= 50:
        return "Medium"
    return "High"
