def test_list_saved_jobs_requires_auth(client):
    res = client.get("/api/saved-jobs")
    assert res.status_code == 401


def test_saved_jobs_starts_empty(client, auth_headers):
    res = client.get("/api/saved-jobs", headers=auth_headers)
    assert res.status_code == 200
    assert res.json() == []


def test_save_and_list_job(client, auth_headers):
    client.post("/api/jobs/ingest/sample")

    res = client.put("/api/saved-jobs/sample-2", headers=auth_headers)
    assert res.status_code == 204

    res = client.get("/api/saved-jobs", headers=auth_headers)
    assert res.status_code == 200
    assert [j["id"] for j in res.json()] == ["sample-2"]


def test_save_unknown_job_404s(client, auth_headers):
    res = client.put("/api/saved-jobs/does-not-exist", headers=auth_headers)
    assert res.status_code == 404


def test_saving_twice_does_not_duplicate(client, auth_headers):
    client.post("/api/jobs/ingest/sample")
    client.put("/api/saved-jobs/sample-1", headers=auth_headers)
    client.put("/api/saved-jobs/sample-1", headers=auth_headers)

    res = client.get("/api/saved-jobs", headers=auth_headers)
    assert len(res.json()) == 1


def test_unsave_job(client, auth_headers):
    client.post("/api/jobs/ingest/sample")
    client.put("/api/saved-jobs/sample-1", headers=auth_headers)

    res = client.delete("/api/saved-jobs/sample-1", headers=auth_headers)
    assert res.status_code == 204

    res = client.get("/api/saved-jobs", headers=auth_headers)
    assert res.json() == []


def test_unsave_job_not_saved_is_a_noop(client, auth_headers):
    res = client.delete("/api/saved-jobs/never-saved", headers=auth_headers)
    assert res.status_code == 204


def test_saved_jobs_are_per_user(client):
    client.post("/api/jobs/ingest/sample")

    token_a = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "x"}
    ).json()["access_token"]
    token_b = client.post(
        "/api/auth/register", json={"email": "b@example.com", "password": "x"}
    ).json()["access_token"]

    client.put("/api/saved-jobs/sample-1", headers={"Authorization": f"Bearer {token_a}"})

    res_a = client.get("/api/saved-jobs", headers={"Authorization": f"Bearer {token_a}"})
    res_b = client.get("/api/saved-jobs", headers={"Authorization": f"Bearer {token_b}"})
    assert len(res_a.json()) == 1
    assert res_b.json() == []
