"""
schemas.py
==========
Pydantic schemas used for request validation and response serialization.

Keeping these separate from the SQLAlchemy models (models.py) means the
API's public contract is decoupled from the database's internal structure —
for example, `password_hash` exists on the User model but is intentionally
never exposed through any schema here.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =========================================================================
# Auth schemas
# =========================================================================

class UserRegister(BaseModel):
    """Payload for POST /auth/register"""

    name: str = Field(..., min_length=1, max_length=100, examples=["Jane Analyst"])
    email: EmailStr = Field(..., examples=["jane@sentinelai.dev"])
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    """Payload for POST /auth/login"""

    email: EmailStr
    password: str


class UserOut(BaseModel):
    """
    Public-facing representation of a User.
    Notably excludes `password_hash`.
    """

    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    created_at: datetime


class Token(BaseModel):
    """JWT access token payload returned on successful login/registration."""

    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class TokenPayload(BaseModel):
    """Decoded JWT contents used internally to identify the current user."""

    sub: Optional[str] = None  # subject == user id
    exp: Optional[int] = None


# =========================================================================
# Investigation schemas
# =========================================================================

class InvestigationOut(BaseModel):
    """Public representation of an Investigation record."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    filename: str
    attack_type: Optional[str] = None
    severity: Optional[str] = None
    status: str
    created_at: datetime


class InvestigationStartResponse(BaseModel):
    """Response body for POST /investigate/{id}."""

    status: str


# =========================================================================
# Report schemas
# =========================================================================

class ReportOut(BaseModel):
    """Public representation of a Report record."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    summary: Optional[str] = None
    recommendations: Optional[str] = None
    pdf_path: Optional[str] = None
    created_at: datetime


# =========================================================================
# Generic API envelope
# =========================================================================

class APIResponse(BaseModel):
    """
    Standard response envelope used across the entire API:

        {
            "success": true,
            "message": "...",
            "data": {}
        }
    """

    success: bool
    message: str
    data: Optional[dict] = None
