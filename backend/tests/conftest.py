import os
import sys
from pathlib import Path

# These must be set before the app is imported, because config.py reads them on import.
TEST_DB = Path(__file__).parent / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-the-check-0123456789"
os.environ["APP_ENV"] = "development"
os.environ["ALLOW_PRIVATE_TARGETS"] = "false"

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import Base, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.routers import auth, feedback, scan  # noqa: E402


@pytest.fixture(autouse=True)
def fresh_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    for limiter in (auth.register_limiter, auth.login_limiter, scan.scan_limiter, feedback.feedback_limiter):
        limiter.reset()
    yield


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    if TEST_DB.exists():
        TEST_DB.unlink()


@pytest.fixture()
def register_and_login(client):
    def _go(username="mir", email="mir@example.com", password="Strong1pass"):
        r = client.post("/register", json={"username": username, "email": email, "password": password})
        assert r.status_code == 201, r.text
        r = client.post("/login", json={"username": username, "password": password})
        assert r.status_code == 200, r.text
        return {"Authorization": f"Bearer {r.json()['token']}"}

    return _go
