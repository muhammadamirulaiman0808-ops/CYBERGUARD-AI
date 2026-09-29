import requests

SECURITY_HEADERS = {
    "Strict-Transport-Security": "HSTS",
    "Content-Security-Policy": "CSP",
    "X-Frame-Options": "Clickjacking",
    "X-Content-Type-Options": "MIME"
}


def check_headers(url):
    try:
        response = requests.get(
            url,
            timeout=8,
            allow_redirects=True,
            headers={"User-Agent": "CyberGuardAI/1.0"}
        )

        headers = response.headers

        result = {}

        for header, name in SECURITY_HEADERS.items():
            if header in headers:
                result[name] = "Enabled"
            else:
                result[name] = "Missing"

        return result

    except requests.exceptions.SSLError:
        # Site can't complete an HTTPS handshake at all.
        # Still report all headers as Missing instead of erroring out,
        # so the score/analysis pipeline can proceed normally.
        return {name: "Missing" for name in SECURITY_HEADERS.values()}

    except Exception:
        return {name: "Missing" for name in SECURITY_HEADERS.values()}