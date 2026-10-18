import json

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.core.rate_limit import RateLimiter
from app.core.security import get_current_user
from app.core.url_guard import UnsafeTargetError
from app.database import get_db
from app.models import User
from app.services.scanner import ScanError, run_scan

router = APIRouter(tags=["scan"])

# Each scan makes several outbound requests, so keep it per user and modest.
scan_limiter = RateLimiter(max_calls=10, window_seconds=60)


@router.get("/full-scan")
def full_scan(
    url: str = Query(..., min_length=1, max_length=2048),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan_limiter.check(f"user:{user.id}")

    try:
        result = run_scan(url)
    except UnsafeTargetError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ScanError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    saved = crud.save_scan(
        db,
        user,
        website=result["website"],
        score=result["security_score"],
        risk=result["risk"],
        details=json.dumps(result),
    )
    result["id"] = saved.id
    return result
