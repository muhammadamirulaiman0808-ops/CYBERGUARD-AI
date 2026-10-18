"""Database access. Every function that touches scan history takes the user object,
so a query can never return another user's rows."""

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.clock import now_str
from app.models import Feedback, ScanHistory, User


# --- Users ----------------------------------------------------------------
def get_user_by_id(db: Session, user_id: int):
    return db.get(User, user_id)


def get_user_by_username(db: Session, username: str):
    return db.scalar(select(User).where(func.lower(User.username) == username.strip().lower()))


def get_user_by_email(db: Session, email: str):
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def get_user_by_login(db: Session, identifier: str):
    """Look a user up by username, or by email when the identifier contains '@'."""
    identifier = identifier.strip()
    if "@" in identifier:
        return get_user_by_email(db, identifier)
    return get_user_by_username(db, identifier)


def create_user(db: Session, username: str, email: str, hashed_password: str) -> User:
    user = User(username=username, email=email, password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user_profile(db: Session, user: User, username: str, email: str) -> User:
    user.username = username
    user.email = email
    db.commit()
    db.refresh(user)
    return user


def update_user_password(db: Session, user: User, hashed_password: str) -> None:
    user.password = hashed_password
    db.commit()


# --- Scan history ---------------------------------------------------------
def save_scan(db: Session, user: User, website: str, score: int, risk: str, details: str) -> ScanHistory:
    scan = ScanHistory(
        website=website,
        score=score,
        risk=risk,
        date=now_str(),
        details=details,
        user_id=user.id,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def list_scans(db: Session, user: User, limit: int = 100, offset: int = 0):
    query = (
        select(ScanHistory)
        .where(ScanHistory.user_id == user.id)
        .order_by(ScanHistory.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(query))


def get_scan(db: Session, user: User, scan_id: int):
    return db.scalar(
        select(ScanHistory).where(ScanHistory.id == scan_id, ScanHistory.user_id == user.id)
    )


def scan_stats(db: Session, user: User) -> dict:
    owned = ScanHistory.user_id == user.id
    total = db.scalar(select(func.count(ScanHistory.id)).where(owned)) or 0
    average = db.scalar(select(func.avg(ScanHistory.score)).where(owned)) or 0
    rows = db.execute(
        select(ScanHistory.risk, func.count(ScanHistory.id)).where(owned).group_by(ScanHistory.risk)
    ).all()
    by_risk = {(risk or "").lower(): count for risk, count in rows}
    return {
        "total": int(total),
        "average": int(round(float(average))),
        "low": int(by_risk.get("low", 0)),
        "medium": int(by_risk.get("medium", 0)),
        "high": int(by_risk.get("high", 0)),
    }


def delete_scan(db: Session, user: User, scan_id: int) -> bool:
    scan = get_scan(db, user, scan_id)
    if scan is None:
        return False
    db.delete(scan)
    db.commit()
    return True


def delete_all_scans(db: Session, user: User) -> int:
    result = db.execute(delete(ScanHistory).where(ScanHistory.user_id == user.id))
    db.commit()
    return result.rowcount or 0


# --- Feedback -------------------------------------------------------------
def create_feedback(db: Session, username, rating: int, comment) -> Feedback:
    feedback = Feedback(username=username, rating=rating, comment=comment, date=now_str())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
