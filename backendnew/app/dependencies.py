"""
dependencies.py
================
Shared FastAPI dependencies, most importantly `get_current_user`, which
protects routes by requiring and validating a JWT bearer token.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.utils.security import decode_access_token

# tokenUrl is only used by Swagger UI to know where to send login requests
# from the "Authorize" button — it does not affect actual token validation.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Resolve the currently authenticated user from a JWT bearer token.

    Raises:
        HTTPException 401 if the token is missing, invalid, expired, or if
        no matching user exists (e.g. the account was deleted after the
        token was issued).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception

    return user
