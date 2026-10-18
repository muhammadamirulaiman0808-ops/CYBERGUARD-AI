from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import config, crud
from app.core.rate_limit import RateLimiter, limit_by_ip
from app.core.security import DUMMY_HASH, create_access_token, hash_password, verify_password
from app.database import get_db
from app.schemas import Message, TokenOut, UserCreate, UserLogin

router = APIRouter(tags=["auth"])

register_limiter = RateLimiter(max_calls=5, window_seconds=60)
login_limiter = RateLimiter(max_calls=10, window_seconds=60)


@router.post(
    "/register",
    response_model=Message,
    status_code=201,
    dependencies=[Depends(limit_by_ip(register_limiter))],
)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_username(db, data.username):
        raise HTTPException(status_code=409, detail="That username is already taken.")
    if crud.get_user_by_email(db, data.email):
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    try:
        crud.create_user(db, data.username, data.email, hash_password(data.password))
    except IntegrityError:  # two sign-ups racing for the same name
        db.rollback()
        raise HTTPException(status_code=409, detail="That username or email is already in use.")

    return {"message": "Account created. You can log in now."}


@router.post(
    "/login",
    response_model=TokenOut,
    dependencies=[Depends(limit_by_ip(login_limiter))],
)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = crud.get_user_by_login(db, data.username)

    # Always run one bcrypt check so a missing user takes as long as a wrong password.
    password_ok = verify_password(data.password, user.password if user else DUMMY_HASH)
    if user is None or not password_ok:
        raise HTTPException(status_code=401, detail="Wrong username or password.")

    return {
        "message": "Login successful",
        "token": create_access_token(user),
        "username": user.username,
        "expires_in": config.ACCESS_TOKEN_MINUTES * 60,
    }
