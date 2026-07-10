from dataclasses import dataclass


@dataclass(slots=True)
class AppError(Exception):
    message: str
    status_code: int = 400


class NotFoundError(AppError):
    def __init__(self, resource: str) -> None:
        super().__init__(message=f"{resource} was not found", status_code=404)
