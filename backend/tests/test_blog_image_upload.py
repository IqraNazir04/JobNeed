import base64
import io

from tests.conftest import make_admin_account


def _login(client, email, password="editor-secret"):
    token = client.post(
        "/api/auth/admin-login", json={"email": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _gif_bytes() -> bytes:
    # A well-known minimal valid 1x1 transparent GIF.
    return base64.b64decode("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==")


def test_admin_can_upload_an_image(client, admin_auth_headers):
    res = client.post(
        "/api/admin/posts/upload-image",
        files={"file": ("cover.gif", io.BytesIO(_gif_bytes()), "image/gif")},
        headers=admin_auth_headers,
    )
    assert res.status_code == 200
    url = res.json()["url"]
    assert url.startswith("/uploads/blog/")
    assert url.endswith(".gif")

    fetched = client.get(url)
    assert fetched.status_code == 200
    assert fetched.content == _gif_bytes()


def test_editor_can_upload_an_image(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com")

    res = client.post(
        "/api/admin/posts/upload-image",
        files={"file": ("cover.gif", io.BytesIO(_gif_bytes()), "image/gif")},
        headers=editor_headers,
    )
    assert res.status_code == 200


def test_upload_rejects_non_image_files(client, admin_auth_headers):
    res = client.post(
        "/api/admin/posts/upload-image",
        files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=admin_auth_headers,
    )
    assert res.status_code == 400


def test_upload_requires_admin_auth(client):
    res = client.post(
        "/api/admin/posts/upload-image",
        files={"file": ("cover.gif", io.BytesIO(_gif_bytes()), "image/gif")},
    )
    assert res.status_code == 401
