"""Domain-specific exceptions translated into consistent API errors."""

from dataclasses import dataclass


@dataclass(slots=True)
class AppError(Exception):
    """Base application error carrying a user-safe message and status code."""

    message: str
    status_code: int = 400


class NotFoundError(AppError):
    """Raised when a requested resource does not exist."""

    def __init__(self, resource: str) -> None:
        super().__init__(message=f"{resource} was not found", status_code=404)
