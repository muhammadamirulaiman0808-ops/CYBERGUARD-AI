def calculate_score(https, ssl_status, headers):

    score = 100

    if https != "Enabled":
        score -= 20

    if ssl_status != "Valid":
        score -= 20

    if isinstance(headers, dict):
        for value in headers.values():
            if value == "Missing":
                score -= 10

    if score < 0:
        score = 0

    return score