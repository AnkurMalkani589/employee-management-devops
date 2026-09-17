"""Structured logging configuration.

Emits a consistent log line on stdout so Docker / systemd / CloudWatch can
collect logs without any extra agent. Format is intentionally simple and
greppable, and includes the request id when one is bound to the context.
"""

import logging
import sys

from app.config import get_settings


class _ContextFilter(logging.Filter):
    """Inject a request id placeholder when the record has none."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003
        if not hasattr(record, "request_id"):
            record.request_id = "-"
        return True


def configure_logging() -> None:
    """Configure root logging to a single stdout stream handler."""
    settings = get_settings()
    level = getattr(logging, settings.log_level.upper(), logging.INFO)

    handler = logging.StreamHandler(sys.stdout)
    handler.addFilter(_ContextFilter())
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | req=%(request_id)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)

    root = logging.getLogger()
    root.handlers.clear()
    root.addHandler(handler)
    root.setLevel(level)

    # Silence the noisy access log duplicated by our middleware.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a module-level logger."""
    return logging.getLogger(name)
