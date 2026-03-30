"""
QUNAR Farm Models
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.db import Base


class Plot(Base):
    __tablename__ = "plots"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    unity_plot_id = Column(String(100), unique=True)
    name = Column(String, nullable=False)
    location_x = Column(Numeric(10, 6), default=0)
    location_y = Column(Numeric(10, 6), default=0)
    size = Column(Numeric(5, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="plots")
    crops = relationship("Crop", back_populates="plot", cascade="all, delete-orphan")
    sensors = relationship("Sensor", back_populates="plot", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Plot(id={self.id}, name={self.name})>"


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True)
    unity_crop_id = Column(String(100), unique=True)
    crop_type = Column(String(50), nullable=False)
    status = Column(String(20), default="planted")
    progress = Column(Integer, default=0)
    water_level = Column(Integer, default=50)
    fertilizer_level = Column(Integer, default=50)
    health = Column(Integer, default=100)
    planted_at = Column(DateTime(timezone=True), server_default=func.now())
    last_watered = Column(DateTime(timezone=True), server_default=func.now())
    expected_harvest = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    plot = relationship("Plot", back_populates="crops")
    harvests = relationship("Harvest", back_populates="crop")

    def __repr__(self):
        return f"<Crop(id={self.id}, type={self.crop_type}, status={self.status})>"


class Harvest(Base):
    __tablename__ = "harvests"

    id = Column(Integer, primary_key=True, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_type = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    experience_gained = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    crop = relationship("Crop", back_populates="harvests")
    user = relationship("User")

    def __repr__(self):
        return f"<Harvest(id={self.id}, quantity={self.quantity})>"
