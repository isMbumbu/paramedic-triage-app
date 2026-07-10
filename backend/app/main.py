"""FastAPI application factory for the triage backend."""

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging
from app.middleware.request_logging import request_logging_middleware

logger = structlog.get_logger(__name__)


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""

    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(title=settings.app_name)
    app.middleware("http")(request_logging_middleware)
    app.include_router(api_router)

    @app.get("/health", tags=["health"])
    async def health() -> dict[str, str]:
        """Return a lightweight health check response."""

        return {"status": "ok"}

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        """Convert domain errors into consistent JSON API responses."""

        logger.warning(
            "application_error",
            message=exc.message,
            status_code=exc.status_code,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_: Request, exc: Exception) -> JSONResponse:
        """Log unexpected errors and return a safe API response."""

        logger.exception("unhandled_application_error", error=str(exc))
        return JSONResponse(
            status_code=500,
            content={"error": {"message": "Internal server error"}},
        )

    return app


app = create_app()
