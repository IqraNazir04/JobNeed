from unittest.mock import patch


def test_chat_returns_answer_and_matches(client):
    client.post("/api/jobs/ingest/sample")
    with (
        patch("app.rag.retriever.vector_store.query", return_value=[("sample-2", 0.9)]),
        patch("app.api.routes.chat.rag_chat.answer", return_value="Great match!"),
    ):
        res = client.post("/api/chat", json={"message": "react contract", "top_k": 5})
    assert res.status_code == 200
    body = res.json()
    assert body["answer"] == "Great match!"
    assert len(body["matches"]) == 1
    assert body["matches"][0]["id"] == "sample-2"


def test_chat_with_no_matches_still_answers(client):
    with (
        patch("app.rag.retriever.vector_store.query", return_value=[]),
        patch("app.api.routes.chat.rag_chat.answer", return_value="No postings fit."),
    ):
        res = client.post("/api/chat", json={"message": "underwater basket weaving"})
    assert res.status_code == 200
    body = res.json()
    assert body["answer"] == "No postings fit."
    assert body["matches"] == []
