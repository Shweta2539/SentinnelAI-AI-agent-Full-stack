"""
auth.py
=======
Authentication routes: register, login, and "who am I".

POST /auth/register  - create a new user account
POST /auth/login      - exchange credentials for a JWT access token
GET  /auth/me         - return the currently authenticated user
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.database.database import get_db
from app.database.models import User
from app.database.schemas import UserRegister, UserLogin, UserOut, Token

from app.dependencies import get_current_user
from app.utils.responses import success_response, error_response
from app.utils.security import hash_password, verify_password, create_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user.

    Returns a JWT access token immediately so the client can log the user
    in right after registering, without a second round trip.
    """
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user is not None:
        return error_response(
            message="An account with this email already exists.",
            status_code=status.HTTP_409_CONFLICT,
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id)

    token_data = Token(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    return success_response(
        message="User registered successfully.",
        data={
            "user": UserOut.model_validate(user).model_dump(),
            "token": token_data.model_dump(),
        },
        status_code=status.HTTP_201_CREATED,
    )


@router.post("/login")
def login(
    payload: UserLogin,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == payload.email).first()

    if user is None or not verify_password(payload.password, user.password_hash):
        return error_response(
            message="Invalid email or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    access_token = create_access_token(subject=user.id)

    token_data = Token(
        access_token=access_token,
        expires_in_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    return success_response(
        message="Login successful.",
        data={
            "user": UserOut.model_validate(user).model_dump(),
            "token": token_data.model_dump(),
        },
    )


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user."""
    return success_response(
        message="Current user retrieved successfully.",
        data={"user": UserOut.model_validate(current_user).model_dump()},
    )
