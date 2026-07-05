"""
investigation.py
=================
Investigation lifecycle routes.

POST /investigate/{id}
    Runs the LangGraph multi-agent investigation (SOC Commander -> Log
    Intelligence -> Threat Hunter -> Threat Intelligence -> Incident
    Reporter) against the previously uploaded log file, persists the
    findings, and generates a Markdown report.

GET /history
    Returns all investigations belonging to the authenticated user.
"""

import os

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.ai.config import UPLOAD_DIR
from app.ai.graph import run_investigation
from app.ai.state import InvestigationState
from app.database.database import get_db
from app.database.models import User, Investigation, Report
from app.database.schemas import InvestigationOut
from app.dependencies import get_current_user
from app.utils.responses import success_response, error_response

router = APIRouter(tags=["Investigation"])


@router.post("/investigate/{investigation_id}")
def start_investigation(
    investigation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Kick off and run the AI investigation for a previously uploaded file.

    Steps:
        1. Validate the investigation exists and belongs to the caller.
        2. Load the uploaded file from disk.
        3. Execute the LangGraph multi-agent workflow (app/ai/graph.py).
        4. Persist findings (attack_type, severity, status) on the
           Investigation row and upsert its Report row.
        5. Return the findings as JSON.
    """
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

    file_path = os.path.join(UPLOAD_DIR, investigation.filename)

    investigation.status = "investigating"
    db.commit()

    initial_state: InvestigationState = {
        "investigation_id": investigation.id,
        "filename": investigation.filename,
        "file_path": file_path,
        "commander_notes": [],
    }

    final_state = run_investigation(initial_state)

    if final_state.get("error"):
        investigation.status = "failed"
        db.commit()
        return error_response(
            message=f"Investigation failed: {final_state['error']}",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            data={"investigation_id": investigation.id},
        )

    # --- Persist findings on the Investigation row -------------------------
    investigation.attack_type = final_state.get("attack_type", "None Detected")
    investigation.severity = final_state.get("severity", "low")
    investigation.status = "completed"

    # --- Upsert the associated Report row -----------------------------
    report = (
        db.query(Report)
        .filter(Report.investigation_id == investigation.id)
        .first()
    )
    if report is None:
        report = Report(investigation_id=investigation.id)
        db.add(report)

    report.summary = final_state.get("summary", "")
    report.recommendations = final_state.get("recommendations", "")
    # NOTE: `pdf_path` is the only report-file field defined in the current
    # schema; it is reused here to store the generated Markdown report's
    # path so no database model changes are required.
    report.pdf_path = final_state.get("report_path")

    db.commit()
    db.refresh(investigation)
    db.refresh(report)

    return success_response(
        message="Investigation completed.",
        data={
            "status": "Investigation Completed",
            "investigation": InvestigationOut.model_validate(investigation).model_dump(),
            "findings": {
                "attack_type": final_state.get("attack_type"),
                "severity": final_state.get("severity"),
                "threats_detected": final_state.get("threats_detected", []),
                "extracted_iocs": final_state.get("extracted_iocs", {}),
                "threat_intelligence": final_state.get("threat_intelligence", []),
                "summary": final_state.get("summary"),
                "recommendations": final_state.get("recommendations"),
                "report_path": final_state.get("report_path"),
            },
        },
    )


@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return every investigation owned by the authenticated user, newest first."""
    investigations = (
        db.query(Investigation)
        .filter(Investigation.user_id == current_user.id)
        .order_by(Investigation.created_at.desc())
        .all()
    )

    data = [
        InvestigationOut.model_validate(inv).model_dump() for inv in investigations
    ]

    return success_response(
        message="Investigation history retrieved successfully.",
        data={"investigations": data, "count": len(data)},
    )
