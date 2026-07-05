"""
responses.py
============
Helpers for building the standard SentinelAI JSON response envelope:

    Success -> {"success": true,  "message": "...", "data": {...}}
    Error   -> {"success": false, "message": "...", "data": null}

Using these helpers everywhere guarantees every endpoint returns a
consistent shape, regardless of what it does internally.
"""

from typing import Any, Optional

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def success_response(
    message: str = "Success",
    data: Optional[Any] = None,
    status_code: int = 200,
) -> JSONResponse:
    """Build a standard success envelope.

    `jsonable_encoder` transparently handles Pydantic models, ORM objects
    (via `from_attributes`), datetimes, etc., so callers can pass rich
    Python objects instead of manually converting to plain dicts.
    """
    return JSONResponse(
        status_code=status_code,
        content={"success": True, "message": message, "data": jsonable_encoder(data)},
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = 400,
    data: Optional[Any] = None,
) -> JSONResponse:
    """Build a standard error envelope."""
    return JSONResponse(
        status_code=status_code,
        content={"success": False, "message": message, "data": jsonable_encoder(data)},
    )
