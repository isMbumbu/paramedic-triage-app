"""Small local structlog stub for editors without backend dependencies installed."""

from typing import Any

class BoundLogger:
    """Minimal logger protocol used by this project."""

    def info(self, event: str | None = ..., **kwargs: Any) -> Any: ...
    def warning(self, event: str | None = ..., **kwargs: Any) -> Any: ...
    def exception(self, event: str | None = ..., **kwargs: Any) -> Any: ...


class _Processors:
    TimeStamper: Any
    add_log_level: Any
    JSONRenderer: Any


processors: _Processors


def configure(*args: Any, **kwargs: Any) -> None: ...


def get_logger(*args: Any, **kwargs: Any) -> BoundLogger: ...


def make_filtering_bound_logger(level: str | int) -> Any: ...
