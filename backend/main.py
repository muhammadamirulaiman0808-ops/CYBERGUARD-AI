from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

import json
import re

from scanner import check_https, resolve_working_url
from ssl_checker import check_ssl
from header_checker import check_headers
from score import calculate_score

from urllib.parse import urlparse
from ai_engine import generate_ai_report

from database import Base, engine
import models
from database import SessionLocal

from crud import save_scan, get_history, delete_history_item, delete_all_history, save_feedback, update_user_profile, update_user_password

from datetime import datetime

from pydantic import BaseModel
from typing import Optional
from auth import hash_password
from crud import create_user

from auth import verify_password
from jwt_handler import create_token
from crud import get_user_by_username

from security import get_current_user
from analysis import generate_analysis

app = FastAPI(
    title="CyberGuard AI"
)

Base.metadata.create_all(
    bind=engine
)

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]

)

class UserCreate(BaseModel):

    username: str

    email: str

    password: str

class UserLogin(BaseModel):

    username: str

    password: str


class FeedbackCreate(BaseModel):

    username: Optional[str] = None

    rating: int

    comment: Optional[str] = None


class ProfileUpdate(BaseModel):

    username: str

    email: str


class PasswordChange(BaseModel):

    current_password: str

    new_password: str

Base.metadata.create_all(

    bind=engine

)

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

)


@app.get("/")
def home():

    return {
        "message":"CyberGuard AI Running"
    }


