"""
models.py
=========
SQLAlchemy ORM models for SentinelAI.

Relationships:
    User (1) ----> (many) Investigation
    Investigation (1) ----> (1) Report
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


def _uuid() -> str:
    """Generate a URL-safe unique identifier used as a primary key."""
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    """Timezone-aware UTC timestamp helper used for created_at defaults."""
    return datetime.now(timezone.utc)


class User(Base):
    """A registered SentinelAI user (analyst)."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    # One user has many investigations. Deleting a user cascades to their
    # investigations (and, transitively, to each investigation's report).
    investigations = relationship(
        "Investigation",
        back_populates="user",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Investigation(Base):
    """
    An uploaded log file and its metadata, representing one incident
    investigation. The actual AI-driven analysis is a future addition;
    for now this table simply tracks upload + lifecycle status.
    """

    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=_uuid, index=True)
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String, nullable=False)
    attack_type = Column(String, nullable=True)  # populated later by AI analysis
    severity = Column(String, nullable=True)  # e.g. low / medium / high / critical
    status = Column(String, nullable=False, default="uploaded")
    # Status lifecycle: uploaded -> investigating -> completed (or failed)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user = relationship("User", back_populates="investigations")

    # One investigation has exactly one report.
    report = relationship(
        "Report",
        back_populates="investigation",
        uselist=False,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Report(Base):
    """The generated report/findings tied to a single investigation."""

    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=_uuid, index=True)
    investigation_id = Column(
        String,
        ForeignKey("investigations.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # enforces the 1-to-1 relationship at the DB level
        index=True,
    )
    summary = Column(String, nullable=True)
    recommendations = Column(String, nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="report")
