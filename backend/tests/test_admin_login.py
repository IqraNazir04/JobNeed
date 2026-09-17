def test_admin_login_succeeds_for_allowlisted_email(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com,two@example.com")
    monkeypatch.setattr(settings, "admin_password", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "two@example.com", "password": "shared-secret"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "two@example.com"
    assert "access_token" in body


def test_admin_login_is_case_insensitive_on_email(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "Admin@Example.com")
    monkeypatch.setattr(settings, "admin_password", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "shared-secret"},
    )
    assert res.status_code == 200


def test_admin_login_rejects_email_not_on_allowlist(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com")
    monkeypatch.setattr(settings, "admin_password", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "someone-else@example.com", "password": "shared-secret"},
    )
    assert res.status_code == 401


def test_admin_login_rejects_wrong_password(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com")
    monkeypatch.setattr(settings, "admin_password", "shared-secret")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "one@example.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_admin_login_ignores_a_same_email_users_own_password(client, monkeypatch):
    """The whole point of a separate admin login: a regular account's own
    password must never work here, even if it shares the admin's email."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "shared@example.com")
    monkeypatch.setattr(settings, "admin_password", "admin-only-secret")

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


def test_admin_login_disabled_when_no_password_configured(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com")
    monkeypatch.setattr(settings, "admin_password", "")

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "one@example.com", "password": ""},
    )
    assert res.status_code == 401
