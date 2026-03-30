"""
QUNAR Farm Management Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.farm import Crop, Harvest, Plot
from app.models.user import User, UserStats
from app.schemas.farm import Crop as CropSchema
from app.schemas.farm import Plot as PlotSchema
from app.schemas.farm import PlotCreate, PlotUpdate

router = APIRouter()


@router.post("", response_model=PlotSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=PlotSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_farm(
    request: Request,
    farm_in: PlotCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> PlotSchema:
    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    max_plots = 5 if current_user.subscription_type == "premium" else 1
    current_plots = db.query(func.count(Plot.id)).filter(Plot.user_id == current_user.id).scalar() or 0

    if user_stats:
        user_stats.total_plots = user_stats.total_plots or 0

    if current_plots >= max_plots:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Plot limit exceeded for your subscription",
        )

    db_plot = Plot(
        user_id=current_user.id,
        unity_plot_id=farm_in.unity_plot_id,
        name=farm_in.name,
        location_x=farm_in.location.x if farm_in.location else 0,
        location_y=farm_in.location.y if farm_in.location else 0,
        size=farm_in.size,
    )
    db.add(db_plot)

    if user_stats:
        user_stats.total_plots = current_plots + 1
    else:
        db.add(UserStats(user_id=current_user.id, total_plots=current_plots + 1))

    log_activity(
        db,
        user_id=current_user.id,
        action="farm.create",
        resource_type="farm",
        request=request,
    )
    db.commit()
    db.refresh(db_plot)
    return PlotSchema.model_validate(db_plot)


@router.get("", response_model=list[PlotSchema])
@router.get("/", response_model=list[PlotSchema], include_in_schema=False)
async def list_farms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    search: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(id|name|size|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> list[PlotSchema]:
    query = db.query(Plot).filter(Plot.user_id == current_user.id)
    if search:
        query = query.filter(Plot.name.ilike(f"%{search}%"))

    order_column = getattr(Plot, sort_by)
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())
    plots = query.offset(skip).limit(limit).all()
    return [PlotSchema.model_validate(plot) for plot in plots]


@router.get("/stats/overview")
async def get_farms_overview(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    farms_count = db.query(func.count(Plot.id)).filter(Plot.user_id == current_user.id).scalar() or 0
    total_size = (
        db.query(func.coalesce(func.sum(Plot.size), 0))
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )
    crops_count = (
        db.query(func.count(Crop.id))
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )
    harvests_count = (
        db.query(func.count(Harvest.id))
        .join(Crop, Crop.id == Harvest.crop_id)
        .join(Plot, Plot.id == Crop.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )

    return {
        "farms_count": farms_count,
        "total_farm_size": float(total_size),
        "plants_count": crops_count,
        "harvests_count": harvests_count,
    }


@router.get("/{farm_id}", response_model=PlotSchema)
async def get_farm(
    farm_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> PlotSchema:
    farm = db.query(Plot).filter(Plot.id == farm_id, Plot.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")
    return PlotSchema.model_validate(farm)


@router.patch("/{farm_id}", response_model=PlotSchema)
async def update_farm(
    farm_id: int,
    request: Request,
    farm_update: PlotUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> PlotSchema:
    farm = db.query(Plot).filter(Plot.id == farm_id, Plot.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    update_data = farm_update.model_dump(exclude_unset=True)
    location = update_data.pop("location", None)
    if location:
        farm.location_x = location["x"]
        farm.location_y = location["y"]
    for field, value in update_data.items():
        setattr(farm, field, value)

    log_activity(
        db,
        user_id=current_user.id,
        action="farm.update",
        resource_type="farm",
        resource_id=farm.id,
        request=request,
    )
    db.commit()
    db.refresh(farm)
    return PlotSchema.model_validate(farm)


@router.delete("/{farm_id}", response_model=dict)
async def delete_farm(
    farm_id: int,
    request: Request,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    farm = db.query(Plot).filter(Plot.id == farm_id, Plot.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    crops_count = db.query(Crop).filter(Crop.plot_id == farm_id).count()
    if crops_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete farm with existing crops",
        )

    db.delete(farm)
    user_stats = db.query(UserStats).filter(UserStats.user_id == current_user.id).first()
    if user_stats:
        remaining = db.query(func.count(Plot.id)).filter(Plot.user_id == current_user.id).scalar() or 0
        user_stats.total_plots = remaining

    log_activity(
        db,
        user_id=current_user.id,
        action="farm.delete",
        resource_type="farm",
        resource_id=farm.id,
        request=request,
    )
    db.commit()
    return {"message": "Farm deleted successfully"}


@router.get("/{farm_id}/crops", response_model=list[CropSchema])
async def get_farm_crops(
    farm_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    crop_status: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(id|crop_type|status|progress|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> list[CropSchema]:
    farm = db.query(Plot).filter(Plot.id == farm_id, Plot.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    query = db.query(Crop).filter(Crop.plot_id == farm_id)
    if crop_status:
        query = query.filter(Crop.status == crop_status)

    order_column = getattr(Crop, sort_by)
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())
    crops = query.offset(skip).limit(limit).all()
    return [CropSchema.model_validate(crop) for crop in crops]


@router.get("/{farm_id}/stats")
async def get_farm_stats(
    farm_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    farm = db.query(Plot).filter(Plot.id == farm_id, Plot.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Farm not found")

    total_crops = db.query(Crop).filter(Crop.plot_id == farm_id).count()
    active_crops = db.query(Crop).filter(
        Crop.plot_id == farm_id,
        Crop.status.in_(["planted", "growing", "ready"]),
    ).count()
    total_harvests = db.query(Harvest).join(Crop).filter(Crop.plot_id == farm_id).count()

    return {
        "farm_id": farm_id,
        "farm_name": farm.name,
        "total_crops": total_crops,
        "active_crops": active_crops,
        "total_harvests": total_harvests,
        "farm_size": float(farm.size),
    }
