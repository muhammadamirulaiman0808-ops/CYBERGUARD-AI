import json

from app.core.url_guard import UnsafeTargetError
from app.routers import auth as auth_router
from app.routers import scan as scan_router
from app.services.scanner import ScanError


# ---------- register / login ----------
def test_register_and_login(client):
    r = client.post("/register", json={"username": "mir", "email": "Mir@Example.com", "password": "Strong1pass"})
    assert r.status_code == 201

    r = client.post("/login", json={"username": "mir", "password": "Strong1pass"})
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == "mir" and body["token"] and body["expires_in"] == 3600

    # login by email works too, and is case-insensitive
    r = client.post("/login", json={"username": "MIR@example.com", "password": "Strong1pass"})
    assert r.status_code == 200


def test_register_validation_messages(client):
    cases = [
        ({"username": "ab", "email": "a@b.co", "password": "Strong1pass"}, "at least 3"),
        ({"username": "has space", "email": "a@b.co", "password": "Strong1pass"}, "letters, numbers"),
        ({"username": "mir", "email": "not-an-email", "password": "Strong1pass"}, "valid email"),
        ({"username": "mir", "email": "a@b.co", "password": "short1A"}, "at least 8"),
        ({"username": "mir", "email": "a@b.co", "password": "alllowercase1"}, "uppercase"),
        ({"username": "mir", "email": "a@b.co", "password": "NOLOWERCASE1"}, "lowercase"),
        ({"username": "mir", "email": "a@b.co", "password": "NoNumbersHere"}, "number"),
    ]
    for payload, expected in cases:
        auth_router.register_limiter.reset()
        r = client.post("/register", json=payload)
        assert r.status_code == 422, payload
        assert isinstance(r.json()["detail"], str)
        assert expected in r.json()["detail"], (payload, r.json())


def test_duplicate_username_and_email(client):
    client.post("/register", json={"username": "mir", "email": "mir@example.com", "password": "Strong1pass"})
    r = client.post("/register", json={"username": "MIR", "email": "other@example.com", "password": "Strong1pass"})
    assert r.status_code == 409 and "username" in r.json()["detail"]
    r = client.post("/register", json={"username": "other", "email": "MIR@example.com", "password": "Strong1pass"})
    assert r.status_code == 409 and "email" in r.json()["detail"]


def test_login_errors_do_not_reveal_which_part_was_wrong(client):
    client.post("/register", json={"username": "mir", "email": "mir@example.com", "password": "Strong1pass"})
    wrong_pw = client.post("/login", json={"username": "mir", "password": "Wrong1pass"})
    no_user = client.post("/login", json={"username": "ghost", "password": "Strong1pass"})
    assert wrong_pw.status_code == no_user.status_code == 401
    assert wrong_pw.json()["detail"] == no_user.json()["detail"]


def test_login_rate_limit(client):
    for _ in range(10):
        client.post("/login", json={"username": "x", "password": "y"})
    r = client.post("/login", json={"username": "x", "password": "y"})
    assert r.status_code == 429 and "Retry-After" in r.headers


def test_password_not_stored_in_plain_text(client):
    from app.database import SessionLocal
    from app.models import User

    client.post("/register", json={"username": "mir", "email": "mir@example.com", "password": "Strong1pass"})
    with SessionLocal() as db:
        stored = db.query(User).first().password
    assert stored != "Strong1pass" and stored.startswith("$2")


# ---------- auth required ----------
def test_protected_routes_need_token(client):
    for method, path in [
        ("get", "/history"),
        ("get", "/history/stats"),
        ("delete", "/history"),
        ("get", "/profile"),
        ("get", "/full-scan?url=example.com"),
    ]:
        r = getattr(client, method)(path)
        assert r.status_code == 401, path


