from unittest.mock import MagicMock, patch

from app.scrapers.remoteok import RemoteOKSource

LEGAL_NOTICE = {"legal": "API Terms of Service: please link back..."}

FAKE_POSTING = {
    "id": "1137391",
    "epoch": 1700000000,
    "company": "Sleek",
    "position": "Backend Engineer",
    "tags": ["python", "backend"],
    "description": "<p>Build our payroll platform.</p>",
    "location": "",
    "url": "https://remoteok.com/remote-jobs/1137391",
    "apply_url": "https://remoteok.com/remote-jobs/1137391",
}


def test_fetch_skips_the_legal_notice_entry():
    fake_response = MagicMock()
    fake_response.json.return_value = [LEGAL_NOTICE, FAKE_POSTING]

    with patch("app.scrapers.remoteok.httpx.get", return_value=fake_response):
        jobs = RemoteOKSource().fetch("")

    assert len(jobs) == 1


def test_fetch_parses_a_posting():
    fake_response = MagicMock()
    fake_response.json.return_value = [LEGAL_NOTICE, FAKE_POSTING]

    with patch("app.scrapers.remoteok.httpx.get", return_value=fake_response):
        jobs = RemoteOKSource().fetch("")

    job = jobs[0]
    assert job.id == "remoteok-1137391"
    assert job.source == "remoteok"
    assert job.title == "Backend Engineer"
    assert job.company == "Sleek"
    assert job.description == "Build our payroll platform."
    assert job.url == "https://remoteok.com/remote-jobs/1137391"
    assert job.posted_at is not None


def test_fetch_defaults_blank_location_to_remote():
    fake_response = MagicMock()
    fake_response.json.return_value = [LEGAL_NOTICE, FAKE_POSTING]

    with patch("app.scrapers.remoteok.httpx.get", return_value=fake_response):
        jobs = RemoteOKSource().fetch("")

    assert jobs[0].location == "Remote"


def test_fetch_filters_by_query_against_title_description_and_tags():
    other_posting = {**FAKE_POSTING, "id": "999", "position": "Product Designer", "tags": ["design"]}
    fake_response = MagicMock()
    fake_response.json.return_value = [LEGAL_NOTICE, FAKE_POSTING, other_posting]

    with patch("app.scrapers.remoteok.httpx.get", return_value=fake_response):
        jobs = RemoteOKSource().fetch("designer")

    assert len(jobs) == 1
    assert jobs[0].title == "Product Designer"


def test_fetch_respects_limit():
    postings = [{**FAKE_POSTING, "id": str(i)} for i in range(5)]
    fake_response = MagicMock()
    fake_response.json.return_value = [LEGAL_NOTICE, *postings]

    with patch("app.scrapers.remoteok.httpx.get", return_value=fake_response):
        jobs = RemoteOKSource().fetch("", limit=2)

    assert len(jobs) == 2
