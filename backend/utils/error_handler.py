"""
utils/error_handler.py — Centralised exception handling utilities.
"""

import json
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse


async def global_exception_handler(request: Request, exc: Exception):
    """
    Global FastAPI exception handler.
    Register in main.py with: app.add_exception_handler(Exception, global_exception_handler)
    """
    tb = traceback.format_exc()
    return JSONResponse(
        status_code=500,
        content={
            "detail": f"Internal server error: {str(exc)}",
            "path":   str(request.url),
        },
    )


class AIServiceError(Exception):
    """Raised when an AI service call fails."""
    def __init__(self, service: str, message: str):
        self.service = service
        self.message = message
        super().__init__(f"[{service}] {message}")


class ValidationError(Exception):
    """Raised when input validation fails."""
    pass


def safe_json_parse(raw: str, fallback: dict = None) -> dict:
    """
    Safely parse JSON string. Returns fallback dict on failure.
    """
    if fallback is None:
        fallback = {}
    try:
        clean = raw.strip()
        if clean.startswith("```"):
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
        return json.loads(clean.strip())
    except (json.JSONDecodeError, IndexError):
        return fallback