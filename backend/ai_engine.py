def generate_ai_report(
    https,
    ssl_status,
    headers,
    score
):

    issues = []

    recommendations = []


    # HTTPS CHECK

    if not https:

        issues.append(
            "HTTPS is not enabled"
        )

        recommendations.append(
            "Enable HTTPS using a valid SSL certificate"
        )


    # SSL CHECK

    if ssl_status != "Valid":

        issues.append(
            "SSL certificate problem"
        )

        recommendations.append(
            "Install or renew SSL certificate"
        )


    # HEADER CHECK

    for key,value in headers.items():


        if value == "Missing":

            issues.append(
                f"{key} security header missing"
            )


    if "CSP" in headers and headers["CSP"] == "Missing":

        recommendations.append(
            "Add Content-Security-Policy header to prevent XSS attacks"
        )


    if "HSTS" in headers and headers["HSTS"] == "Missing":

        recommendations.append(
            "Enable HSTS to enforce HTTPS connections"
        )


    # RISK LEVEL

    if score >= 80:

        risk = "LOW"


    elif score >= 50:

        risk = "MEDIUM"


    else:

        risk = "HIGH"



    # SUMMARY

    if risk == "LOW":

        summary = (
            "Your website has strong security protection. "
            "Only minor improvements are recommended."
        )


    elif risk == "MEDIUM":

        summary = (
            "Your website is protected but several "
            "security improvements are needed."
        )


    else:

        summary = (
            "Your website has serious security weaknesses "
            "that should be fixed immediately."
        )



    return {

        "risk_level": risk,

        "summary": summary,

        "issues": issues,

        "recommendations": recommendations

    }