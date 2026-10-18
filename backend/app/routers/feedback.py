from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud
from app.core.rate_limit import RateLimiter, limit_by_ip
from app.core.security import get_optional_user
from app.database import get_db
from app.models import User
from app.schemas import FeedbackCreate, Message

router = APIRouter(tags=["feedback"])

feedback_limiter = RateLimiter(max_calls=5, window_seconds=60)


@router.post("/feedback", response_model=Message, dependencies=[Depends(limit_by_ip(feedback_limiter))])
def submit_feedback(
    data: FeedbackCreate,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    # The name comes from the login token, never from the request body.
    comment = data.comment.strip() if data.comment else None
    crud.create_feedback(db, user.username if user else None, data.rating, comment or None)
    return {"message": "Thank you for your feedback!"}
