from unittest.mock import patch


def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_ingest_sample_and_list(client):
    res = client.post("/api/jobs/ingest/sample")
    assert res.status_code == 200
    assert len(res.json()) == 3

    res = client.get("/api/jobs")
    assert res.status_code == 200
    assert len(res.json()) == 3


def test_get_job_by_id(client):
    client.post("/api/jobs/ingest/sample")
    res = client.get("/api/jobs/sample-2")
    assert res.status_code == 200
    assert res.json()["title"] == "React Frontend Contractor"


def test_get_job_404_for_unknown_id(client):
    res = client.get("/api/jobs/does-not-exist")
    assert res.status_code == 404


def test_ingest_unknown_source_returns_404(client):
    res = client.post("/api/jobs/ingest/not-a-real-source")
    assert res.status_code == 404


def test_ingest_unconfigured_source_returns_400(client):
    from unittest.mock import patch

    from app.core.config import settings

    with patch.object(settings, "lever_boards", ""):
        res = client.post("/api/jobs/ingest/lever")
    assert res.status_code == 400


def test_import_url_persists_job(client):
    from unittest.mock import patch

    from app.scrapers.base import RawJob

    fake_job = RawJob(
        id="url-abc123",
        source="url_import",
        title="Backend Engineer",
        company="Acme",
        location="Remote",
        description="Ship things.",
        url="https://acme.example/careers/backend-engineer",
    )
    with patch("app.api.routes.jobs.fetch_from_url", return_value=fake_job):
        res = client.post(
            "/api/jobs/import-url",
            json={"url": "https://acme.example/careers/backend-engineer"},
        )
    assert res.status_code == 200
    assert res.json()["id"] == "url-abc123"

    res = client.get("/api/jobs/url-abc123")
    assert res.status_code == 200


def test_import_url_returns_422_when_page_has_no_title(client):
    with patch("app.api.routes.jobs.fetch_from_url", side_effect=ValueError("no title")):
        res = client.post("/api/jobs/import-url", json={"url": "https://example.com/x"})
    assert res.status_code == 422


def test_import_url_returns_400_on_unreachable_url(client):
    import httpx

    with patch(
        "app.api.routes.jobs.fetch_from_url",
        side_effect=httpx.ConnectError("boom"),
    ):
        res = client.post("/api/jobs/import-url", json={"url": "https://example.com/x"})
    assert res.status_code == 400
