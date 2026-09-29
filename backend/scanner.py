import requests


def check_https(url):
    """
    Tries the URL as-is first. If it uses http:// and the site
    doesn't actually support https, this avoids false SSL failures.
    Returns "Enabled" or "Not Secure".
    """
    try:
        if url.startswith("https://"):
            response = requests.get(url, timeout=8, allow_redirects=True)
            # If https redirected down to http, it's not really enforced
            return "Enabled" if response.url.startswith("https://") else "Not Secure"

        elif url.startswith("http://"):
            response = requests.get(url, timeout=8, allow_redirects=True)
            return "Enabled" if response.url.startswith("https://") else "Not Secure"

        return "Not Secure"

    except Exception:
        return "Not Secure"


def resolve_working_url(raw_input):
    """
    Given raw user input (with or without protocol), figure out
    which URL actually works: try https first, fall back to http.
    Returns the resolved URL string.
    """
    candidate = raw_input

    if not candidate.startswith("http://") and not candidate.startswith("https://"):
        candidate = "https://" + raw_input

    try:
        requests.get(candidate, timeout=6)
        return candidate
    except Exception:
        pass

    # https failed — try http instead
    if candidate.startswith("https://"):
        fallback = "http://" + raw_input.replace("https://", "").replace("http://", "")
        try:
            requests.get(fallback, timeout=6)
            return fallback
        except Exception:
            pass

    return candidate