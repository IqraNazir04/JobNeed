from datetime import datetime, timedelta


def _create_post(client, headers, **overrides):
    payload = {"title": "Untitled", "content": "Body.", "published": False, **overrides}
    return client.post("/api/admin/posts", json=payload, headers=headers).json()


def test_unpublished_post_hidden_from_public_list(client, admin_auth_headers):
    _create_post(client, admin_auth_headers, title="Draft", published=False)

    res = client.get("/api/blog/posts")
    assert res.status_code == 200
    assert res.json() == []


def test_unpublished_post_404s_when_fetched_directly(client, admin_auth_headers):
    post = _create_post(client, admin_auth_headers, title="Draft", published=False)

    res = client.get(f"/api/blog/posts/{post['id']}")
    assert res.status_code == 404


def test_published_post_with_no_schedule_is_public(client, admin_auth_headers):
    post = _create_post(client, admin_auth_headers, title="Live now", published=True)

    listing = client.get("/api/blog/posts")
    assert len(listing.json()) == 1
    assert listing.json()[0]["title"] == "Live now"

    single = client.get(f"/api/blog/posts/{post['id']}")
    assert single.status_code == 200


def test_future_scheduled_post_not_yet_public(client, admin_auth_headers):
    future = (datetime.utcnow() + timedelta(days=1)).isoformat()
    post = _create_post(client, admin_auth_headers, title="Later", published=True, scheduled_for=future)

    listing = client.get("/api/blog/posts")
    assert listing.json() == []

    single = client.get(f"/api/blog/posts/{post['id']}")
    assert single.status_code == 404


def test_past_scheduled_post_is_public(client, admin_auth_headers):
    past = (datetime.utcnow() - timedelta(days=1)).isoformat()
    post = _create_post(client, admin_auth_headers, title="Earlier", published=True, scheduled_for=past)

    listing = client.get("/api/blog/posts")
    assert len(listing.json()) == 1

    single = client.get(f"/api/blog/posts/{post['id']}")
    assert single.status_code == 200


def test_nonexistent_post_404s(client):
    res = client.get("/api/blog/posts/does-not-exist")
    assert res.status_code == 404


def test_public_list_sorted_most_recent_first(client, admin_auth_headers):
    older = (datetime.utcnow() - timedelta(days=2)).isoformat()
    newer = (datetime.utcnow() - timedelta(days=1)).isoformat()
    _create_post(client, admin_auth_headers, title="Older", published=True, scheduled_for=older)
    _create_post(client, admin_auth_headers, title="Newer", published=True, scheduled_for=newer)

    listing = client.get("/api/blog/posts").json()
    assert [p["title"] for p in listing] == ["Newer", "Older"]