def test_garbage_and_expired_tokens_rejected(client, monkeypatch):
    r = client.get("/profile", headers={"Authorization": "Bearer not.a.token"})
    assert r.status_code == 401

    from app import config

    monkeypatch.setattr(config, "ACCESS_TOKEN_MINUTES", -5)
    client.post("/register", json={"username": "mir", "email": "mir@example.com", "password": "Strong1pass"})
    token = client.post("/login", json={"username": "mir", "password": "Strong1pass"}).json()["token"]
    r = client.get("/profile", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401 and "expired" in r.json()["detail"].lower()


# ---------- profile ----------
def test_profile_update_keeps_session_valid(client, register_and_login):
    headers = register_and_login()
    assert client.get("/profile", headers=headers).json() == {"username": "mir", "email": "mir@example.com"}

    r = client.put("/profile", headers=headers, json={"username": "mir2", "email": "new@example.com"})
    assert r.status_code == 200 and r.json()["username"] == "mir2"
    # token still works after renaming because it identifies the user by id
    assert client.get("/profile", headers=headers).json()["username"] == "mir2"


def test_profile_conflicts(client, register_and_login):
    register_and_login("other", "other@example.com")
    headers = register_and_login("mir", "mir@example.com")
    assert client.put("/profile", headers=headers, json={"username": "other", "email": "mir@example.com"}).status_code == 409
    assert client.put("/profile", headers=headers, json={"username": "mir", "email": "other@example.com"}).status_code == 409
    # keeping your own values is fine
    assert client.put("/profile", headers=headers, json={"username": "mir", "email": "mir@example.com"}).status_code == 200


def test_change_password(client, register_and_login):
    headers = register_and_login()
    r = client.put("/profile/password", headers=headers, json={"current_password": "Wrong1pass", "new_password": "Newpass123"})
    assert r.status_code == 400
    r = client.put("/profile/password", headers=headers, json={"current_password": "Strong1pass", "new_password": "weak"})
    assert r.status_code == 422
    r = client.put("/profile/password", headers=headers, json={"current_password": "Strong1pass", "new_password": "Newpass123"})
    assert r.status_code == 200
    assert client.post("/login", json={"username": "mir", "password": "Strong1pass"}).status_code == 401
    assert client.post("/login", json={"username": "mir", "password": "Newpass123"}).status_code == 200


# ---------- scan + history ----------
def fake_result(url, score=72, risk="Medium"):
    return {
        "website": url,
        "requested": url,
        "https": "Enabled",
        "ssl": {"status": "Valid", "days_left": 80, "expiry": "2027-01-01", "issuer": "Test CA", "error": None},
        "headers": {"HSTS": "Missing"},
        "security_score": score,
        "risk": risk,
        "findings": [],
        "analysis": [],
        "recommendations": [],
        "scanned_at": "2026-10-17T12:00:00+00:00",
    }


def test_scan_saves_to_history_and_returns_it(client, register_and_login, monkeypatch):
    monkeypatch.setattr(scan_router, "run_scan", lambda url: fake_result("https://example.com"))
    headers = register_and_login()

    r = client.get("/full-scan", params={"url": "example.com"}, headers=headers)
    assert r.status_code == 200
    scan_id = r.json()["id"]

    items = client.get("/history", headers=headers).json()
    assert [i["id"] for i in items] == [scan_id]
    assert "details" not in items[0]

    detail = client.get(f"/history/{scan_id}", headers=headers).json()
    assert detail["score"] == 72 and detail["result"]["website"] == "https://example.com"


def test_scan_errors_map_to_http_status(client, register_and_login, monkeypatch):
    headers = register_and_login()

    def unsafe(url):
        raise UnsafeTargetError("private address")

    def unreachable(url):
        raise ScanError("Could not reach the website.")

    monkeypatch.setattr(scan_router, "run_scan", unsafe)
    r = client.get("/full-scan", params={"url": "10.0.0.1"}, headers=headers)
    assert r.status_code == 400 and r.json()["detail"] == "private address"

    monkeypatch.setattr(scan_router, "run_scan", unreachable)
    assert client.get("/full-scan", params={"url": "down.example"}, headers=headers).status_code == 502
    # failed scans are not saved
    assert client.get("/history", headers=headers).json() == []


def test_scan_rate_limit(client, register_and_login, monkeypatch):
    monkeypatch.setattr(scan_router, "run_scan", lambda url: fake_result(url))
    headers = register_and_login()
    codes = [client.get("/full-scan", params={"url": "example.com"}, headers=headers).status_code for _ in range(11)]
    assert codes[:10] == [200] * 10 and codes[10] == 429


def test_history_order_stats_and_delete(client, register_and_login, monkeypatch):
    headers = register_and_login()
    scores = iter([90, 60, 20])
    risks = {90: "Low", 60: "Medium", 20: "High"}

    def fake(url):
        s = next(scores)
        return fake_result(f"https://site{s}.com", s, risks[s])

    monkeypatch.setattr(scan_router, "run_scan", fake)
    ids = [client.get("/full-scan", params={"url": "x"}, headers=headers).json()["id"] for _ in range(3)]

    listed = [i["id"] for i in client.get("/history", headers=headers).json()]
    assert listed == ids[::-1]  # newest first
    assert len(client.get("/history?limit=2", headers=headers).json()) == 2

    assert client.get("/history/stats", headers=headers).json() == {
        "total": 3, "average": 57, "low": 1, "medium": 1, "high": 1
    }

    assert client.delete(f"/history/{ids[0]}", headers=headers).status_code == 200
    assert client.delete(f"/history/{ids[0]}", headers=headers).status_code == 404
    assert client.get(f"/history/{ids[0]}", headers=headers).status_code == 404

    r = client.delete("/history", headers=headers)
    assert r.status_code == 200 and "2" in r.json()["message"]
    assert client.get("/history/stats", headers=headers).json()["total"] == 0


def test_users_cannot_see_each_others_history(client, register_and_login, monkeypatch):
    monkeypatch.setattr(scan_router, "run_scan", lambda url: fake_result("https://private.example"))
    alice = register_and_login("alice", "alice@example.com")
    bob = register_and_login("bob", "bob@example.com")

    scan_id = client.get("/full-scan", params={"url": "x"}, headers=alice).json()["id"]

    assert client.get("/history", headers=bob).json() == []
    assert client.get(f"/history/{scan_id}", headers=bob).status_code == 404
    assert client.delete(f"/history/{scan_id}", headers=bob).status_code == 404
    assert client.delete("/history", headers=bob).json()["message"].startswith("0")
    assert len(client.get("/history", headers=alice).json()) == 1


def test_old_record_without_details(client, register_and_login):
    from app.database import SessionLocal
    from app.models import ScanHistory, User

    headers = register_and_login()
    with SessionLocal() as db:
        user = db.query(User).first()
        old = ScanHistory(website="http://old.example", score=40, risk="High", date="01/01/2026 10:00", details=None, user_id=user.id)
        bad = ScanHistory(website="http://bad.example", score=40, risk="High", date="01/01/2026 10:00", details="{not json", user_id=user.id)
        db.add_all([old, bad])
        db.commit()
        ids = [old.id, bad.id]

    for scan_id in ids:
        r = client.get(f"/history/{scan_id}", headers=headers)
        assert r.status_code == 200 and r.json()["result"] is None


# ---------- feedback ----------
def test_feedback_guest_and_user(client, register_and_login):
    from app.database import SessionLocal
    from app.models import Feedback

    assert client.post("/feedback", json={"rating": 5, "comment": "Great"}).status_code == 200
    headers = register_and_login()
    # a name in the body is ignored; the token decides
    r = client.post("/feedback", headers=headers, json={"rating": 4, "username": "someone-else"})
    assert r.status_code == 200

    with SessionLocal() as db:
        rows = db.query(Feedback).order_by(Feedback.id).all()
    assert [(f.username, f.rating) for f in rows] == [(None, 5), ("mir", 4)]


def test_feedback_validation(client):
    assert client.post("/feedback", json={"rating": 0}).status_code == 422
    assert client.post("/feedback", json={"rating": 6}).status_code == 422
    assert client.post("/feedback", json={"rating": 3, "comment": "x" * 1001}).status_code == 422


# ---------- misc ----------
def test_health_and_headers(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json() == {"status": "ok"}
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"


def test_cors_allows_only_configured_origins(client):
    ok = client.options(
        "/login",
        headers={"Origin": "http://localhost:5173", "Access-Control-Request-Method": "POST"},
    )
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:5173"
    bad = client.options(
        "/login",
        headers={"Origin": "https://evil.example", "Access-Control-Request-Method": "POST"},
    )
    assert "access-control-allow-origin" not in bad.headers


def test_scanner_end_to_end_with_stubbed_network(monkeypatch):
    """run_scan wiring: fetch -> checks -> score -> analysis, without touching the network."""
    from app.services import scanner
    from app.core.url_guard import Target

    def fake_parse(raw):
        url = raw if "://" in raw else f"https://{raw}"
        return Target(url=url, scheme="https", hostname="example.com", port=443, explicit_scheme="://" in raw, ips=["93.184.216.34"])

    monkeypatch.setattr(scanner.url_guard, "parse_target", fake_parse)
    monkeypatch.setattr(
        scanner,
        "_fetch",
        lambda url, deadline, verify=True: scanner.FetchResult(
            final_url="https://example.com/",
            status_code=200,
            headers={"Server": "nginx/1.18.0", "X-Content-Type-Options": "nosniff"},
            elapsed_ms=120,
        ),
    )
    monkeypatch.setattr(
        scanner,
        "check_ssl",
        lambda host, port=443, ips=None, timeout=6: {
            "status": "Valid", "expiry": "2027-01-01", "days_left": 80, "issuer": "Test CA", "protocol": "TLSv1.3", "error": None,
        },
    )

    result = scanner.run_scan("example.com")
    assert result["website"] == "https://example.com"
    assert result["https"] == "Enabled"
    assert result["headers"]["MIME"] == "Enabled" and result["headers"]["CSP"] == "Missing"
    assert result["exposed"] == ["Server: nginx/1.18.0"]
    assert result["security_score"] == 25 + 25 + 6 == 56
    assert result["risk"] == "Medium"
    assert result["findings"][0]["severity"] in {"high", "medium"}
    json.dumps(result)  # must be serialisable for storage
