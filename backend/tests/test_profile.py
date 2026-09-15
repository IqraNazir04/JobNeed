from unittest.mock import MagicMock, patch


def test_new_user_has_empty_profile_fields(client, auth_headers):
    res = client.get("/api/auth/me", headers=auth_headers)
    body = res.json()
    assert body["linkedin_url"] == ""
    assert body["indeed_url"] == ""
    assert body["upwork_url"] == ""
    assert body["github_username"] == ""


def test_update_profile_requires_auth(client):
    res = client.patch("/api/auth/profile", json={"linkedin_url": "https://linkedin.com/in/x"})
    assert res.status_code == 401


def test_update_profile_round_trips(client, auth_headers):
    payload = {
        "linkedin_url": "https://linkedin.com/in/alex",
        "indeed_url": "https://indeed.com/r/alex",
        "upwork_url": "https://upwork.com/freelancers/~alex",
        "github_username": "octocat",
    }
    res = client.patch("/api/auth/profile", json=payload, headers=auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["linkedin_url"] == payload["linkedin_url"]
    assert body["github_username"] == "octocat"

    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.json()["github_username"] == "octocat"


def test_profile_is_per_user(client):
    token_a = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "testpass1"}
    ).json()["access_token"]
    token_b = client.post(
        "/api/auth/register", json={"email": "b@example.com", "password": "testpass1"}
    ).json()["access_token"]

    client.patch(
        "/api/auth/profile",
        json={"linkedin_url": "", "indeed_url": "", "upwork_url": "", "github_username": "alex"},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    res_a = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_a}"})
    res_b = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_b}"})
    assert res_a.json()["github_username"] == "alex"
    assert res_b.json()["github_username"] == ""


def _fake_json_response(payload, status_code=200):
    resp = MagicMock()
    resp.status_code = status_code
    resp.json = MagicMock(return_value=payload)
    resp.raise_for_status = MagicMock()
    return resp


def test_github_stats_requires_auth(client):
    res = client.get("/api/auth/github-stats/octocat")
    assert res.status_code == 401


def test_github_stats_returns_profile_and_top_languages(client, auth_headers):
    profile = {
        "login": "octocat",
        "name": "The Octocat",
        "bio": "GitHub mascot",
        "public_repos": 8,
        "followers": 100,
        "avatar_url": "https://avatars.example/octocat.png",
        "html_url": "https://github.com/octocat",
    }
    repos = [
        {"language": "Python"},
        {"language": "Python"},
        {"language": "TypeScript"},
        {"language": None},
    ]
    with patch(
        "app.integrations.github.httpx.get",
        side_effect=[_fake_json_response(profile), _fake_json_response(repos)],
    ):
        res = client.get("/api/auth/github-stats/octocat", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["username"] == "octocat"
    assert body["public_repos"] == 8
    assert body["top_languages"][0] == "Python"


def test_github_stats_404s_for_unknown_user(client, auth_headers):
    with patch("app.integrations.github.httpx.get", return_value=_fake_json_response({}, status_code=404)):
        res = client.get("/api/auth/github-stats/does-not-exist", headers=auth_headers)
    assert res.status_code == 404
