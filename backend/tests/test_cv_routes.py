from app.schemas.cv import CoverLetterResponse


def test_get_cv_requires_auth(client):
    res = client.get("/api/cv")
    assert res.status_code == 401


def test_tailor_requires_auth(client):
    res = client.post(
        "/api/cv/tailor",
        json={
            "cv": {"name": "", "email": "", "phone": "", "location": "", "links": "",
                   "summary": "", "experience": [], "education": [], "skills": []},
            "job_description": "Backend engineer role.",
        },
    )
    assert res.status_code == 401


def test_tailor_returns_clean_502_when_model_output_is_unparseable(client, auth_headers, monkeypatch):
    from app.rag.cv_tailor import TailorCVError

    def _raise(*_args, **_kwargs):
        raise TailorCVError("boom")

    monkeypatch.setattr("app.api.routes.cv.tailor_cv", _raise)

    res = client.post(
        "/api/cv/tailor",
        json={
            "cv": {"name": "", "email": "", "phone": "", "location": "", "links": "",
                   "summary": "", "experience": [], "education": [], "skills": []},
            "job_description": "Backend engineer role.",
        },
        headers=auth_headers,
    )
    assert res.status_code == 502
    assert "try again" in res.json()["detail"].lower()


def test_cover_letter_requires_auth(client):
    res = client.post(
        "/api/cv/cover-letter",
        json={
            "cv": {"name": "", "email": "", "phone": "", "location": "", "links": "",
                   "summary": "", "experience": [], "education": [], "skills": []},
            "job_description": "Backend engineer role.",
        },
    )
    assert res.status_code == 401


def test_get_cv_before_saving_returns_empty_cv(client, auth_headers):
    res = client.get("/api/cv", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == ""
    assert res.json()["skills"] == []


def test_get_cv_before_saving_prefills_email_from_account(client, auth_headers):
    res = client.get("/api/cv", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "user@example.com"


def test_cover_letter_passes_connected_profiles_as_context(client, auth_headers, monkeypatch):
    from unittest.mock import MagicMock

    from app.schemas.auth import GithubStats

    client.patch(
        "/api/auth/profile",
        json={
            "linkedin_url": "https://linkedin.com/in/alex",
            "indeed_url": "",
            "upwork_url": "",
            "github_username": "octocat",
        },
        headers=auth_headers,
    )

    fake_stats = GithubStats(
        username="octocat",
        top_languages=["Python", "Go"],
        profile_url="https://github.com/octocat",
    )
    mock_fetch = MagicMock(return_value=fake_stats)
    monkeypatch.setattr("app.api.routes.cv.fetch_github_stats", mock_fetch)

    mock_generate = MagicMock(return_value=CoverLetterResponse(cover_letter="body"))
    monkeypatch.setattr("app.api.routes.cv.generate_cover_letter", mock_generate)

    res = client.post(
        "/api/cv/cover-letter",
        json={
            "cv": {"name": "", "email": "", "phone": "", "location": "", "links": "",
                   "summary": "", "experience": [], "education": [], "skills": []},
            "job_description": "Backend engineer role.",
        },
        headers=auth_headers,
    )
    assert res.status_code == 200

    mock_fetch.assert_called_once_with("octocat")
    profile_context = mock_generate.call_args.args[4]
    assert "linkedin.com/in/alex" in profile_context
    assert "github.com/octocat" in profile_context
    assert "Python, Go" in profile_context


def test_save_and_get_cv_round_trips(client, auth_headers):
    cv_payload = {
        "name": "Alex Rivera",
        "email": "alex@example.com",
        "phone": "",
        "location": "",
        "links": "",
        "summary": "Backend engineer.",
        "experience": [
            {"title": "Engineer", "company": "Acme", "dates": "2020-2023", "bullets": ["Shipped things"]}
        ],
        "education": [],
        "skills": ["Python", "SQL"],
    }
    res = client.put("/api/cv", json=cv_payload, headers=auth_headers)
    assert res.status_code == 200

    res = client.get("/api/cv", headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Alex Rivera"
    assert body["skills"] == ["Python", "SQL"]
    assert body["experience"][0]["company"] == "Acme"


def test_cv_is_per_user(client):
    token_a = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "testpass1"}
    ).json()["access_token"]
    token_b = client.post(
        "/api/auth/register", json={"email": "b@example.com", "password": "testpass1"}
    ).json()["access_token"]

    client.put(
        "/api/cv",
        json={"name": "A's CV", "email": "", "phone": "", "location": "", "links": "",
              "summary": "", "experience": [], "education": [], "skills": []},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    res_a = client.get("/api/cv", headers={"Authorization": f"Bearer {token_a}"})
    res_b = client.get("/api/cv", headers={"Authorization": f"Bearer {token_b}"})
    assert res_a.json()["name"] == "A's CV"
    assert res_b.json()["name"] == ""
