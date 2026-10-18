"""Password hashing, JWT creation and the current-user dependencies."""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError
from sqlalchemy.orm import Session

from app import config, crud
from app.database import get_db
from app.models import User

ALGORITHM = "HS256"
bearer_scheme = HTTPBearer(auto_error=False)


# --- Passwords ------------------------------------------------------------
def _prepare(password: str) -> bytes:
    # bcrypt only uses the first 72 bytes; truncate explicitly so behaviour is the same
    # for hashing and checking (and matches hashes created by the first version).
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepare(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain_password), hashed_password.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# Checked when the user does not exist, so a login attempt takes the same time either way.
DUMMY_HASH = hash_password("not-a-real-password-for-timing")


# --- Tokens ---------------------------------------------------------------
def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),  # the id never changes, so renaming a user keeps the session valid
        "username": user.username,
        "iat": now,
        "exp": now + timedelta(minutes=config.ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm=ALGORITHM)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(status_code=401, detail=detail, headers={"WWW-Authenticate": "Bearer"})


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _unauthorized("Not authenticated")

    try:
        payload = jwt.decode(credentials.credentials, config.SECRET_KEY, algorithms=[ALGORITHM])
    except ExpiredSignatureError:
        raise _unauthorized("Session expired. Please log in again.")
    except JWTError:
        raise _unauthorized("Invalid token")

    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise _unauthorized("Invalid token")

    user = crud.get_user_by_id(db, user_id)
    if user is None:
        raise _unauthorized("Invalid token")
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """For endpoints that work for guests but attach the user when a valid token is sent."""
    if credentials is None:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
