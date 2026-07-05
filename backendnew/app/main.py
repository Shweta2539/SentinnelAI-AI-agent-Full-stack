"""
main.py
=======
Application entry point for the SentinelAI backend.

Responsibilities:
    - Create the FastAPI app with Swagger metadata
    - Configure CORS
    - Initialize the database on startup
    - Register all routers
    - Register global exception handlers so every error response follows
      the standard {"success": false, "message": "...", "data": null} shape
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.database.database import init_db
from app.utils.responses import error_response

from app.api import auth, upload, investigation, report

app = FastAPI(
    title="SentinelAI Backend",
    description="Cyber Incident Response Platform",
    version="1.0",
)

# --- CORS -------------------------------------------------------------
# Allows the future frontend (running on a different origin/port) to call
# this API directly from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    """Create database tables if they don't already exist."""
    init_db()


# --- Routers -------------------------------------------------------------
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(investigation.router)
app.include_router(report.router)


# --- Global exception handlers ------------------------------------------

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Catch every HTTPException raised anywhere in the app — including
    fastapi.HTTPException (e.g. from `get_current_user`) since it is a
    subclass of Starlette's, and unmatched-route 404s raised internally
    by Starlette's routing — and reshape them into the standard envelope.
    """
    return error_response(message=str(exc.detail), status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Catch Pydantic/FastAPI request validation errors (e.g. missing fields,
    invalid email format) and reshape them into the standard envelope.
    """
    # exc.errors() is not JSON-serializable as-is in every case (it can
    # contain exception objects); jsonable_encoder inside error_response
    # takes care of that safely.
    return error_response(
        message="Validation error.",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        data={"errors": exc.errors()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catch-all handler for any exception not otherwise handled, so the API
    never leaks a raw traceback or an inconsistent response shape to
    clients. The real exception is not exposed in the response body.
    """
    return error_response(
        message="An unexpected internal error occurred.",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


@app.get("/", tags=["Health"])
def health_check():
    """Simple health check / welcome endpoint."""
    return {
        "success": True,
        "message": "SentinelAI Backend is running.",
        "data": {"version": settings.APP_VERSION, "environment": settings.ENVIRONMENT},
    }
