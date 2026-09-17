def _create_payload(**overrides):
    payload = {
        "title": "Senior Full-Stack Engineer",
        "company": "JobNeed",
        "location": "Austin, TX",
        "remote": True,
        "description": "Build and ship features across the stack.",
        "url": "mailto:jobs@jobneed.example.com",
        "salary_range": "$130k-$160k",
    }
    payload.update(overrides)
    return payload


def test_create_board_job_requires_auth(client):
    res = client.post("/api/jobs/board", json=_create_payload())
    assert res.status_code == 401


def test_create_board_job_requires_admin(client, auth_headers):
    res = client.post("/api/jobs/board", json=_create_payload(), headers=auth_headers)
    assert res.status_code == 403


def test_admin_can_create_board_job(client, admin_auth_headers):
    res = client.post("/api/jobs/board", json=_create_payload(), headers=admin_auth_headers)
    assert res.status_code == 200
    body = res.json()
    assert body["source"] == "jobneed"
    assert body["is_active"] is True
    assert body["salary_range"] == "$130k-$160k"
    # Remote flag folds into the location text the app's remote-only filter matches on.
    assert "remote" in body["location"].lower()
    assert "Austin" in body["location"]


def test_board_job_shows_up_in_public_list(client, admin_auth_headers):
    client.post("/api/jobs/board", json=_create_payload(), headers=admin_auth_headers)
    res = client.get("/api/jobs")
    assert res.status_code == 200
    assert any(job["source"] == "jobneed" for job in res.json())


def test_list_my_board_jobs_requires_admin(client, auth_headers):
    res = client.get("/api/jobs/board/mine", headers=auth_headers)
    assert res.status_code == 403


def test_list_my_board_jobs_returns_only_jobneed_postings(client, admin_auth_headers):
    client.post("/api/jobs/ingest/sample")
    client.post("/api/jobs/board", json=_create_payload(), headers=admin_auth_headers)

    res = client.get("/api/jobs/board/mine", headers=admin_auth_headers)
    assert res.status_code == 200
    jobs = res.json()
    assert len(jobs) == 1
    assert jobs[0]["source"] == "jobneed"


def test_admin_can_update_board_job(client, admin_auth_headers):
    created = client.post(
        "/api/jobs/board", json=_create_payload(), headers=admin_auth_headers
    ).json()

    res = client.patch(
        f"/api/jobs/board/{created['id']}",
        json={"salary_range": "$140k-$170k"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["salary_range"] == "$140k-$170k"
    # Untouched fields survive a partial update.
    assert res.json()["title"] == "Senior Full-Stack Engineer"


def test_update_board_job_requires_admin(client, admin_auth_headers, auth_headers):
    created = client.post(
        "/api/jobs/board", json=_create_payload(), headers=admin_auth_headers
    ).json()

    res = client.patch(
        f"/api/jobs/board/{created['id']}",
        json={"title": "Hijacked"},
        headers=auth_headers,
    )
    assert res.status_code == 403


def test_cannot_edit_a_scraped_job_through_board_endpoint(client, admin_auth_headers):
    client.post("/api/jobs/ingest/sample")
    res = client.patch(
        "/api/jobs/board/sample-1",
        json={"title": "Hijacked"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 404


def test_admin_can_close_board_job(client, admin_auth_headers):
    created = client.post(
        "/api/jobs/board", json=_create_payload(), headers=admin_auth_headers
    ).json()

    res = client.post(f"/api/jobs/board/{created['id']}/close", headers=admin_auth_headers)
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_closed_board_job_drops_out_of_public_list(client, admin_auth_headers):
    created = client.post(
        "/api/jobs/board", json=_create_payload(), headers=admin_auth_headers
    ).json()
    client.post(f"/api/jobs/board/{created['id']}/close", headers=admin_auth_headers)

    res = client.get("/api/jobs")
    assert all(job["id"] != created["id"] for job in res.json())


def test_close_board_job_requires_admin(client, admin_auth_headers, auth_headers):
    created = client.post(
        "/api/jobs/board", json=_create_payload(), headers=admin_auth_headers
    ).json()

    res = client.post(f"/api/jobs/board/{created['id']}/close", headers=auth_headers)
    assert res.status_code == 403


def test_me_reports_is_admin(client, admin_auth_headers, auth_headers):
    admin_me = client.get("/api/auth/me", headers=admin_auth_headers).json()
    regular_me = client.get("/api/auth/me", headers=auth_headers).json()
    assert admin_me["is_admin"] is True
    assert regular_me["is_admin"] is False
