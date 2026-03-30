"""
QUNAR Plants/Crops Endpoints
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.farm import Crop, Harvest, Plot
from app.models.user import User, UserStats
from app.schemas.farm import Crop as CropSchema
from app.schemas.farm import CropCreate, CropUpdate
from app.schemas.farm import Harvest as HarvestSchema

router = APIRouter()


@router.post("", response_model=CropSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CropSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_plant(
    request: Request,
    plant_in: CropCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> CropSchema:
    plot = db.query(Plot).filter(Plot.id == plant_in.plot_id, Plot.user_id == current_user.id).first()
    if not plot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    existing_crops = db.query(Crop).filter(Crop.plot_id == plant_in.plot_id).count()
    if existing_crops >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum crops per plot exceeded",
        )

    db_crop = Crop(
        plot_id=plant_in.plot_id,
        unity_crop_id=plant_in.unity_crop_id,
        crop_type=plant_in.crop_type,
        expected_harvest=datetime.utcnow() + timedelta(days=60),
    )
    db.add(db_crop)

    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if user_stats:
        user_stats.total_crops = (user_stats.total_crops or 0) + 1

    log_activity(
        db,
        user_id=current_user.id,
        action="plant.create",
        resource_type="plant",
        request=request,
    )
    db.commit()
    db.refresh(db_crop)
    return CropSchema.model_validate(db_crop)


@router.get("", response_model=list[CropSchema])
@router.get("/", response_model=list[CropSchema], include_in_schema=False)
async def list_plants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    plot_id: int | None = Query(None),
    crop_type: str | None = Query(None),
    plant_status: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(id|crop_type|status|progress|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> list[CropSchema]:
    query = db.query(Crop).join(Plot).filter(Plot.user_id == current_user.id)
    if plot_id:
        query = query.filter(Crop.plot_id == plot_id)
    if crop_type:
        query = query.filter(Crop.crop_type == crop_type)
    if plant_status:
        query = query.filter(Crop.status == plant_status)

    order_column = getattr(Crop, sort_by)
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())
    crops = query.offset(skip).limit(limit).all()
    return [CropSchema.model_validate(crop) for crop in crops]


@router.get("/stats")
async def get_plants_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    total_plants = (
        db.query(func.count(Crop.id))
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )
    by_status = (
        db.query(Crop.status, func.count(Crop.id))
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .group_by(Crop.status)
        .all()
    )
    by_type = (
        db.query(Crop.crop_type, func.count(Crop.id))
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .group_by(Crop.crop_type)
        .all()
    )
    total_harvests = (
        db.query(func.count(Harvest.id))
        .join(Crop, Crop.id == Harvest.crop_id)
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )

    return {
        "total_plants": total_plants,
        "total_harvests": total_harvests,
        "by_status": [{"status": row[0], "count": row[1]} for row in by_status],
        "by_type": [{"crop_type": row[0], "count": row[1]} for row in by_type],
    }


@router.get("/{plant_id}", response_model=CropSchema)
async def get_plant(
    plant_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> CropSchema:
    plant = (
        db.query(Crop)
        .join(Plot)
        .filter(Crop.id == plant_id, Plot.user_id == current_user.id)
        .first()
    )
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return CropSchema.model_validate(plant)


@router.patch("/{plant_id}", response_model=CropSchema)
async def update_plant(
    plant_id: int,
    request: Request,
    plant_update: CropUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> CropSchema:
    plant = (
        db.query(Crop)
        .join(Plot)
        .filter(Crop.id == plant_id, Plot.user_id == current_user.id)
        .first()
    )
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    if plant_update.progress is not None:
        plant.progress = plant_update.progress
        if plant_update.progress >= 100:
            plant.status = "ready"
        elif plant_update.progress > 0 and plant.status == "planted":
            plant.status = "growing"

    if plant_update.water_level is not None:
        plant.water_level = plant_update.water_level
        plant.last_watered = datetime.utcnow()
    if plant_update.fertilizer_level is not None:
        plant.fertilizer_level = plant_update.fertilizer_level
    if plant_update.health is not None:
        plant.health = plant_update.health
    if plant_update.status is not None:
        plant.status = plant_update.status

    plant.updated_at = datetime.utcnow()
    log_activity(
        db,
        user_id=current_user.id,
        action="plant.update",
        resource_type="plant",
        resource_id=plant.id,
        request=request,
    )
    db.commit()
    db.refresh(plant)
    return CropSchema.model_validate(plant)


@router.delete("/{plant_id}", response_model=dict)
async def delete_plant(
    plant_id: int,
    request: Request,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    plant = (
        db.query(Crop)
        .join(Plot)
        .filter(Crop.id == plant_id, Plot.user_id == current_user.id)
        .first()
    )
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    # Remove harvest history first to avoid FK issues in older schemas
    harvest_count = (
        db.query(Harvest)
        .filter(Harvest.crop_id == plant.id)
        .delete(synchronize_session=False)
    )

    db.delete(plant)

    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if user_stats:
        user_stats.total_crops = max((user_stats.total_crops or 0) - 1, 0)
        if harvest_count:
            user_stats.total_harvests = max((user_stats.total_harvests or 0) - harvest_count, 0)

    log_activity(
        db,
        user_id=current_user.id,
        action="plant.delete",
        resource_type="plant",
        resource_id=plant.id,
        request=request,
    )
    db.commit()
    return {"message": "Plant deleted successfully"}


@router.post("/{plant_id}/harvest", response_model=HarvestSchema)
async def harvest_plant(
    plant_id: int,
    request: Request,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> HarvestSchema:
    plant = (
        db.query(Crop)
        .join(Plot)
        .filter(Crop.id == plant_id, Plot.user_id == current_user.id)
        .first()
    )
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    if plant.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plant is not ready for harvest",
        )

    quantity = max(1, int(10 * (plant.health / 100)))
    experience_gained = 50
    harvest = Harvest(
        crop_id=plant.id,
        user_id=current_user.id,
        crop_type=plant.crop_type,
        quantity=quantity,
        experience_gained=experience_gained,
    )
    db.add(harvest)
    plant.status = "harvested"
    plant.updated_at = datetime.utcnow()

    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if user_stats:
        user_stats.total_harvests = (user_stats.total_harvests or 0) + 1
        user_stats.experience = (user_stats.experience or 0) + experience_gained
        user_stats.level = (user_stats.experience // 500) + 1

    log_activity(
        db,
        user_id=current_user.id,
        action="plant.harvest",
        resource_type="plant",
        resource_id=plant.id,
        details={"quantity": quantity},
        request=request,
    )
    db.commit()
    db.refresh(harvest)
    return HarvestSchema.model_validate(harvest)


@router.get("/{plant_id}/history")
async def get_plant_history(
    plant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    plant = (
        db.query(Crop)
        .join(Plot)
        .filter(Crop.id == plant_id, Plot.user_id == current_user.id)
        .first()
    )
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    harvests = (
        db.query(Harvest)
        .filter(Harvest.crop_id == plant_id)
        .order_by(Harvest.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return {
        "plant_id": plant_id,
        "plant_type": plant.crop_type,
        "plant_status": plant.status,
        "harvests": [
            {
                "id": h.id,
                "quantity": h.quantity,
                "experience_gained": h.experience_gained,
                "created_at": h.created_at,
            }
            for h in harvests
        ],
    }


@router.get("/types/list")
async def get_plant_types():
    return {
        "plant_types": [
            {"type": "tomato", "name": "Tomato", "growth_days": 60},
            {"type": "carrot", "name": "Carrot", "growth_days": 45},
            {"type": "potato", "name": "Potato", "growth_days": 70},
            {"type": "cucumber", "name": "Cucumber", "growth_days": 40},
            {"type": "pepper", "name": "Pepper", "growth_days": 55},
            {"type": "lettuce", "name": "Lettuce", "growth_days": 30},
            {"type": "corn", "name": "Corn", "growth_days": 80},
            {"type": "onion", "name": "Onion", "growth_days": 50},
        ]
    }
