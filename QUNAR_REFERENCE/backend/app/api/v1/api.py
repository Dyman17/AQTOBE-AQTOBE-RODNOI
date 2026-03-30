"""
QUNAR API Router
Combines all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import admin as admin_bootstrap
from app.api.v1.endpoints import auth, users, farms, plants, sensors, logs

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# User profile endpoints
api_router.include_router(users.router, prefix="/users", tags=["Users"])

# Farm management endpoints
api_router.include_router(farms.router, prefix="/farms", tags=["Farms"])

# Plants/crops endpoints
api_router.include_router(plants.router, prefix="/plants", tags=["Plants"])

# Sensors endpoints
api_router.include_router(sensors.router, prefix="/sensors", tags=["Sensors"])

# Activity logs endpoints (admin only)
api_router.include_router(logs.router, prefix="/logs", tags=["Logs"])

# Admin bootstrap endpoint (one-time)
api_router.include_router(admin_bootstrap.router, prefix="/admin", tags=["Admin"])
