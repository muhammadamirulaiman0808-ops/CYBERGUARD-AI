import requests


def check_https(url):
    try:
        response = requests.get(url, timeout=5)

        if response.url.startswith("https://"):
            return "Enabled"

        return "Disabled"

    except Exception:
        return "Error"