"""Password hashing, JWT creation/verification and the auth dependencies."""
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from . import config
from .database import get_db
from .models import User

bearer = HTTPBearer(auto_error=False)


# --- passwords --------------------------------------------------------------
# bcrypt only looks at the first 72 bytes, so the schemas reject anything longer
# instead of silently truncating it.
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8")[:72], hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# Used to keep login timing similar whether or not the username exists.
DUMMY_HASH = hash_password("not-a-real-password")


# --- tokens -----------------------------------------------------------------
def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),  # the user id, so changing a username never breaks a session
        "iat": now,
        "exp": now + timedelta(minutes=config.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, config.SECRET_KEY, algorithm=config.JWT_ALGORITHM)


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _user_from_token(token: str, db: Session) -> User:
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Your session has expired. Please sign in again.")
    except jwt.PyJWTError:
        raise _unauthorized("Invalid session. Please sign in again.")

    try:
        user_id = int(payload.get("sub", ""))
    except (TypeError, ValueError):
        raise _unauthorized("Invalid session. Please sign in again.")

    user = db.get(User, user_id)
    if user is None:
        raise _unauthorized("This account no longer exists.")
    return user


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _unauthorized("Please sign in to continue.")
    return _user_from_token(credentials.credentials, db)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """For endpoints that work for guests too (feedback)."""
    if credentials is None:
        return None
    try:
        return _user_from_token(credentials.credentials, db)
    except HTTPException:
        return None
