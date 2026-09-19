from tests.conftest import make_admin_account


def _login(client, email, password="editor-secret"):
    token = client.post(
        "/api/auth/admin-login", json={"email": email, "password": password}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_admin_can_write_and_list_posts(client, admin_auth_headers):
    res = client.post(
        "/api/admin/posts",
        json={"title": "Hello world", "content": "First post.", "published": True},
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["title"] == "Hello world"
    assert body["author_email"] == "admin@example.com"

    listing = client.get("/api/admin/posts", headers=admin_auth_headers)
    assert listing.status_code == 200
    assert len(listing.json()) == 1


def test_editor_can_write_posts(client):
    make_admin_account("editor@example.com", "editor-secret", role="editor")
    editor_headers = _login(client, "editor@example.com")

    res = client.post(
        "/api/admin/posts",
        json={"title": "Editor post", "content": "Body text."},
        headers=editor_headers,
    )
    assert res.status_code == 201


def test_update_and_delete_post(client, admin_auth_headers):
    created = client.post(
        "/api/admin/posts",
        json={"title": "Draft", "content": "Draft body."},
        headers=admin_auth_headers,
    ).json()

    updated = client.patch(
        f"/api/admin/posts/{created['id']}",
        json={"title": "Published", "content": "Final body.", "published": True},
        headers=admin_auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["published"] is True

    deleted = client.delete(f"/api/admin/posts/{created['id']}", headers=admin_auth_headers)
    assert deleted.status_code == 204

    listing = client.get("/api/admin/posts", headers=admin_auth_headers)
    assert listing.json() == []


def test_post_with_image_and_tags(client, admin_auth_headers):
    res = client.post(
        "/api/admin/posts",
        json={
            "title": "Resume tips",
            "content": "## Section heading\nBody text.",
            "image_url": "https://example.com/cover.png",
            "tags": "career, resume",
        },
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    body = res.json()
    assert body["image_url"] == "https://example.com/cover.png"
    assert body["tags"] == "career, resume"
    assert "## Section heading" in body["content"]


def test_scheduled_post_for_content_calendar(client, admin_auth_headers):
    res = client.post(
        "/api/admin/posts",
        json={
            "title": "Scheduled",
            "content": "Coming soon.",
            "scheduled_for": "2026-10-01T09:00:00",
        },
        headers=admin_auth_headers,
    )
    assert res.status_code == 201
    assert res.json()["scheduled_for"].startswith("2026-10-01")


def test_social_link_crud(client, admin_auth_headers):
    created = client.post(
        "/api/admin/social-links",
        json={"platform": "LinkedIn", "url": "https://linkedin.com/company/jobneed", "display_order": 1},
        headers=admin_auth_headers,
    )
    assert created.status_code == 201
    link_id = created.json()["id"]

    listing = client.get("/api/admin/social-links", headers=admin_auth_headers)
    assert len(listing.json()) == 1

    updated = client.patch(
        f"/api/admin/social-links/{link_id}",
        json={"platform": "LinkedIn", "url": "https://linkedin.com/company/jobneed2", "display_order": 0},
        headers=admin_auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["url"].endswith("jobneed2")

    deleted = client.delete(f"/api/admin/social-links/{link_id}", headers=admin_auth_headers)
    assert deleted.status_code == 204


def test_non_admin_cannot_reach_content_endpoints(client):
    res = client.get("/api/admin/posts")
    assert res.status_code == 401


def test_dashboard_chart_data_shape(client, admin_auth_headers):
    res = client.get("/api/admin/dashboard/chart-data", headers=admin_auth_headers)
    assert res.status_code == 200
    series = res.json()["series"]
    assert len(series) == 14
    assert set(series[0].keys()) == {"date", "jobs_posted", "user_signups"}


def test_dashboard_chart_data_counts_jobs_and_signups(client, admin_auth_headers):
    client.post(
        "/api/jobs/board",
        json={
            "title": "Backend Engineer",
            "company": "JobNeed",
            "description": "Build things.",
            "url": "mailto:jobs@jobneed.example.com",
        },
        headers=admin_auth_headers,
    )
    client.post("/api/auth/register", json={"email": "newsignup@example.com", "password": "hunter22"})

    res = client.get("/api/admin/dashboard/chart-data", headers=admin_auth_headers)
    series = res.json()["series"]
    assert sum(point["jobs_posted"] for point in series) == 1
    assert sum(point["user_signups"] for point in series) == 1
