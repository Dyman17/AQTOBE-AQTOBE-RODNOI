from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


class FutureApiSlot(BaseModel):
    slot_id: str = Field(min_length=2)
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str = Field(min_length=2)
    status: Literal["reserved", "in_design", "planned"] = "reserved"
    owner: str = Field(min_length=2, max_length=120)
    summary: str = Field(min_length=3, max_length=400)


FUTURE_API_SLOTS: list[FutureApiSlot] = [
    FutureApiSlot(
        slot_id="bilimclass_sync",
        method="POST",
        path="/integrations/bilimclass/sync",
        status="planned",
        owner="backend",
        summary="Incremental sync from BilimClass-compatible source into school data lake.",
    ),
    FutureApiSlot(
        slot_id="predictive_forecast",
        method="POST",
        path="/analytics/forecast",
        status="in_design",
        owner="analytics",
        summary="Subject/class-level predictive forecast with explainable confidence intervals.",
    ),
    FutureApiSlot(
        slot_id="report_export",
        method="POST",
        path="/reports/export",
        status="reserved",
        owner="backend",
        summary="Export school, class, or student reports as PDF/CSV payloads.",
    ),
    FutureApiSlot(
        slot_id="push_broadcast",
        method="POST",
        path="/notifications/push/broadcast",
        status="reserved",
        owner="realtime",
        summary="Push notification fan-out for critical schedule and safety announcements.",
    ),
    FutureApiSlot(
        slot_id="audit_log_query",
        method="GET",
        path="/audit/events",
        status="planned",
        owner="backend",
        summary="Queryable audit trail with filters by actor, entity, and time range.",
    ),
]

router = APIRouter(prefix="/_future", tags=["Future API Slots"])


@router.get("/slots", response_model=list[FutureApiSlot])
async def list_future_slots() -> list[FutureApiSlot]:
    return FUTURE_API_SLOTS


@router.api_route("/slots/{slot_id}/stub", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def future_slot_stub(slot_id: str) -> dict[str, str]:
    slot = next((item for item in FUTURE_API_SLOTS if item.slot_id == slot_id), None)
    if not slot:
        raise HTTPException(status_code=404, detail=f"Unknown future slot: {slot_id}")
    raise HTTPException(
        status_code=501,
        detail=f"Future API slot '{slot.slot_id}' is reserved and not implemented yet",
    )

