import requests

SECURITY_HEADERS = {
    "Strict-Transport-Security": "HSTS",
    "Content-Security-Policy": "CSP",
    "X-Frame-Options": "Clickjacking",
    "X-Content-Type-Options": "MIME"
}


def check_headers(url):
    try:
        response = requests.get(url, timeout=5)

        headers = response.headers

        result = {}

        for header, name in SECURITY_HEADERS.items():
            if header in headers:
                result[name] = "Enabled"
            else:
                result[name] = "Missing"

        return result

    except Exception as e:
        return {
            "error": str(e)
        }