import pyotp
from tests.conftest import make_admin_account


def test_list_admin_accounts_requires_admin(client, auth_headers):
    res = client.get("/api/auth/admin-accounts", headers=auth_headers)
    assert res.status_code == 401


def test_list_admin_accounts(client, admin_auth_headers):
    res = client.get("/api/auth/admin-accounts", headers=admin_auth_headers)
    assert res.status_code == 200
    emails = [a["email"] for a in res.json()]
    assert "admin@example.com" in emails
    # Never leaks a password hash.
    assert all("password" not in a for a in res.json())


def test_admin_can_add_another_admin(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "second@example.com", "password": "another-secret1"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["email"] == "second@example.com"

    # The new admin can immediately log in with their own credentials.
    res = client.post(
        "/api/auth/admin-login",
        json={"email": "second@example.com", "password": "another-secret1"},
    )
    assert res.status_code == 200


def test_cannot_add_a_duplicate_admin_email(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "admin@example.com", "password": "whatever1"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 400


def test_adding_an_admin_requires_admin(client, auth_headers):
    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "second@example.com", "password": "another-secret1"},
        headers=auth_headers,
    )
    assert res.status_code == 401


def test_admin_can_remove_another_admin(client, admin_auth_headers):
    make_admin_account("second@example.com", "another-secret1")
    res = client.delete("/api/auth/admin-accounts/second@example.com", headers=admin_auth_headers)
    assert res.status_code == 204

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "second@example.com", "password": "another-secret1"},
    )
    assert res.status_code == 401


def test_cannot_remove_the_last_remaining_admin(client, admin_auth_headers):
    res = client.delete("/api/auth/admin-accounts/admin@example.com", headers=admin_auth_headers)
    assert res.status_code == 400


def test_change_own_password(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-password",
        json={"current_password": "admin-secret", "new_password": "brand-new-secret1"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "brand-new-secret1"},
    )
    assert res.status_code == 200

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    )
    assert res.status_code == 401


def test_change_password_rejects_wrong_current_password(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-password",
        json={"current_password": "wrong", "new_password": "brand-new-secret1"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 401


def test_totp_setup_then_confirm_enables_two_factor(client, admin_auth_headers):
    res = client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers)
    assert res.status_code == 200
    secret = res.json()["secret"]
    assert res.json()["otpauth_url"].startswith("otpauth://")

    code = pyotp.TOTP(secret).now()
    res = client.post(
        "/api/auth/admin-totp/confirm", json={"code": code}, headers=admin_auth_headers
    )
    assert res.status_code == 200

    accounts = client.get("/api/auth/admin-accounts", headers=admin_auth_headers).json()
    assert next(a for a in accounts if a["email"] == "admin@example.com")["totp_enabled"] is True


def test_totp_confirm_rejects_wrong_code(client, admin_auth_headers):
    client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers)
    res = client.post(
        "/api/auth/admin-totp/confirm", json={"code": "000000"}, headers=admin_auth_headers
    )
    assert res.status_code == 400


def test_login_requires_totp_once_enabled_then_succeeds_with_a_valid_code(client, admin_auth_headers):
    setup = client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers).json()
    secret = setup["secret"]
    client.post(
        "/api/auth/admin-totp/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=admin_auth_headers,
    )

    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["requires_totp"] is True
    assert body["access_token"] is None
    pending_token = body["pending_token"]

    res = client.post(
        "/api/auth/admin-login/totp",
        json={"pending_token": pending_token, "code": pyotp.TOTP(secret).now()},
    )
    assert res.status_code == 200
    assert res.json()["access_token"]


def test_totp_login_rejects_wrong_code(client, admin_auth_headers):
    setup = client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers).json()
    secret = setup["secret"]
    client.post(
        "/api/auth/admin-totp/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=admin_auth_headers,
    )
    login = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    ).json()

    res = client.post(
        "/api/auth/admin-login/totp",
        json={"pending_token": login["pending_token"], "code": "000000"},
    )
    assert res.status_code == 401


def test_a_regular_admin_token_cannot_be_used_as_a_pending_totp_token(client, admin_auth_headers):
    """The pending-2FA token and the full admin session token are prefixed
    differently on purpose, so a full token can't skip the TOTP step."""
    full_token = admin_auth_headers["Authorization"].removeprefix("Bearer ")
    res = client.post(
        "/api/auth/admin-login/totp",
        json={"pending_token": full_token, "code": "000000"},
    )
    assert res.status_code == 401


def test_disable_totp(client, admin_auth_headers):
    setup = client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers).json()
    secret = setup["secret"]
    client.post(
        "/api/auth/admin-totp/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=admin_auth_headers,
    )

    res = client.post(
        "/api/auth/admin-totp/disable",
        json={"password": "admin-secret"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200

    # Logging in no longer requires a second factor.
    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    )
    assert res.status_code == 200
    assert res.json()["requires_totp"] is False


def test_disable_totp_requires_correct_password(client, admin_auth_headers):
    setup = client.post("/api/auth/admin-totp/setup", headers=admin_auth_headers).json()
    secret = setup["secret"]
    client.post(
        "/api/auth/admin-totp/confirm",
        json={"code": pyotp.TOTP(secret).now()},
        headers=admin_auth_headers,
    )

    res = client.post(
        "/api/auth/admin-totp/disable",
        json={"password": "wrong"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 401
