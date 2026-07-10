"""Dependency providers used by FastAPI routes."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.repositories.triage import TriageRepository
from app.services.triage import TriageService


def get_triage_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TriageService:
    """Build a triage service for the current request."""

    return TriageService(TriageRepository(session))
