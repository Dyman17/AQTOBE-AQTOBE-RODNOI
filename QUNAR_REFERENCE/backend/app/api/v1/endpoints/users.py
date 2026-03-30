"""
QUNAR User Profile Endpoints
"""

import os
import uuid

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.activity import log_activity
from app.models.user import User, UserStats
from app.schemas.user import (
    ChangePasswordRequest,
    MessageResponse,
    User as UserSchema,
    UserStats as UserStatsSchema,
    UserUpdate,
)

router = APIRouter()


@router.get("/me", response_model=UserSchema)
async def get_current_user_profile(
    current_user: User = Depends(deps.get_current_active_user),
) -> User:
    return current_user


@router.patch("/me", response_model=UserSchema)
async def update_current_user_profile(
    request: Request,
    user_update: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> User:
    if user_update.email and user_update.email != current_user.email:
        existing_user = db.query(User).filter(User.email == user_update.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.phone is not None:
        current_user.phone = user_update.phone
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    log_activity(
        db,
        user_id=current_user.id,
        action="user.profile.update",
        resource_type="user",
        resource_id=current_user.id,
        request=request,
    )
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=MessageResponse)
async def change_password(
    request: Request,
    payload: ChangePasswordRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> MessageResponse:
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    log_activity(
        db,
        user_id=current_user.id,
        action="user.password.change",
        resource_type="user",
        resource_id=current_user.id,
        request=request,
    )
    db.commit()
    return MessageResponse(message="Password changed successfully")


@router.post("/me/avatar", response_model=dict)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image",
        )

    uploads_dir = "uploads/avatars"
    os.makedirs(uploads_dir, exist_ok=True)

    extension = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{extension}"
    file_path = os.path.join(uploads_dir, filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(await file.read())

    current_user.avatar_url = f"/uploads/avatars/{filename}"
    log_activity(
        db,
        user_id=current_user.id,
        action="user.avatar.upload",
        resource_type="user",
        resource_id=current_user.id,
        request=request,
    )
    db.commit()
    return {"avatar_url": current_user.avatar_url}


@router.get("/me/stats", response_model=UserStatsSchema)
async def get_user_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> UserStatsSchema:
    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if not user_stats:
        user_stats = UserStats(user_id=current_user.id)
        db.add(user_stats)
        db.commit()
        db.refresh(user_stats)
    return UserStatsSchema.model_validate(user_stats)


@router.get("/stats/overview")
async def get_users_overview(
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    superusers = db.query(func.count(User.id)).filter(User.is_superuser.is_(True)).scalar() or 0

    by_subscription = db.query(
        User.subscription_type,
        func.count(User.id),
    ).group_by(User.subscription_type).all()

    return {
        "total_users": total_users,
        "active_users": active_users,
        "superusers": superusers,
        "subscriptions": [
            {"type": row[0], "count": row[1]}
            for row in by_subscription
        ],
    }


@router.get("/{user_id}", response_model=UserSchema)
async def get_user_profile(
    user_id: int,
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.get("/", response_model=list[UserSchema])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(id|email|created_at|last_login)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_superuser),
    db: Session = Depends(deps.get_db),
) -> list[User]:
    query = db.query(User)
    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.full_name.ilike(f"%{search}%"),
            )
        )

    order_column = getattr(User, sort_by)
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())
    return query.offset(skip).limit(limit).all()
