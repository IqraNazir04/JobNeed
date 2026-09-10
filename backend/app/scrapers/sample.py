"""A local fixture-backed source so the ingestion → RAG pipeline is runnable
without any live API credentials. Swap for a real source once you have
access to one of the compliant APIs described in the sibling modules.
"""

from app.scrapers.base import JobSource, RawJob

_FIXTURES = [
    RawJob(
        id="sample-1",
        source="sample",
        title="Senior Backend Engineer (Python)",
        company="Acme Analytics",
        location="Remote",
        description=(
            "Build and scale our data ingestion services in Python/FastAPI. "
            "5+ years experience, strong SQL, comfortable with async workloads."
        ),
        url="https://example.com/jobs/sample-1",
    ),
    RawJob(
        id="sample-2",
        source="sample",
        title="React Frontend Contractor",
        company="Northwind Studio",
        location="Remote (US timezones)",
        description=(
            "3-month contract building a dashboard in React + TypeScript + "
            "Tailwind. Must have prior contract/freelance experience."
        ),
        url="https://example.com/jobs/sample-2",
    ),
    RawJob(
        id="sample-3",
        source="sample",
        title="Machine Learning Engineer, NLP",
        company="Lexicon AI",
        location="San Francisco, CA (hybrid)",
        description=(
            "Own our RAG pipeline: retrieval, embeddings, and evaluation. "
            "Experience with vector databases and LLM applications required."
        ),
        url="https://example.com/jobs/sample-3",
    ),
]


class SampleSource(JobSource):
    name = "sample"

    def fetch(self, query: str, limit: int = 50) -> list[RawJob]:
        query_lower = query.lower().strip()
        if not query_lower:
            matches = _FIXTURES
        else:
            matches = [
                job
                for job in _FIXTURES
                if query_lower in job.title.lower()
                or query_lower in job.description.lower()
            ]
        return matches[:limit]
