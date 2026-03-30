"""
QUNAR Sensor Models
"""

from sqlalchemy import Boolean, Column, Integer, String, DateTime, Numeric, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.db import Base


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    plot_id = Column(Integer, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True)
    unity_sensor_id = Column(String(100), unique=True)
    sensor_type = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    location_x = Column(Numeric(10, 6), default=0)
    location_y = Column(Numeric(10, 6), default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    plot = relationship("Plot", back_populates="sensors")
    data = relationship("SensorData", back_populates="sensor", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Sensor(id={self.id}, type={self.sensor_type})>"


class SensorData(Base):
    __tablename__ = "sensor_data"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id", ondelete="CASCADE"), nullable=False, index=True)
    value = Column(Numeric(10, 4), nullable=False)
    unit = Column(String(20), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    sensor = relationship("Sensor", back_populates="data")

    def __repr__(self):
        return f"<SensorData(id={self.id}, value={self.value})>"

