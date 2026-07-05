"""
upload.py
=========
Handles uploading cybersecurity log files.

POST /upload
    - Validates file extension (.txt, .csv, .log)
    - Validates file size (<= MAX_UPLOAD_SIZE_MB)
    - Stores the file on disk under uploads/ with a unique filename
    - Creates an Investigation record tied to the authenticated user
    - Returns the new Investigation's id
"""

import os
import uuid

from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database.database import get_db
from app.database.models import User, Investigation
from app.database.schemas import InvestigationOut
from app.dependencies import get_current_user
from app.utils.responses import success_response, error_response

router = APIRouter(tags=["Upload"])

# Resolve the uploads directory relative to the backend/ root regardless of
# the current working directory the server is launched from.
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(_BACKEND_ROOT, settings.UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _get_extension(filename: str) -> str:
    """Return the lowercase file extension including the leading dot."""
    return os.path.splitext(filename)[1].lower()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_log_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a log file and create a corresponding Investigation record."""

    # --- Validate filename / extension -----------------------------------
    if not file.filename:
        return error_response(
            message="Uploaded file must have a filename.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    extension = _get_extension(file.filename)
    if extension not in settings.ALLOWED_UPLOAD_EXTENSIONS:
        allowed = ", ".join(settings.ALLOWED_UPLOAD_EXTENSIONS)
        return error_response(
            message=f"Unsupported file type '{extension}'. Allowed types: {allowed}.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # --- Read + validate size ----------------------------------------------
    # Read the full file into memory to check its size. For a hackathon-scale
    # 10MB cap this is fine; a production system would stream and check
    # incrementally instead.
    contents = await file.read()
    if len(contents) > settings.MAX_UPLOAD_SIZE_BYTES:
        return error_response(
            message=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
        )

    if len(contents) == 0:
        return error_response(
            message="Uploaded file is empty.",
            status_code=status.HTTP_400_BAD_REQUEST,
        )

    # --- Generate a unique filename and persist to disk ---------------------
    unique_filename = f"{uuid.uuid4().hex}{extension}"
    destination_path = os.path.join(UPLOAD_DIR, unique_filename)

    try:
        with open(destination_path, "wb") as out_file:
            out_file.write(contents)
    except OSError:
        return error_response(
            message="Failed to save uploaded file on the server.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # --- Create the Investigation record -------------------------------
    # NOTE: We store the unique on-disk filename (not the original) in the
    # `filename` column. This is the only file-reference field defined in
    # the schema, and using the unique name lets future stages (CrewAI
    # investigation, report generation) reliably locate the file on disk
    # without needing a separate "stored_filename" column.
    

    investigation = Investigation(
        user_id=current_user.id,
        filename=unique_filename,
        status="uploaded",
    )
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    print("Investigation saved:", investigation.id)

    return success_response(
        message="File uploaded successfully.",
        data={"investigation": InvestigationOut.model_validate(investigation).model_dump()},
        status_code=status.HTTP_201_CREATED,
    )
