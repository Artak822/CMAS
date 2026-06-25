import time

from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

REQUESTS_TOTAL = Counter(
    "cmas_requests_total",
    "Общее количество HTTP запросов",
    ["service", "method", "path", "status"],
)

REQUEST_DURATION = Histogram(
    "cmas_request_duration_seconds",
    "Время обработки HTTP запроса в секундах",
    ["service", "method", "path"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
)


class MetricsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, service_name: str):
        super().__init__(app)
        self.service_name = service_name

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start

        path = request.url.path
        method = request.method
        status = str(response.status_code)

        REQUESTS_TOTAL.labels(
            service=self.service_name,
            method=method,
            path=path,
            status=status,
        ).inc()

        REQUEST_DURATION.labels(
            service=self.service_name,
            method=method,
            path=path,
        ).observe(duration)

        return response
