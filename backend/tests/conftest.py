import os
import sys
import tempfile
from unittest.mock import MagicMock

_tmp_dir = tempfile.mkdtemp(prefix="jobneed-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_dir}/test.db"
os.environ.setdefault("ANTHROPIC_API_KEY", "test-key")

for _mod in (
    "chromadb",
    "chromadb.utils",
    "chromadb.utils.embedding_functions",
    "chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2",
):
    sys.modules.setdefault(_mod, MagicMock())

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, engine
from app.main import app


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture()
def client():
    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    token = client.post(
        "/api/auth/register", json={"email": "user@example.com", "password": "hunter22"}
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def admin_auth_headers(client, monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "admin@example.com")
    monkeypatch.setattr(settings, "admin_password", "admin-secret")
    token = client.post(
        "/api/auth/admin-login",
        json={"email": "admin@example.com", "password": "admin-secret"},
    ).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
