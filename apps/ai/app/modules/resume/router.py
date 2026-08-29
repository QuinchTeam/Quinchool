from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.modules.resume.schemas import TailoredResume, TailorResumeRequest
from app.modules.resume.service import UnreadableTailorReplyError, tailor_resume
from app.modules.text_generation.error_response import llm_error_response

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post(
    "/tailor", response_model=TailoredResume, response_model_by_alias=True
)
async def tailor(request: TailorResumeRequest):
    try:
        return await tailor_resume(request)
    except UnreadableTailorReplyError as error:
        return JSONResponse({"error": str(error)}, status_code=502)
    except Exception as error:  # noqa: BLE001 - every failure becomes a response
        return llm_error_response(error, "Failed to build resume", "resume")
