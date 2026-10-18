import socket

import pytest

from app.core import url_guard
from app.core.url_guard import UnsafeTargetError, is_public_ip, parse_target
from app.services.analysis import generate_analysis
from app.services.header_checker import HEADER_SPECS, check_headers, find_exposed_tech
from app.services.score import risk_level, score_scan


# ---------- url_guard ----------
def fake_dns(monkeypatch, ip):
    def fake(host, port, type=0, **kwargs):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, port))]

    monkeypatch.setattr(url_guard.socket, "getaddrinfo", fake)


@pytest.mark.parametrize(
    "ip,public",
    [
        ("93.184.216.34", True),
        ("8.8.8.8", True),
        ("127.0.0.1", False),
        ("10.0.0.5", False),
        ("192.168.1.1", False),
        ("172.16.0.1", False),
        ("169.254.169.254", False),
        ("100.64.0.1", False),
        ("0.0.0.0", False),
        ("::1", False),
        ("::ffff:127.0.0.1", False),
        ("fe80::1", False),
    ],
)
def test_is_public_ip(ip, public):
    assert is_public_ip(ip) is public


def test_adds_https_and_resolves(monkeypatch):
    fake_dns(monkeypatch, "93.184.216.34")
    target = parse_target("Example.com/path?q=1")
    assert target.url == "https://example.com/path?q=1"
    assert target.scheme == "https" and target.port == 443
    assert target.explicit_scheme is False
    assert target.ips == ["93.184.216.34"]


def test_explicit_http_kept(monkeypatch):
    fake_dns(monkeypatch, "93.184.216.34")
    target = parse_target("http://example.com")
    assert target.scheme == "http" and target.port == 80 and target.explicit_scheme


@pytest.mark.parametrize("ip", ["127.0.0.1", "10.1.2.3", "169.254.169.254", "192.168.0.10"])
def test_blocks_private_resolution(monkeypatch, ip):
    fake_dns(monkeypatch, ip)
    with pytest.raises(UnsafeTargetError):
        parse_target("internal.example.com")


@pytest.mark.parametrize(
    "bad",
    ["", "   ", "ftp://example.com", "file:///etc/passwd", "http://user:pw@example.com", "example.com:22", "http://"],
)
def test_rejects_bad_input(monkeypatch, bad):
    fake_dns(monkeypatch, "93.184.216.34")
    with pytest.raises(UnsafeTargetError):
        parse_target(bad)


def test_unresolvable_host(monkeypatch):
    def boom(*args, **kwargs):
        raise socket.gaierror("nope")

    monkeypatch.setattr(url_guard.socket, "getaddrinfo", boom)
    with pytest.raises(UnsafeTargetError):
        parse_target("does-not-exist.invalid")


# ---------- headers ----------
FULL = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=()",
}


def test_all_headers_present():
    result = check_headers(FULL, is_https=True)
    assert set(result) == set(HEADER_SPECS)
    assert all(v == "Enabled" for v in result.values())


def test_headers_case_insensitive_and_missing():
    result = check_headers({"x-content-type-options": "nosniff"}, is_https=True)
    assert result["MIME"] == "Enabled"
    assert result["HSTS"] == "Missing" and result["CSP"] == "Missing"


def test_hsts_ignored_over_http_and_when_zero():
    assert check_headers(FULL, is_https=False)["HSTS"] == "Missing"
    assert check_headers({"Strict-Transport-Security": "max-age=0"}, is_https=True)["HSTS"] == "Missing"


def test_clickjacking_via_csp_frame_ancestors():
    result = check_headers({"Content-Security-Policy": "frame-ancestors 'self'"}, is_https=True)
    assert result["Clickjacking"] == "Enabled"


def test_nosniff_value_matters():
    assert check_headers({"X-Content-Type-Options": "wrong"}, is_https=True)["MIME"] == "Missing"


def test_exposed_tech():
    assert find_exposed_tech({"Server": "nginx"}) == []
    assert find_exposed_tech({"Server": "nginx/1.18.0"}) == ["Server: nginx/1.18.0"]
    assert find_exposed_tech({"X-Powered-By": "PHP/8.1"}) == ["X-Powered-By: PHP/8.1"]


# ---------- score ----------
GOOD_SSL = {"status": "Valid", "days_left": 90, "expiry": "2027-01-01", "issuer": "Test CA", "error": None}


def all_headers(value):
    return {key: value for key in HEADER_SPECS}


def test_weights_add_up_to_100():
    assert score_scan("Enabled", GOOD_SSL, all_headers("Enabled"))["score"] == 100


def test_zero_score():
    bad = {"status": "Unavailable", "days_left": None}
    assert score_scan("Not Secure", bad, all_headers("Missing"))["score"] == 0


def test_expiring_certificate_loses_points():
    soon = {**GOOD_SSL, "days_left": 5}
    assert score_scan("Enabled", soon, all_headers("Enabled"))["score"] == 90


def test_breakdown_sums_to_score():
    result = score_scan("Enabled", GOOD_SSL, {**all_headers("Missing"), "HSTS": "Enabled"})
    assert sum(item["points"] for item in result["breakdown"]) == result["score"] == 62


@pytest.mark.parametrize("score,risk", [(100, "Low"), (80, "Low"), (79, "Medium"), (50, "Medium"), (49, "High"), (0, "High")])
def test_risk_level(score, risk):
    assert risk_level(score) == risk


# ---------- analysis ----------
def make_result(https="Enabled", ssl=None, headers=None, exposed=None, risk="Low"):
    return {
        "https": https,
        "ssl": ssl or GOOD_SSL,
        "headers": headers or all_headers("Enabled"),
        "exposed": exposed or [],
        "risk": risk,
    }


def test_clean_site_has_only_passes():
    out = generate_analysis(make_result())
    assert {f["severity"] for f in out["findings"]} == {"pass"}
    assert out["recommendations"] == []


def test_worst_site_is_sorted_high_first_with_fixes():
    out = generate_analysis(
        make_result(
            https="Not Secure",
            ssl={"status": "Unavailable", "error": "Connection refused", "days_left": None},
            headers=all_headers("Missing"),
            exposed=["Server: nginx/1.18.0"],
            risk="High",
        )
    )
    severities = [f["severity"] for f in out["findings"]]
    assert severities == sorted(severities, key=["high", "medium", "low", "info", "pass"].index)
    assert severities[0] == "high"
    assert "pass" not in severities
    assert len(out["recommendations"]) == len(set(out["recommendations"])) >= 8
    assert len(out["analysis"]) == len(out["findings"])
    assert "serious" in out["summary"]


def test_invalid_certificate_message_is_shown():
    out = generate_analysis(make_result(ssl={"status": "Invalid", "error": "certificate has expired", "days_left": None}))
    ssl_finding = next(f for f in out["findings"] if "SSL" in f["title"])
    assert ssl_finding["severity"] == "high" and "expired" in ssl_finding["detail"]
