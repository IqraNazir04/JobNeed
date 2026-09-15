from unittest.mock import MagicMock, patch

from app.scrapers.jobicy import JobicySource

FAKE_POSTING = {
    "id": 153312,
    "jobTitle": "Backend Engineer",
    "companyName": "Toptal",
    "jobGeo": "Canada, Europe",
    "jobDescription": "<p>Build our platform.</p>",
    "url": "https://jobicy.com/jobs/153312-backend-engineer",
}


def test_fetch_parses_a_posting():
    fake_response = MagicMock()
    fake_response.json.return_value = {"jobs": [FAKE_POSTING]}

    with patch("app.scrapers.jobicy.httpx.get", return_value=fake_response):
        jobs = JobicySource().fetch("")

    assert len(jobs) == 1
    job = jobs[0]
    assert job.id == "jobicy-153312"
    assert job.source == "jobicy"
    assert job.title == "Backend Engineer"
    assert job.company == "Toptal"
    assert job.description == "Build our platform."
    assert job.url == "https://jobicy.com/jobs/153312-backend-engineer"


def test_fetch_keeps_remote_in_the_location_alongside_the_region():
    fake_response = MagicMock()
    fake_response.json.return_value = {"jobs": [FAKE_POSTING]}

    with patch("app.scrapers.jobicy.httpx.get", return_value=fake_response):
        jobs = JobicySource().fetch("")

    assert jobs[0].location == "Remote (Canada, Europe)"


def test_fetch_defaults_to_plain_remote_when_no_region_given():
    posting = {**FAKE_POSTING, "jobGeo": ""}
    fake_response = MagicMock()
    fake_response.json.return_value = {"jobs": [posting]}

    with patch("app.scrapers.jobicy.httpx.get", return_value=fake_response):
        jobs = JobicySource().fetch("")

    assert jobs[0].location == "Remote"


def test_fetch_filters_by_query_against_title_and_description():
    other = {**FAKE_POSTING, "id": 999, "jobTitle": "Product Designer", "jobDescription": "<p>Design things.</p>"}
    fake_response = MagicMock()
    fake_response.json.return_value = {"jobs": [FAKE_POSTING, other]}

    with patch("app.scrapers.jobicy.httpx.get", return_value=fake_response):
        jobs = JobicySource().fetch("designer")

    assert len(jobs) == 1
    assert jobs[0].title == "Product Designer"


def test_fetch_respects_limit():
    postings = [{**FAKE_POSTING, "id": i} for i in range(5)]
    fake_response = MagicMock()
    fake_response.json.return_value = {"jobs": postings}

    with patch("app.scrapers.jobicy.httpx.get", return_value=fake_response):
        jobs = JobicySource().fetch("", limit=2)

    assert len(jobs) == 2
