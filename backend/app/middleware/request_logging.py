"""HTTP request logging middleware."""

from collections.abc import Awaitable, Callable
from time import perf_counter

import structlog
from fastapi import Request, Response

logger = structlog.get_logger(__name__)


async def request_logging_middleware(
    request: Request,
    call_next: Callable[[Request], Awaitable[Response]],
) -> Response:
    """Log each request with status code and elapsed time."""

    start_time = perf_counter()
    response = await call_next(request)
    elapsed_ms = round((perf_counter() - start_time) * 1000, 2)

    logger.info(
        "http_request_completed",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    return response
