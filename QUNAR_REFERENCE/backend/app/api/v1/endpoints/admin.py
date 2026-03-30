"""
QUNAR Admin Bootstrap Endpoint
"""

import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.activity import log_activity
from app.core.config import settings
from app.models.user import User, UserStats
from app.schemas.admin import AdminBootstrapRequest
from app.schemas.user import User as UserSchema

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/bootstrap", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def bootstrap_admin(
    request: Request,
    payload: AdminBootstrapRequest,
    db: Session = Depends(deps.get_db),
) -> User:
    if not settings.ADMIN_BOOTSTRAP_TOKEN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if not hmac.compare_digest(payload.secret, settings.ADMIN_BOOTSTRAP_TOKEN):
        logger.warning("Invalid admin bootstrap token from %s", request.client.host)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap token")

    existing_admin = db.query(User).filter(User.is_superuser.is_(True)).first()
    if existing_admin:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admin already exists")

    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        user.is_superuser = True
        user.is_active = True
        user.full_name = payload.full_name or user.full_name
        user.phone = payload.phone or user.phone
        user.hashed_password = security.get_password_hash(payload.password)
    else:
        user = User(
            email=payload.email,
            hashed_password=security.get_password_hash(payload.password),
            full_name=payload.full_name,
            phone=payload.phone,
            is_active=True,
            is_superuser=True,
        )
        db.add(user)
        db.flush()
        db.add(UserStats(user_id=user.id))

    log_activity(
        db,
        user_id=user.id,
        action="admin.bootstrap",
        resource_type="user",
        resource_id=user.id,
        request=request,
    )
    db.commit()
    db.refresh(user)

    logger.info("Admin bootstrap completed for %s", user.email)
    return user
