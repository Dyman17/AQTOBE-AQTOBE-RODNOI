"""
QUNAR Activity Logs Endpoints
"""

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.log import ActivityLog
from app.models.user import User

router = APIRouter()


class LogCreateRequest(BaseModel):
    action: str
    resource_type: str | None = None
    resource_id: int | None = None
    details: dict[str, Any] | None = None


@router.get("", response_model=list[dict])
@router.get("/", response_model=list[dict], include_in_schema=False)
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: int | None = Query(None),
    action: str | None = Query(None),
    resource_type: str | None = Query(None),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    _ = current_user
    query = db.query(ActivityLog)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action:
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))
    if resource_type:
        query = query.filter(ActivityLog.resource_type == resource_type)
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)

    query = query.order_by(
        ActivityLog.created_at.asc() if sort_order == "asc" else ActivityLog.created_at.desc()
    )
    logs = query.offset(skip).limit(limit).all()
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/stats")
async def get_activity_stats(
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    _ = current_user
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)

    total_actions = db.query(ActivityLog).filter(
        ActivityLog.created_at >= start_time,
        ActivityLog.created_at <= end_time,
    ).count()

    top_actions = db.query(
        ActivityLog.action,
        func.count(ActivityLog.id).label("count"),
    ).filter(
        ActivityLog.created_at >= start_time,
        ActivityLog.created_at <= end_time,
    ).group_by(ActivityLog.action).order_by(func.count(ActivityLog.id).desc()).limit(10).all()

    top_users = db.query(
        ActivityLog.user_id,
        func.count(ActivityLog.id).label("count"),
    ).filter(
        ActivityLog.created_at >= start_time,
        ActivityLog.created_at <= end_time,
        ActivityLog.user_id.isnot(None),
    ).group_by(ActivityLog.user_id).order_by(func.count(ActivityLog.id).desc()).limit(10).all()

    if db.bind and db.bind.dialect.name == "sqlite":
        hour_expr = func.strftime("%Y-%m-%d %H:00:00", ActivityLog.created_at)
    else:
        hour_expr = func.date_trunc("hour", ActivityLog.created_at)

    hourly_activity = db.query(
        hour_expr.label("hour"),
        func.count(ActivityLog.id).label("count"),
    ).filter(
        ActivityLog.created_at >= start_time,
        ActivityLog.created_at <= end_time,
    ).group_by(hour_expr).order_by(hour_expr).all()

    return {
        "time_range_hours": hours,
        "total_actions": total_actions,
        "top_actions": [{"action": row[0], "count": row[1]} for row in top_actions],
        "top_users": [{"user_id": row[0], "actions": row[1]} for row in top_users],
        "hourly_activity": [{"hour": str(row[0]), "actions": row[1]} for row in hourly_activity],
    }


@router.get("/user/{user_id}")
async def get_user_activity(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    _ = current_user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == user_id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()

    return {
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
        "logs": [
            {
                "id": log.id,
                "action": log.action,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "details": log.details,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "created_at": log.created_at,
            }
            for log in logs
        ],
    }


@router.post("/log", response_model=dict)
async def create_activity_log(
    request: Request,
    payload: LogCreateRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    log_activity(
        db,
        user_id=current_user.id,
        action=payload.action,
        resource_type=payload.resource_type,
        resource_id=payload.resource_id,
        details=payload.details or {},
        request=request,
    )
    db.commit()
    return {"message": "Activity logged successfully"}
