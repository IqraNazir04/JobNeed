from unittest.mock import MagicMock, patch

import pytest

from app.core.config import settings
from app.scrapers.lever import LeverSource

FAKE_POSTING = {
    "id": "abc-123",
    "text": "Backend Engineer",
    "categories": {"location": "Remote", "team": "Engineering"},
    "descriptionPlain": "Build the postings API.",
    "hostedUrl": "https://jobs.lever.co/lever/abc-123",
}


def test_fetch_without_boards_raises(monkeypatch):
    monkeypatch.setattr(settings, "lever_boards", "")
    with pytest.raises(NotImplementedError):
        LeverSource().fetch("")


def test_fetch_parses_postings(monkeypatch):
    monkeypatch.setattr(settings, "lever_boards", "lever")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = [FAKE_POSTING]

    with patch("app.scrapers.lever.httpx.get", return_value=fake_response):
        jobs = LeverSource().fetch("")

    assert len(jobs) == 1
    job = jobs[0]
    assert job.id == "lever-abc-123"
    assert job.source == "lever"
    assert job.title == "Backend Engineer"
    assert job.company == "lever"
    assert job.location == "Remote"
    assert job.url == "https://jobs.lever.co/lever/abc-123"
    assert job.description == "Build the postings API."


def test_fetch_filters_by_query(monkeypatch):
    monkeypatch.setattr(settings, "lever_boards", "lever")

    fake_response = MagicMock()
    fake_response.status_code = 200
    fake_response.json.return_value = [
        FAKE_POSTING,
        {**FAKE_POSTING, "id": "xyz", "text": "Product Designer"},
    ]

    with patch("app.scrapers.lever.httpx.get", return_value=fake_response):
        jobs = LeverSource().fetch("designer")

    assert len(jobs) == 1
    assert jobs[0].title == "Product Designer"


def test_fetch_skips_404_boards(monkeypatch):
    monkeypatch.setattr(settings, "lever_boards", "nonexistent-co")

    fake_response = MagicMock()
    fake_response.status_code = 404

    with patch("app.scrapers.lever.httpx.get", return_value=fake_response):
        jobs = LeverSource().fetch("")

    assert jobs == []
