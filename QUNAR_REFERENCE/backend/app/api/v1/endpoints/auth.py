"""
QUNAR Authentication Endpoints
"""

from datetime import datetime, timedelta
import hashlib
import logging
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from pydantic import ValidationError
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.activity import log_activity
from app.core.config import settings
from app.models.auth import PasswordResetToken, RefreshToken as RefreshTokenModel
from app.models.user import User, UserStats
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshToken,
    RefreshTokenRequest,
    ResetPasswordRequest,
    Token,
    User as UserSchema,
    UserCreate,
)

logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Too many requests. Please try again later."},
    )


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not payload.get("sub") or not payload.get("jti"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return payload


def _build_access_token(user: User) -> str:
    scopes = ["admin"] if user.is_superuser else ["user"]
    return security.create_access_token(data={"sub": user.email, "scopes": scopes})


@router.post("/register", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(
    request: Request,
    user_in: UserCreate,
    db: Session = Depends(deps.get_db),
) -> User:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )

    db_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        subscription_type=user_in.subscription_type or "basic",
        is_active=True,
    )
    db.add(db_user)
    db.flush()
    db.add(UserStats(user_id=db_user.id))
    log_activity(
        db,
        user_id=db_user.id,
        action="auth.register",
        resource_type="user",
        resource_id=db_user.id,
        request=request,
    )
    db.commit()
    db.refresh(db_user)

    logger.info("User registered: %s", db_user.email)
    return db_user


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login_for_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
) -> Token:
    email: str | None = None
    password: str | None = None

    content_type = (request.headers.get("content-type") or "").lower()
    if "application/json" in content_type:
        try:
            payload = LoginRequest.model_validate(await request.json())
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=exc.errors(),
            ) from exc
        email = payload.email
        password = payload.password
    else:
        form_data = await request.form()
        email = form_data.get("username") or form_data.get("email")
        password = form_data.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email and password are required",
        )

    user = db.query(User).filter(User.email == email).first()
    if not user or not security.verify_password(password, user.hashed_password):
        logger.warning("Failed login attempt: %s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    refresh_jti = uuid.uuid4().hex
    refresh_expiry = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    refresh_token = security.create_refresh_token(
        data={"sub": user.email, "jti": refresh_jti},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    access_token = _build_access_token(user)

    db.add(
        RefreshTokenModel(
            user_id=user.id,
            jti=refresh_jti,
            expires_at=refresh_expiry,
            user_agent=request.headers.get("user-agent"),
            ip_address=get_remote_address(request),
        )
    )
    user.last_login = datetime.utcnow()
    log_activity(
        db,
        user_id=user.id,
        action="auth.login",
        resource_type="user",
        resource_id=user.id,
        request=request,
    )
    db.commit()

    logger.info("User logged in: %s", user.email)
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=RefreshToken)
@limiter.limit("20/minute")
async def refresh_access_token(
    request: Request,
    payload: RefreshTokenRequest,
    db: Session = Depends(deps.get_db),
) -> RefreshToken:
    token_payload = _decode_refresh_token(payload.refresh_token)
    email = token_payload["sub"]
    jti = token_payload["jti"]

    user = db.query(User).filter(User.email == email, User.is_active.is_(True)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    token_row = (
        db.query(RefreshTokenModel)
        .filter(
            RefreshTokenModel.user_id == user.id,
            RefreshTokenModel.jti == jti,
            RefreshTokenModel.revoked.is_(False),
        )
        .first()
    )
    if not token_row or token_row.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired or revoked",
        )

    log_activity(
        db,
        user_id=user.id,
        action="auth.refresh",
        resource_type="refresh_token",
        resource_id=token_row.id,
        request=request,
    )
    db.commit()

    return RefreshToken(
        access_token=_build_access_token(user),
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/logout", response_model=MessageResponse)
@limiter.limit("10/minute")
async def logout(
    request: Request,
    payload: LogoutRequest,
    current_user: User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db),
) -> MessageResponse:
    token_payload = _decode_refresh_token(payload.refresh_token)
    if token_payload.get("sub") != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Refresh token does not belong to current user",
        )

    token_row = (
        db.query(RefreshTokenModel)
        .filter(
            RefreshTokenModel.user_id == current_user.id,
            RefreshTokenModel.jti == token_payload["jti"],
            RefreshTokenModel.revoked.is_(False),
        )
        .first()
    )
    if token_row:
        token_row.revoked = True
        token_row.revoked_at = datetime.utcnow()

    log_activity(
        db,
        user_id=current_user.id,
        action="auth.logout",
        resource_type="refresh_token",
        resource_id=token_row.id if token_row else None,
        request=request,
    )
    db.commit()

    logger.info("User logged out: %s", current_user.email)
    return MessageResponse(message="Successfully logged out")


@router.post("/test-token", response_model=UserSchema)
async def test_token(current_user: User = Depends(deps.get_current_user)) -> User:
    return current_user


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    payload: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db),
) -> ForgotPasswordResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    response_message = "If the email exists, a reset link has been sent"
    if not user:
        return ForgotPasswordResponse(message=response_message)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used.is_(False),
    ).update(
        {
            PasswordResetToken.used: True,
            PasswordResetToken.used_at: datetime.utcnow(),
        },
        synchronize_session=False,
    )

    reset_token = secrets.token_urlsafe(48)
    reset_token_row = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_token(reset_token),
        expires_at=datetime.utcnow() + timedelta(minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        user_agent=request.headers.get("user-agent"),
        ip_address=get_remote_address(request),
    )
    db.add(reset_token_row)

    log_activity(
        db,
        user_id=user.id,
        action="auth.forgot_password",
        resource_type="password_reset_token",
        request=request,
    )
    db.commit()

    logger.info("Password reset requested for: %s", user.email)
    if settings.ENVIRONMENT.lower() in {"development", "test"}:
        return ForgotPasswordResponse(message=response_message, reset_token=reset_token)
    return ForgotPasswordResponse(message=response_message)


@router.post("/reset-password", response_model=MessageResponse)
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    payload: ResetPasswordRequest,
    db: Session = Depends(deps.get_db),
) -> MessageResponse:
    now = datetime.utcnow()
    token_row = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash == _hash_token(payload.token),
            PasswordResetToken.used.is_(False),
        )
        .first()
    )
    if not token_row or token_row.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    user = db.query(User).filter(User.id == token_row.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.hashed_password = security.get_password_hash(payload.new_password)
    token_row.used = True
    token_row.used_at = now

    db.query(RefreshTokenModel).filter(
        RefreshTokenModel.user_id == user.id,
        RefreshTokenModel.revoked.is_(False),
    ).update(
        {
            RefreshTokenModel.revoked: True,
            RefreshTokenModel.revoked_at: now,
        },
        synchronize_session=False,
    )

    log_activity(
        db,
        user_id=user.id,
        action="auth.reset_password",
        resource_type="password_reset_token",
        resource_id=token_row.id,
        request=request,
    )
    db.commit()

    return MessageResponse(message="Password reset successfully")