@app.get("/full-scan")
def full_scan(
    url: str,
    username: str = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        # Resolve the actual working URL first.
        # Tries https:// as given/prefixed, falls back to http://
        # if the site doesn't actually support https.
        # This avoids false "SSL Invalid" / header failures on
        # http-only sites like httpforever.com.
        resolved_url = resolve_working_url(url)

        https = check_https(resolved_url)

        domain = urlparse(resolved_url).hostname

        ssl = check_ssl(domain)

        headers = check_headers(resolved_url)

        score = calculate_score(

            https,

            ssl["status"],

            headers

        )

        ai = generate_analysis({

            "https": https,

            "ssl": ssl,

            "headers": headers

        })

        risk = (

            "Low"

            if score >= 80

            else "Medium"

            if score >= 50

            else "High"

        )

        full_result = {

            "website": resolved_url,

            "https": https,

            "ssl": ssl,

            "headers": headers,

            "security_score": score,

            "analysis": ai["analysis"],

            "recommendations": ai["recommendations"]

        }


        save_scan(

            db,

            resolved_url,

            score,

            risk,

            datetime.now().strftime("%d/%m/%Y %H:%M"),

            username,

            json.dumps(full_result)

        )

        return full_result

    finally:

        db.close()

@app.get("/history")
def history(
    username: str = Depends(get_current_user)
):

    db = SessionLocal()


    records = get_history(

        db,

        username

    )


    db.close()


    return records


@app.delete("/history/{scan_id}")
def delete_one_history(
    scan_id: int,
    username: str = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        deleted = delete_history_item(

            db,

            scan_id,

            username

        )

        if not deleted:

            return {
                "error": "Scan not found"
            }

        return {
            "message": "Scan deleted successfully"
        }

    finally:

        db.close()


@app.delete("/history")
def delete_all_history_route(
    username: str = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        count = delete_all_history(

            db,

            username

        )

        return {
            "message": f"{count} scan(s) deleted successfully"
        }

    finally:

        db.close()


@app.post("/register")
def register(
    user: UserCreate
):

    # USERNAME validation
    if len(user.username.strip()) < 3:

        return {
            "error": "Username mesti sekurang-kurangnya 3 aksara"
        }

    if re.search(r"\s", user.username):

        return {
            "error": "Username tidak boleh ada ruang kosong"
        }


    # EMAIL validation — standard format only, no domain restriction
    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    if not re.match(email_regex, user.email):

        return {
            "error": "Format email tidak sah"
        }


    # PASSWORD validation
    if len(user.password) < 8:

        return {
            "error": "Password mesti sekurang-kurangnya 8 aksara"
        }

    if not re.search(r"[A-Z]", user.password):

        return {
            "error": "Password mesti ada huruf besar"
        }

    if not re.search(r"[a-z]", user.password):

        return {
            "error": "Password mesti ada huruf kecil"
        }

    if not re.search(r"[0-9]", user.password):

        return {
            "error": "Password mesti ada nombor"
        }


    db = SessionLocal()


    # Prevent duplicate username registration
    existing = get_user_by_username(
        db,
        user.username
    )

    if existing:

        db.close()

        return {
            "error": "Username sudah digunakan"
        }


    hashed = hash_password(
        user.password
    )


    new_user = create_user(

        db,

        user.username,

        user.email,

        hashed

    )


    db.close()


    return {

        "message":"User created successfully",

        "username":new_user.username

    }

@app.post("/login")
def login(
    user: UserLogin
):

    db = SessionLocal()


    existing_user = get_user_by_username(

        db,

        user.username

    )


    if not existing_user:

        db.close()

        return {

            "error":"User not found"

        }



    password_match = verify_password(

        user.password,

        existing_user.password

    )


    if not password_match:

        db.close()

        return {

            "error":"Wrong password"

        }



    token = create_token(

        {

            "username": existing_user.username

        }

    )


    db.close()


    return {

        "message":"Login successful",

        "token":token

    }

@app.get("/profile")
def profile(
    username: str = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        user = get_user_by_username(
            db,
            username
        )

        if not user:

            return {
                "error": "User not found"
            }

        return {

            "username": user.username,

            "email": user.email

        }

    finally:

        db.close()


@app.put("/profile")
def update_profile(
    data: ProfileUpdate,
    username: str = Depends(get_current_user)
):

    if len(data.username.strip()) < 3:

        return {
            "error": "Username must be at least 3 characters"
        }

    if re.search(r"\s", data.username):

        return {
            "error": "Username cannot contain spaces"
        }

    email_regex = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"

    if not re.match(email_regex, data.email):

        return {
            "error": "Invalid email format"
        }


    db = SessionLocal()

    try:

        # If username is changing, make sure the new one isn't taken
        if data.username != username:

            existing = get_user_by_username(
                db,
                data.username
            )

            if existing:

                return {
                    "error": "Username already taken"
                }


        updated = update_user_profile(

            db,

            username,

            data.username,

            data.email

        )

        if not updated:

            return {
                "error": "User not found"
            }


        return {

            "message": "Profile updated successfully",

            "username": updated.username,

            "email": updated.email,

            "username_changed": data.username != username

        }

    finally:

        db.close()


@app.put("/profile/password")
def change_password(
    data: PasswordChange,
    username: str = Depends(get_current_user)
):

    db = SessionLocal()

    try:

        user = get_user_by_username(
            db,
            username
        )

        if not user:

            return {
                "error": "User not found"
            }


        if not verify_password(
            data.current_password,
            user.password
        ):

            return {
                "error": "Current password is incorrect"
            }


        if len(data.new_password) < 8:

            return {
                "error": "Password must be at least 8 characters"
            }

        if not re.search(r"[A-Z]", data.new_password):

            return {
                "error": "Password must contain an uppercase letter"
            }

        if not re.search(r"[a-z]", data.new_password):

            return {
                "error": "Password must contain a lowercase letter"
            }

        if not re.search(r"[0-9]", data.new_password):

            return {
                "error": "Password must contain a number"
            }


        hashed = hash_password(data.new_password)

        update_user_password(
            db,
            username,
            hashed
        )


        return {
            "message": "Password changed successfully"
        }

    finally:

        db.close()


@app.post("/feedback")
def submit_feedback(
    feedback: FeedbackCreate
):

    if feedback.rating < 1 or feedback.rating > 5:

        return {
            "error": "Rating must be between 1 and 5"
        }

    db = SessionLocal()

    try:

        save_feedback(

            db,

            feedback.username,

            feedback.rating,

            feedback.comment,

            datetime.now().strftime("%d/%m/%Y %H:%M")

        )

        return {
            "message": "Thank you for your feedback!"
        }

    finally:

        db.close()