from unittest.mock import patch

FAKE_RESULT = {
    "job_title": "Backend Engineer",
    "company": "Acme",
    "role_summary": "Backend role.",
    "questions": [
        {"question": "Describe a challenge.", "category": "Behavioral", "talking_points": ["Point A"]}
    ],
    "research_tips": ["Read their blog"],
}


def _fake_prep(*args, **kwargs):
    from app.schemas.interview import InterviewPrepResponse

    return InterviewPrepResponse(**FAKE_RESULT)


def test_prepare_requires_some_input(client):
    res = client.post("/api/interview/prepare", json={})
    assert res.status_code == 422


def test_prepare_with_unknown_job_id_404s(client):
    res = client.post("/api/interview/prepare", json={"job_id": "does-not-exist"})
    assert res.status_code == 404


def test_prepare_by_job_id(client):
    client.post("/api/jobs/ingest/sample")
    with patch("app.api.routes.interview.generate_interview_prep", side_effect=_fake_prep) as mock_gen:
        res = client.post("/api/interview/prepare", json={"job_id": "sample-2"})
    assert res.status_code == 200
    assert res.json()["job_title"] == "Backend Engineer"
    # confirm the real job row (not a stub) was passed through to generation
    called_job = mock_gen.call_args.kwargs["job"]
    assert called_job.id == "sample-2"


def test_prepare_by_query_uses_vector_retrieval(client):
    client.post("/api/jobs/ingest/sample")
    with (
        patch("app.api.routes.interview.retrieve_jobs") as mock_retrieve,
        patch("app.api.routes.interview.generate_interview_prep", side_effect=_fake_prep),
    ):
        from app.core.database import SessionLocal
        from app.models.job import Job

        db = SessionLocal()
        job = db.get(Job, "sample-1")
        mock_retrieve.return_value = [(job, 0.9)]
        db.close()

        res = client.post("/api/interview/prepare", json={"query": "python backend"})
    assert res.status_code == 200
    mock_retrieve.assert_called_once()


def test_prepare_by_query_with_no_matches_404s(client):
    with patch("app.api.routes.interview.retrieve_jobs", return_value=[]):
        res = client.post("/api/interview/prepare", json={"query": "nothing matches this"})
    assert res.status_code == 404


def test_prepare_returns_clean_502_when_model_output_is_unparseable(client):
    from app.rag.interview_prep import InterviewPrepError

    def _raise(*_args, **_kwargs):
        raise InterviewPrepError("boom")

    with patch("app.api.routes.interview.generate_interview_prep", side_effect=_raise):
        res = client.post(
            "/api/interview/prepare", json={"job_description": "We need an engineer."}
        )
    assert res.status_code == 502
    assert "try again" in res.json()["detail"].lower()


def test_prepare_by_raw_description(client):
    with patch(
        "app.api.routes.interview.generate_interview_prep", side_effect=_fake_prep
    ) as mock_gen:
        res = client.post(
            "/api/interview/prepare", json={"job_description": "We need an engineer."}
        )
    assert res.status_code == 200
    assert mock_gen.call_args.kwargs["job"] is None
    assert mock_gen.call_args.kwargs["raw_description"] == "We need an engineer."


def test_prepare_passes_cv_through(client):
    cv_payload = {
        "name": "Alex",
        "email": "",
        "phone": "",
        "location": "",
        "links": "",
        "summary": "",
        "experience": [],
        "education": [],
        "skills": ["Python"],
    }
    with patch(
        "app.api.routes.interview.generate_interview_prep", side_effect=_fake_prep
    ) as mock_gen:
        res = client.post(
            "/api/interview/prepare",
            json={"job_description": "We need an engineer.", "cv": cv_payload},
        )
    assert res.status_code == 200
    assert mock_gen.call_args.kwargs["cv"].name == "Alex"
