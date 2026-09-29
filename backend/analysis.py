HEADER_RECOMMENDATIONS = {
    "HSTS": "Enable HSTS to force HTTPS.",
    "CSP": "Add a Content-Security-Policy header to reduce XSS attacks.",
    "Clickjacking": "Enable X-Frame-Options to prevent Clickjacking.",
    "MIME": "Enable X-Content-Type-Options to stop MIME sniffing."
}


def generate_analysis(result):

    analysis = []
    recommendations = []

    # HTTPS
    if result["https"] == "Enabled":
        analysis.append("HTTPS is enabled.")
    else:
        analysis.append("HTTPS is NOT enabled.")
        recommendations.append(
            "Use HTTPS and redirect all HTTP traffic to HTTPS."
        )

    # SSL
    if result["ssl"]["status"] == "Valid":
        analysis.append("SSL Certificate is valid.")
    else:
        analysis.append("SSL Certificate has issues.")
        recommendations.append(
            "Renew or install a valid SSL certificate."
        )

    # Security Headers
    headers = result["headers"]

    for header, status in headers.items():

        if status == "Missing":

            analysis.append(f"{header} is missing.")

            if header in HEADER_RECOMMENDATIONS:
                recommendations.append(HEADER_RECOMMENDATIONS[header])
            else:
                recommendations.append(
                    f"Add the {header} header to improve security."
                )

    return {

        "analysis": analysis,

        "recommendations": recommendations

    }