"""
QUNAR Full Stack - Production-ready FastAPI backend
Based on FastAPI full-stack template with production improvements
"""

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging
import sys
from sqlalchemy import text

from app.core.config import settings
from app.core.db import engine, SessionLocal
from app.models import Base
from app.api.v1.api import api_router
from app.api.admin.db_admin import router as admin_router
from app.api.v1.endpoints.auth import (
    RateLimitExceeded,
    limiter as auth_limiter,
    rate_limit_exceeded_handler,
)

# Configure production logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("qunar.log")
    ]
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up QUNAR API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.POSTGRES_SERVER}")
    
    logger.info("Ensuring database schema")
    Base.metadata.create_all(bind=engine)
    
    yield
    
    # Shutdown
    logger.info("Shutting down QUNAR API...")
    SessionLocal.close_all()

app = FastAPI(
    title="QUNAR API",
    description="Production-ready farming API",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

app.state.limiter = auth_limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# Set all CORS enabled origins
cors_origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
allow_credentials = True
if not cors_origins and settings.ENVIRONMENT.lower() in {"development", "dev"}:
    cors_origins = ["*"]
    allow_credentials = False

if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log slow requests
    if process_time > 1.0:
        logger.warning(f"Slow request: {request.method} {request.url.path} took {process_time:.2f}s")
    
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"Response: {response.status_code} in {process_time:.3f}s")
    
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if exc.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
        logger.warning(f"Auth error: {request.method} {request.url.path} -> {exc.status_code}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(admin_router)

@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers and monitoring"""
    try:
        # Test database connection
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        return {
            "status": "healthy",
            "project": "QUNAR",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": "Database connection failed"}
        )

@app.get("/")
async def root():
    return {
        "message": "QUNAR Farming API",
        "docs": "/docs",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Production server configuration
if __name__ == "__main__":
    import uvicorn
    
    # Development server
    if settings.ENVIRONMENT == "development":
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    else:
        # Production configuration (use gunicorn instead)
        logger.warning("Production mode - use gunicorn instead of uvicorn directly")
        logger.info("Command: gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker")
