"""
QUNAR Billing Endpoints (Demo)
"""

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.user import User
from app.schemas.billing import DemoCheckoutRequest, DemoCheckoutResponse

router = APIRouter()


@router.post("/checkout/demo", response_model=DemoCheckoutResponse)
async def demo_checkout(
    request: Request,
    payload: DemoCheckoutRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> DemoCheckoutResponse:
    current_user.subscription_type = payload.plan
    log_activity(
        db,
        user_id=current_user.id,
        action="billing.demo.checkout",
        resource_type="subscription",
        resource_id=current_user.id,
        request=request,
        details={"plan": payload.plan},
    )
    db.commit()
    db.refresh(current_user)
    return DemoCheckoutResponse(
        status="paid",
        plan=payload.plan,
        subscription_type=current_user.subscription_type,
        message="Demo payment processed",
    )
