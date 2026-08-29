from fastapi.responses import JSONResponse

from app.core.logging import log_event
from app.lib.llm.errors import TextGenerationError
from app.modules.text_generation.schemas import TextGenerationErrorResponse


def llm_error_response(
    error: Exception, fallback: str, service: str
) -> JSONResponse:
    log_event(
        "error",
        service,
        "request.failed",
        {"errorMessage": str(error), "errorName": type(error).__name__},
    )

    if not isinstance(error, TextGenerationError):
        return JSONResponse({"error": fallback}, status_code=500)

    body = TextGenerationErrorResponse(
        code=error.code,
        error=error.message,
        provider_id=error.provider_id,
        provider_model_id=error.provider_model_id,
    )
    return JSONResponse(
        body.model_dump(by_alias=True, exclude_none=True), status_code=error.status
    )
