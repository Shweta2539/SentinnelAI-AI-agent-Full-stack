"""
database.py
============
SQLAlchemy engine, session factory, and declarative base for SentinelAI.

This module is the single source of truth for database connectivity.
All models inherit from `Base`, and all routes obtain a session through
the `get_db` dependency.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# SQLite requires `check_same_thread=False` when used with FastAPI, because
# FastAPI can handle requests using multiple threads while SQLite's default
# driver only allows a connection to be used by the thread that created it.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
)

# Each instance of SessionLocal is a database session. The class itself is
# not a session yet — it becomes one when instantiated.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class that all ORM models will inherit from.
Base = declarative_base()


def init_db() -> None:
    """
    Create all database tables.

    This is called once on application startup. Since we are using SQLite
    for a hackathon-scale project, we rely on `create_all` instead of a full
    migration system like Alembic.
    """
    # Import models here (not at module top-level) to avoid circular imports
    # while still ensuring they are registered on Base's metadata before
    # create_all() is called.
    from app.database import models  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db():
    """
    FastAPI dependency that yields a database session and guarantees it is
    closed after the request finishes, even if an exception is raised.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
