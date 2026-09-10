def test_register_creates_user_and_returns_token(client):
    res = client.post("/api/auth/register", json={"email": "a@example.com", "password": "hunter2"})
    assert res.status_code == 201
    body = res.json()
    assert body["user"]["email"] == "a@example.com"
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_register_rejects_duplicate_email(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "hunter2"})
    res = client.post("/api/auth/register", json={"email": "a@example.com", "password": "other"})
    assert res.status_code == 400


def test_login_with_correct_credentials(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "hunter2"})
    res = client.post("/api/auth/login", json={"email": "a@example.com", "password": "hunter2"})
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_login_with_wrong_password_rejected(client):
    client.post("/api/auth/register", json={"email": "a@example.com", "password": "hunter2"})
    res = client.post("/api/auth/login", json={"email": "a@example.com", "password": "wrong"})
    assert res.status_code == 401


def test_login_with_unknown_email_rejected(client):
    res = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "x"})
    assert res.status_code == 401


def test_me_requires_token(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_me_returns_current_user(client):
    token = client.post(
        "/api/auth/register", json={"email": "a@example.com", "password": "hunter2"}
    ).json()["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["email"] == "a@example.com"


def test_me_rejects_garbage_token(client):
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert res.status_code == 401
