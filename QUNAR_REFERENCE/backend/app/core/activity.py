"""
Activity logging helpers.
"""

from __future__ import annotations

from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.log import ActivityLog


def log_activity(
    db: Session,
    *,
    user_id: int | None,
    action: str,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    """
    Persist a user/system action for audit and analytics.
    """
    db.add(
        ActivityLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=(request.client.host if request and request.client else None),
            user_agent=(request.headers.get("user-agent") if request else None),
        )
    )
