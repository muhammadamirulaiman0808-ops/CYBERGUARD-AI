"""Application settings, read once from environment variables (.env in development)."""

import os

from dotenv import load_dotenv

load_dotenv()


def _flag(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_PRODUCTION = APP_ENV == "production"

# --- Database -------------------------------------------------------------
DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
if DATABASE_URL.startswith("postgres://"):
    # SQLAlchemy 2.x only understands the "postgresql://" scheme.
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env and fill it in."
    )

# --- JWT ------------------------------------------------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "").strip()
if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "SECRET_KEY must be set and at least 32 characters long. Generate one with:\n"
        '  python -c "import secrets; print(secrets.token_urlsafe(48))"'
    )
if IS_PRODUCTION and "change_this" in SECRET_KEY.lower():
    raise RuntimeError("SECRET_KEY still contains the placeholder text. Generate a new random key.")

ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "60"))

# --- CORS -----------------------------------------------------------------
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_URL", "http://localhost:5173").split(",")
    if origin.strip()
]
if not IS_PRODUCTION:
    for dev_origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
        if dev_origin not in CORS_ORIGINS:
            CORS_ORIGINS.append(dev_origin)

# Optional regex for Vercel preview deployments, e.g. https://cyberguard-.*\.vercel\.app
CORS_ORIGIN_REGEX = os.getenv("FRONTEND_ORIGIN_REGEX", "").strip() or None

# --- Scanner --------------------------------------------------------------
# Lets the scanner reach localhost / private IPs. Ignored in production.
ALLOW_PRIVATE_TARGETS = _flag("ALLOW_PRIVATE_TARGETS") and not IS_PRODUCTION
SCAN_TIMEOUT_SECONDS = int(os.getenv("SCAN_TIMEOUT_SECONDS", "25"))
