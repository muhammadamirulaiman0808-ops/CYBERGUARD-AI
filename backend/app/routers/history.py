import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.core.security import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import HistoryItem, HistoryStats, Message, ScanDetail

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=List[HistoryItem])
def list_history(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_scans(db, user, limit=limit, offset=offset)


# Declared before "/{scan_id}" so "stats" is not parsed as an id.
@router.get("/stats", response_model=HistoryStats)
def history_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return crud.scan_stats(db, user)


@router.get("/{scan_id}", response_model=ScanDetail)
def get_history_item(
    scan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    scan = crud.get_scan(db, user, scan_id)
    if scan is None:
        raise HTTPException(status_code=404, detail="Scan not found.")

    try:
        result = json.loads(scan.details) if scan.details else None
    except json.JSONDecodeError:
        result = None

    return ScanDetail(
        id=scan.id,
        website=scan.website,
        score=scan.score,
        risk=scan.risk,
        date=scan.date,
        result=result,
    )


@router.delete("/{scan_id}", response_model=Message)
def delete_history_item(
    scan_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not crud.delete_scan(db, user, scan_id):
        raise HTTPException(status_code=404, detail="Scan not found.")
    return {"message": "Scan deleted."}


@router.delete("", response_model=Message)
def delete_all_history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = crud.delete_all_scans(db, user)
    return {"message": f"{count} scan(s) deleted."}
