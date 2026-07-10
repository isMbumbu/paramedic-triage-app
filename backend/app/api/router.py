"""Top-level API router composition."""

from fastapi import APIRouter

from app.api.routes.triage import router as triage_router

api_router = APIRouter()
api_router.include_router(triage_router)
api_router.include_router(triage_router, prefix="/api/v1")
