from tests.conftest import make_admin_account


def _login(client, email, password="admin-secret"):
    token = client.post(
        "/api/auth/admin-login", json={"email": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_new_admin_defaults_to_editor_role(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "second@example.com", "password": "another-secret1"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["role"] == "editor"


def test_admin_can_create_another_full_admin(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "second@example.com", "password": "another-secret1", "role": "admin"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["role"] == "admin"


def test_editor_cannot_create_admin_accounts(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com", "editor-secret")

    res = client.post(
        "/api/auth/admin-accounts",
        json={"email": "second@example.com", "password": "another-secret1"},
        headers=editor_headers,
    )
    assert res.status_code == 403


def test_editor_cannot_remove_admin_accounts(client, admin_auth_headers):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com", "editor-secret")

    res = client.delete("/api/auth/admin-accounts/admin@example.com", headers=editor_headers)
    assert res.status_code == 403


def test_editor_cannot_change_roles(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com", "editor-secret")

    res = client.patch(
        "/api/auth/admin-accounts/editor@example.com/role",
        json={"role": "admin"},
        headers=editor_headers,
    )
    assert res.status_code == 403


def test_editor_can_still_see_the_admin_list(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com", "editor-secret")

    res = client.get("/api/auth/admin-accounts", headers=editor_headers)
    assert res.status_code == 200


def test_editor_can_still_post_jobs(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com", "editor-secret")

    res = client.post(
        "/api/jobs/board",
        json={
            "title": "Support Engineer",
            "company": "JobNeed",
            "description": "Help customers.",
            "url": "mailto:jobs@jobneed.example.com",
        },
        headers=editor_headers,
    )
    assert res.status_code == 200


def test_admin_can_promote_an_editor(client, admin_auth_headers):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    res = client.patch(
        "/api/auth/admin-accounts/editor@example.com/role",
        json={"role": "admin"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["role"] == "admin"


def test_cannot_demote_the_last_full_admin(client, admin_auth_headers):
    res = client.patch(
        "/api/auth/admin-accounts/admin@example.com/role",
        json={"role": "editor"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 400


def test_can_demote_an_admin_once_another_admin_exists(client, admin_auth_headers):
    make_admin_account("second@example.com", "second-secret", role="admin")
    res = client.patch(
        "/api/auth/admin-accounts/admin@example.com/role",
        json={"role": "editor"},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200


def test_cannot_remove_the_last_full_admin_even_if_editors_remain(client, admin_auth_headers):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    res = client.delete("/api/auth/admin-accounts/admin@example.com", headers=admin_auth_headers)
    assert res.status_code == 400


def test_login_response_includes_role(client, admin_auth_headers):
    res = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    )
    assert res.json()["role"] == "admin"
