from unittest.mock import patch

FAKE_RESULT = {
    "overall_score": 8,
    "strengths": ["Clear and concise"],
    "grammar_notes": [],
    "filler_word_count": 1,
    "vocabulary_suggestions": ["Try a stronger verb than 'did'"],
    "improved_answer": "I led the migration project end to end.",
}


def _fake_feedback(*args, **kwargs):
    from app.schemas.speaking import SpeakingFeedbackResponse

    return SpeakingFeedbackResponse(**FAKE_RESULT)


def test_feedback_rejects_empty_transcript(client):
    res = client.post(
        "/api/speaking/feedback", json={"question": "Tell me about yourself.", "transcript": ""}
    )
    assert res.status_code == 422


def test_feedback_rejects_whitespace_only_transcript(client):
    res = client.post(
        "/api/speaking/feedback", json={"question": "Tell me about yourself.", "transcript": "   "}
    )
    assert res.status_code == 422


def test_feedback_returns_clean_502_when_model_output_is_unparseable(client):
    from app.rag.speaking_coach import SpeakingFeedbackError

    def _raise(*_args, **_kwargs):
        raise SpeakingFeedbackError("boom")

    with patch("app.api.routes.speaking.get_speaking_feedback", side_effect=_raise):
        res = client.post(
            "/api/speaking/feedback",
            json={"question": "Tell me about yourself.", "transcript": "I did the migration."},
        )
    assert res.status_code == 502
    assert "try again" in res.json()["detail"].lower()


def test_feedback_returns_analysis(client):
    with patch("app.api.routes.speaking.get_speaking_feedback", side_effect=_fake_feedback):
        res = client.post(
            "/api/speaking/feedback",
            json={"question": "Tell me about yourself.", "transcript": "I did the migration."},
        )
    assert res.status_code == 200
    body = res.json()
    assert body["overall_score"] == 8
    assert body["improved_answer"] == "I led the migration project end to end."
