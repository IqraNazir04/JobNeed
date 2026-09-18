from tests.conftest import make_admin_account


def test_admin_login_succeeds_for_a_known_admin(client):
    make_admin_account("one@example.com", "shared-secret")
    make_admin_account("two@example.com", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "two@example.com", "password": "shared-secret"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "two@example.com"
    assert body["requires_totp"] is False
    assert body["access_token"]


def test_admin_login_is_case_insensitive_on_email(client):
    make_admin_account("admin@example.com", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "Admin@Example.com", "password": "shared-secret"},
    )
    assert res.status_code == 200


def test_admin_login_rejects_unknown_email(client):
    make_admin_account("one@example.com", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "someone-else@example.com", "password": "shared-secret"},
    )
    assert res.status_code == 401


def test_admin_login_rejects_wrong_password(client):
    make_admin_account("one@example.com", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "one@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_admin_login_ignores_a_same_email_users_own_password(client):
    """The whole point of a separate admin login: a regular account's own
    password must never work here, even if it shares the admin's email."""
    make_admin_account("shared@example.com", "admin-only-secret")

    client.post(
        "/api/auth/register",
        json={"email": "shared@example.com", "password": "the-users-own-password"},
    )

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "shared@example.com", "password": "the-users-own-password"},
    )
    assert res.status_code == 401

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "shared@example.com", "password": "admin-only-secret"},
    )
    assert res.status_code == 200
