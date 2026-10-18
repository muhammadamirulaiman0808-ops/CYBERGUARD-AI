from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud
from app.core.security import get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import Message, PasswordChange, ProfileOut, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=ProfileOut)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("", response_model=ProfileOut)
def update_profile(
    data: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    other = crud.get_user_by_username(db, data.username)
    if other and other.id != user.id:
        raise HTTPException(status_code=409, detail="That username is already taken.")

    other = crud.get_user_by_email(db, data.email)
    if other and other.id != user.id:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    try:
        return crud.update_user_profile(db, user, data.username, data.email)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="That username or email is already in use.")


@router.put("/password", response_model=Message)
def change_password(
    data: PasswordChange,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, user.password):
        raise HTTPException(status_code=400, detail="Your current password is incorrect.")

    crud.update_user_password(db, user, hash_password(data.new_password))
    return {"message": "Password changed."}
