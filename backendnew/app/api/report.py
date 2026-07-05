"""
report.py
=========
Report retrieval routes.

GET /report/{id}
    Returns the report generated for a given investigation. Since CrewAI
    report generation is not implemented yet, this will return a 404 with
    a clear message until a Report row exists for the investigation.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User, Investigation, Report
from app.database.schemas import ReportOut
from app.dependencies import get_current_user
from app.utils.responses import success_response, error_response

router = APIRouter(tags=["Report"])


@router.get("/report/{investigation_id}")
def get_report(
    investigation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the report for a given investigation, if one exists."""

    # First confirm the investigation exists and belongs to this user, so
    # we never leak the existence of other users' data.
    investigation = (
        db.query(Investigation)
        .filter(
            Investigation.id == investigation_id,
            Investigation.user_id == current_user.id,
        )
        .first()
    )

    if investigation is None:
        return error_response(
            message="Investigation not found.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    report = (
        db.query(Report)
        .filter(Report.investigation_id == investigation_id)
        .first()
    )

    if report is None:
        return error_response(
            message="No report has been generated for this investigation yet.",
            status_code=status.HTTP_404_NOT_FOUND,
        )

    return success_response(
        message="Report retrieved successfully.",
        data={"report": ReportOut.model_validate(report).model_dump()},
    )
