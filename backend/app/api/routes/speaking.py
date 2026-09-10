from fastapi import APIRouter, HTTPException

from app.rag.speaking_coach import get_speaking_feedback
from app.schemas.speaking import SpeakingFeedbackRequest, SpeakingFeedbackResponse

router = APIRouter(prefix="/speaking", tags=["speaking"])


@router.post("/feedback", response_model=SpeakingFeedbackResponse)
def feedback(payload: SpeakingFeedbackRequest):
    if not payload.transcript.strip():
        raise HTTPException(
            status_code=422, detail="No speech was transcribed — try recording again."
        )
    return get_speaking_feedback(payload.question, payload.transcript)
