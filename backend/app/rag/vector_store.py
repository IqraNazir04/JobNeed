import chromadb
from chromadb.utils.embedding_functions.onnx_mini_lm_l6_v2 import ONNXMiniLM_L6_V2

from app.core.config import settings
from app.models.job import Job

# Force CPU-only inference: some platforms (notably older macOS builds) crash
# in onnxruntime's CoreML execution provider, which chromadb's default
# embedding function otherwise auto-selects when available.
_embedding_function = ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])

_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
_collection = _client.get_or_create_collection(
    settings.chroma_collection,
    embedding_function=_embedding_function,
    # Cosine distance keeps `1 - distance` a meaningful similarity score;
    # chroma's default (squared L2) is unbounded, which pushes dissimilar
    # results into confusing negative "match" scores.
    metadata={"hnsw:space": "cosine"},
)


def _document_text(job: Job) -> str:
    return f"{job.title} at {job.company} ({job.location})\n{job.description}"


def upsert_job(job: Job) -> None:
    _collection.upsert(
        ids=[job.id],
        documents=[_document_text(job)],
        metadatas=[{"source": job.source, "title": job.title, "company": job.company}],
    )


def upsert_jobs(jobs: list[Job]) -> None:
    if not jobs:
        return
    _collection.upsert(
        ids=[job.id for job in jobs],
        documents=[_document_text(job) for job in jobs],
        metadatas=[
            {"source": job.source, "title": job.title, "company": job.company}
            for job in jobs
        ],
    )


def delete_job(job_id: str) -> None:
    _collection.delete(ids=[job_id])


def query(text: str, top_k: int = 10) -> list[tuple[str, float]]:
    """Returns a list of (job_id, similarity_score) sorted by relevance."""
    result = _collection.query(query_texts=[text], n_results=top_k)
    ids = result["ids"][0]
    distances = result["distances"][0]
    return [(job_id, max(0.0, 1 - dist)) for job_id, dist in zip(ids, distances)]
