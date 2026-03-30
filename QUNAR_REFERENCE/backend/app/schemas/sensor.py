"""
QUNAR Sensor Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Location(BaseModel):
    x: float
    y: float


class SensorBase(BaseModel):
    sensor_type: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)


class SensorCreate(SensorBase):
    plot_id: int
    unity_sensor_id: Optional[str] = None
    location: Optional[Location] = None


class SensorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    is_active: Optional[bool] = None
    location: Optional[Location] = None


class SensorInDBBase(ORMModel):
    id: int
    plot_id: int
    unity_sensor_id: Optional[str] = None
    sensor_type: str
    name: str
    location_x: float
    location_y: float
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class Sensor(SensorInDBBase):
    pass


class SensorDataBase(BaseModel):
    value: float
    unit: str
    timestamp: Optional[datetime] = None


class SensorDataCreate(SensorDataBase):
    pass


class SensorDataInDBBase(ORMModel):
    id: int
    sensor_id: int
    value: float
    unit: str
    timestamp: datetime
    created_at: datetime


class SensorData(SensorDataInDBBase):
    pass


class SensorStats(BaseModel):
    sensor_id: int
    sensor_type: str
    time_range_hours: int
    data_points: int
    average_value: Optional[float]
    min_value: Optional[float]
    max_value: Optional[float]
    latest_value: Optional[float]
    latest_timestamp: Optional[datetime]
