"""
QUNAR Farm Schemas
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Location(BaseModel):
    x: float
    y: float


class PlotBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    size: float = Field(..., gt=0, le=100)


class PlotCreate(PlotBase):
    unity_plot_id: Optional[str] = None
    location: Optional[Location] = None


class PlotUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    size: Optional[float] = Field(None, gt=0, le=100)
    location: Optional[Location] = None


class PlotInDBBase(ORMModel):
    id: int
    user_id: int
    unity_plot_id: Optional[str] = None
    name: str
    location_x: float
    location_y: float
    size: float
    created_at: datetime
    updated_at: Optional[datetime] = None


class Plot(PlotInDBBase):
    pass


class CropBase(BaseModel):
    crop_type: str = Field(..., min_length=1, max_length=50)


class CropCreate(CropBase):
    plot_id: int
    unity_crop_id: Optional[str] = None


class CropUpdate(BaseModel):
    progress: Optional[int] = Field(None, ge=0, le=100)
    water_level: Optional[int] = Field(None, ge=0, le=100)
    fertilizer_level: Optional[int] = Field(None, ge=0, le=100)
    health: Optional[int] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(None, pattern="^(planted|growing|ready|harvested)$")


class CropInDBBase(ORMModel):
    id: int
    plot_id: int
    unity_crop_id: Optional[str] = None
    crop_type: str
    status: str
    progress: int
    water_level: int
    fertilizer_level: int
    health: int
    planted_at: datetime
    last_watered: datetime
    expected_harvest: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class Crop(CropInDBBase):
    pass


class HarvestBase(BaseModel):
    crop_type: str
    quantity: int
    experience_gained: int


class HarvestCreate(HarvestBase):
    crop_id: int


class HarvestInDBBase(ORMModel):
    id: int
    crop_id: int
    user_id: int
    crop_type: str
    quantity: int
    experience_gained: int
    created_at: datetime


class Harvest(HarvestInDBBase):
    pass


class FarmStats(BaseModel):
    total_plots: int
    active_crops: int
    total_harvests: int
    experience: int
    level: int
    plots: list[Plot]
    crops: list[Crop]
