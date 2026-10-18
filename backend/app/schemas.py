import re
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

USERNAME_RE = re.compile(r"^[A-Za-z0-9_.-]+$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def check_username(value: str) -> str:
    value = value.strip()
    if len(value) < 3:
        raise ValueError("Username must be at least 3 characters")
    if len(value) > 30:
        raise ValueError("Username must be 30 characters or fewer")
    if not USERNAME_RE.match(value):
        raise ValueError("Username can only contain letters, numbers, dots, dashes and underscores")
    return value


def check_email(value: str) -> str:
    value = value.strip().lower()
    if not EMAIL_RE.match(value):
        raise ValueError("Enter a valid email address")
    return value


def check_password(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain an uppercase letter")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain a lowercase letter")
    if not re.search(r"[0-9]", value):
        raise ValueError("Password must contain a number")
    return value


# --- Auth -----------------------------------------------------------------
class UserCreate(BaseModel):
    username: str = Field(max_length=64)
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)

    _username = field_validator("username")(check_username)
    _email = field_validator("email")(check_email)
    _password = field_validator("password")(check_password)


class UserLogin(BaseModel):
    # Accepts either the username or the email address.
    username: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)


class TokenOut(BaseModel):
    message: str
    token: str
    username: str
    expires_in: int


# --- Profile --------------------------------------------------------------
class ProfileUpdate(BaseModel):
    username: str = Field(max_length=64)
    email: str = Field(max_length=254)

    _username = field_validator("username")(check_username)
    _email = field_validator("email")(check_email)


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(max_length=128)

    _new_password = field_validator("new_password")(check_password)


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    email: str


# --- History --------------------------------------------------------------
class HistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    website: str
    score: int
    risk: str
    date: str


class ScanDetail(HistoryItem):
    # The stored scan result, parsed from JSON. None for very old records.
    result: Optional[Dict[str, Any]] = None


class HistoryStats(BaseModel):
    total: int
    average: int
    low: int
    medium: int
    high: int


# --- Feedback / generic ---------------------------------------------------
class FeedbackCreate(BaseModel):
    rating: int
    comment: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("rating")
    @classmethod
    def _rating(cls, value: int) -> int:
        if value < 1 or value > 5:
            raise ValueError("Rating must be between 1 and 5")
        return value


class Message(BaseModel):
    message: str
