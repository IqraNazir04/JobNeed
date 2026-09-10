from unittest.mock import patch


def test_search_returns_matches(client):
    client.post("/api/jobs/ingest/sample")
    with patch("app.rag.retriever.vector_store.query", return_value=[("sample-2", 0.9)]):
        res = client.post("/api/search", json={"query": "react", "top_k": 5})
    assert res.status_code == 200
    body = res.json()
    assert len(body) == 1
    assert body[0]["job"]["id"] == "sample-2"
    assert body[0]["score"] == 0.9


def test_search_returns_empty_list_when_no_hits(client):
    with patch("app.rag.retriever.vector_store.query", return_value=[]):
        res = client.post("/api/search", json={"query": "nothing", "top_k": 5})
    assert res.status_code == 200
    assert res.json() == []


def test_search_skips_hits_missing_from_db(client):
    with patch(
        "app.rag.retriever.vector_store.query",
        return_value=[("not-in-db", 0.5)],
    ):
        res = client.post("/api/search", json={"query": "react", "top_k": 5})
    assert res.status_code == 200
    assert res.json() == []
