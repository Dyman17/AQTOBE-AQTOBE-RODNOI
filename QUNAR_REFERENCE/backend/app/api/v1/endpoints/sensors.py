"""
QUNAR Sensors Endpoints
"""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api import deps
from app.core.activity import log_activity
from app.models.farm import Plot
from app.models.sensor import Sensor, SensorData
from app.models.user import User
from app.schemas.sensor import Sensor as SensorSchema
from app.schemas.sensor import SensorCreate, SensorData as SensorDataSchema, SensorDataCreate, SensorUpdate

router = APIRouter()


@router.post("", response_model=SensorSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SensorSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_sensor(
    request: Request,
    sensor_in: SensorCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> SensorSchema:
    plot = db.query(Plot).filter(Plot.id == sensor_in.plot_id, Plot.user_id == current_user.id).first()
    if not plot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plot not found")

    if db.query(Sensor).filter(Sensor.plot_id == sensor_in.plot_id).count() >= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum sensors per plot exceeded",
        )

    db_sensor = Sensor(
        plot_id=sensor_in.plot_id,
        sensor_type=sensor_in.sensor_type,
        name=sensor_in.name,
        location_x=sensor_in.location.x if sensor_in.location else 0,
        location_y=sensor_in.location.y if sensor_in.location else 0,
        unity_sensor_id=sensor_in.unity_sensor_id,
    )
    db.add(db_sensor)
    log_activity(
        db,
        user_id=current_user.id,
        action="sensor.create",
        resource_type="sensor",
        request=request,
    )
    db.commit()
    db.refresh(db_sensor)
    return SensorSchema.model_validate(db_sensor)


@router.get("", response_model=list[SensorSchema])
@router.get("/", response_model=list[SensorSchema], include_in_schema=False)
async def list_sensors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    plot_id: int | None = Query(None),
    sensor_type: str | None = Query(None),
    sort_by: str = Query("created_at", pattern="^(id|name|sensor_type|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> list[SensorSchema]:
    query = db.query(Sensor).join(Plot).filter(Plot.user_id == current_user.id)
    if plot_id:
        query = query.filter(Sensor.plot_id == plot_id)
    if sensor_type:
        query = query.filter(Sensor.sensor_type == sensor_type)

    order_column = getattr(Sensor, sort_by)
    query = query.order_by(order_column.asc() if sort_order == "asc" else order_column.desc())
    sensors = query.offset(skip).limit(limit).all()
    return [SensorSchema.model_validate(sensor) for sensor in sensors]


@router.get("/stats")
async def get_sensors_overview(
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    total_sensors = (
        db.query(func.count(Sensor.id))
        .join(Plot, Plot.id == Sensor.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )
    active_sensors = (
        db.query(func.count(Sensor.id))
        .join(Plot, Plot.id == Sensor.plot_id)
        .filter(Plot.user_id == current_user.id, Sensor.is_active.is_(True))
        .scalar()
        or 0
    )
    by_type = (
        db.query(Sensor.sensor_type, func.count(Sensor.id))
        .join(Plot, Plot.id == Sensor.plot_id)
        .filter(Plot.user_id == current_user.id)
        .group_by(Sensor.sensor_type)
        .all()
    )
    data_points = (
        db.query(func.count(SensorData.id))
        .join(Sensor, Sensor.id == SensorData.sensor_id)
        .join(Plot, Plot.id == Sensor.plot_id)
        .filter(Plot.user_id == current_user.id)
        .scalar()
        or 0
    )
    return {
        "total_sensors": total_sensors,
        "active_sensors": active_sensors,
        "data_points": data_points,
        "by_type": [{"sensor_type": row[0], "count": row[1]} for row in by_type],
    }


@router.get("/{sensor_id}", response_model=SensorSchema)
async def get_sensor(
    sensor_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> SensorSchema:
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")
    return SensorSchema.model_validate(sensor)


@router.patch("/{sensor_id}", response_model=SensorSchema)
async def update_sensor(
    sensor_id: int,
    request: Request,
    sensor_update: SensorUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> SensorSchema:
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    update_data = sensor_update.model_dump(exclude_unset=True)
    location = update_data.pop("location", None)
    if location:
        sensor.location_x = location["x"]
        sensor.location_y = location["y"]
    for field, value in update_data.items():
        setattr(sensor, field, value)
    sensor.updated_at = datetime.utcnow()

    log_activity(
        db,
        user_id=current_user.id,
        action="sensor.update",
        resource_type="sensor",
        resource_id=sensor.id,
        request=request,
    )
    db.commit()
    db.refresh(sensor)
    return SensorSchema.model_validate(sensor)


@router.delete("/{sensor_id}", response_model=dict)
async def delete_sensor(
    sensor_id: int,
    request: Request,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    db.query(SensorData).filter(SensorData.sensor_id == sensor_id).delete()
    log_activity(
        db,
        user_id=current_user.id,
        action="sensor.delete",
        resource_type="sensor",
        resource_id=sensor.id,
        request=request,
    )
    db.delete(sensor)
    db.commit()
    return {"message": "Sensor deleted successfully"}


@router.post("/{sensor_id}/data", response_model=SensorDataSchema)
async def send_sensor_data(
    sensor_id: int,
    request: Request,
    data_in: SensorDataCreate,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> SensorDataSchema:
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    db_data = SensorData(
        sensor_id=sensor_id,
        value=data_in.value,
        unit=data_in.unit,
        timestamp=data_in.timestamp or datetime.utcnow(),
    )
    db.add(db_data)
    log_activity(
        db,
        user_id=current_user.id,
        action="sensor.data.create",
        resource_type="sensor",
        resource_id=sensor_id,
        details={"value": data_in.value, "unit": data_in.unit},
        request=request,
    )

    if sensor.sensor_type == "humidity" and data_in.value < 30:
        log_activity(
            db,
            user_id=current_user.id,
            action="sensor.alert.low_humidity",
            resource_type="sensor",
            resource_id=sensor_id,
            details={"value": data_in.value, "threshold": 30},
            request=request,
        )
    if sensor.sensor_type == "temperature" and data_in.value > 35:
        log_activity(
            db,
            user_id=current_user.id,
            action="sensor.alert.high_temperature",
            resource_type="sensor",
            resource_id=sensor_id,
            details={"value": data_in.value, "threshold": 35},
            request=request,
        )

    db.commit()
    db.refresh(db_data)
    return SensorDataSchema.model_validate(db_data)


@router.get("/{sensor_id}/data", response_model=list[SensorDataSchema])
async def get_sensor_data(
    sensor_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> list[SensorDataSchema]:
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    query = db.query(SensorData).filter(SensorData.sensor_id == sensor_id)
    if start_date:
        query = query.filter(SensorData.timestamp >= start_date)
    if end_date:
        query = query.filter(SensorData.timestamp <= end_date)

    data = query.order_by(SensorData.timestamp.desc()).offset(skip).limit(limit).all()
    return [SensorDataSchema.model_validate(item) for item in data]


@router.get("/{sensor_id}/stats")
async def get_sensor_stats(
    sensor_id: int,
    hours: int = Query(24, ge=1, le=168),
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
):
    sensor = (
        db.query(Sensor)
        .join(Plot)
        .filter(Sensor.id == sensor_id, Plot.user_id == current_user.id)
        .first()
    )
    if not sensor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sensor not found")

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    stats = db.query(
        func.count(SensorData.id).label("count"),
        func.avg(SensorData.value).label("avg_value"),
        func.min(SensorData.value).label("min_value"),
        func.max(SensorData.value).label("max_value"),
    ).filter(
        SensorData.sensor_id == sensor_id,
        SensorData.timestamp >= start_time,
        SensorData.timestamp <= end_time,
    ).first()

    latest_data = (
        db.query(SensorData)
        .filter(SensorData.sensor_id == sensor_id)
        .order_by(SensorData.timestamp.desc())
        .first()
    )
    return {
        "sensor_id": sensor_id,
        "sensor_type": sensor.sensor_type,
        "time_range_hours": hours,
        "data_points": stats.count or 0,
        "average_value": float(stats.avg_value) if stats.avg_value else None,
        "min_value": float(stats.min_value) if stats.min_value else None,
        "max_value": float(stats.max_value) if stats.max_value else None,
        "latest_value": float(latest_data.value) if latest_data else None,
        "latest_timestamp": latest_data.timestamp if latest_data else None,
    }


@router.get("/types/list")
async def get_sensor_types():
    return {
        "sensor_types": [
            {"type": "humidity", "name": "Soil Humidity", "unit": "%"},
            {"type": "temperature", "name": "Temperature", "unit": "C"},
            {"type": "light", "name": "Light", "unit": "lux"},
            {"type": "ph", "name": "Soil pH", "unit": "pH"},
            {"type": "nutrients", "name": "Nutrients", "unit": "ppm"},
            {"type": "co2", "name": "CO2", "unit": "ppm"},
            {"type": "moisture", "name": "Air Moisture", "unit": "%"},
            {"type": "pressure", "name": "Pressure", "unit": "hPa"},
        ]
    }
