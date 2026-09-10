def test_get_cv_requires_auth(client):
    res = client.get("/api/cv")
    assert res.status_code == 401


def test_get_cv_before_saving_returns_empty_cv(client, auth_headers):
    res = client.get("/api/cv", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["name"] == ""
    assert res.json()["skills"] == []


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
        "/api/auth/register", json={"email": "a@example.com", "password": "x"}
    ).json()["access_token"]
    token_b = client.post(
        "/api/auth/register", json={"email": "b@example.com", "password": "x"}
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
