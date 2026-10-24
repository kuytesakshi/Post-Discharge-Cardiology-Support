import uuid

import jwt
from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.models import User
from app.schemas.auth import LoginRequest, RefreshRequest, TokenPair
from app.schemas.user import UserCreate, UserRead
from app.services import auth_service

router = APIRouter()


def build_token_pair(user: User) -> TokenPair:
    subject = str(user.id)
    return TokenPair(
        access_token=create_access_token(subject),
        refresh_token=create_refresh_token(subject),
    )


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
)
async def register(payload: UserCreate, db: DbSession) -> User:
    existing_user = await auth_service.get_user_by_email(db, payload.email)
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    try:
        return await auth_service.create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post("/login", response_model=TokenPair)
async def login(payload: LoginRequest, db: DbSession) -> TokenPair:
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return build_token_pair(user)


@router.post("/refresh", response_model=TokenPair)
async def refresh(payload: RefreshRequest, db: DbSession) -> TokenPair:
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise ValueError
        user_id = uuid.UUID(str(token_payload.get("sub")))
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        ) from None

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    return build_token_pair(user)


@router.get("/me", response_model=UserRead)
async def read_current_user(current_user: CurrentUser) -> User:
    return current_user
