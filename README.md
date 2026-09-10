# JobNeed

A full-stack, RAG-based job/project discovery assistant. It ingests postings from
multiple sources, embeds and indexes them, and lets a user search or chat
("find me remote React contracts under 3 months") to get relevant, ranked
matches with an LLM-generated explanation of *why* each match fits.

## Data sources: a compliance note

Indeed, LinkedIn, and Facebook all prohibit automated scraping of their sites
in their Terms of Service, and LinkedIn/Meta have pursued legal action against
scrapers (e.g. *hiQ Labs v. LinkedIn*). Because of that, this scaffold does
**not** ship working HTML scrapers for those sites. Instead, `backend/app/scrapers/`
defines a common `JobSource` interface with adapters that pull from
compliant channels:

| Source            | Recommended path                                                        | Status |
|-------------------|--------------------------------------------------------------------------|--------|
| Greenhouse        | [Public job-board API](https://developers.greenhouse.io/job-board.html) — no key needed | **Working** |
| Lever             | [Public postings API](https://github.com/lever/postings-api) — no key needed | **Working** |
| JobPosting schema | [schema.org JobPosting](https://developers.google.com/search/docs/appearance/structured-data/job-posting) crawl of career pages — no key needed | **Working** |
| URL import        | Paste one job URL (e.g. a LinkedIn listing); reads its public Open Graph preview tags — no key, no bulk scraping | **Working** |
| Google            | SerpApi's [Google Jobs API](https://serpapi.com/google-jobs-api) (needs `SERPAPI_API_KEY`) | **Working**, needs a key |
| Indeed            | [Indeed Publisher/XML feed](https://www.indeed.com/publisher) or a licensed aggregator API | Stubbed — needs publisher access |
| LinkedIn (bulk)    | [LinkedIn Talent/Jobs API](https://learn.microsoft.com/en-us/linkedin/talent/job-postings/) (partner access) or Proxycurl (licensed) | Stubbed — needs partner access |
| Facebook          | Facebook Jobs is deprecated; Meta's Graph API where applicable, or skip | No compliant path |

Greenhouse and Lever both run the same public, unauthenticated feed a
company uses to power its own careers page — pulling from it isn't a ToS
violation the way scraping Indeed or LinkedIn would be, and it needs no
partner agreement. Configure which companies to pull via `GREENHOUSE_BOARDS`
/ `LEVER_BOARDS` in `.env` (comma-separated board tokens, found in the URL
of a company's careers page); `GREENHOUSE_BOARDS` defaults to `gitlab` so
it works out of the box.

The **JobPosting schema** source crawls a configured list of career-page
URLs (`JOBPOSTING_URLS` in `.env`) for `<script type="application/ld+json">`
blocks with `@type: JobPosting` — the same structured data companies publish
specifically so Google for Jobs can index them, so reading it is squarely
within its intended purpose.

**URL import** (`POST /api/jobs/import-url` with `{"url": "..."}`) fetches
one user-supplied posting URL and reads its Open Graph preview tags
(`og:title`, `og:description`) — the same metadata the site publishes for
link-preview cards. For LinkedIn specifically it also parses the
"`Company` hiring `Title` in `Location`" pattern LinkedIn's `og:title`
follows, to split those out. A single explicit URL a user pastes is a very
different risk profile from bulk-scraping a site's listings, so this works
for LinkedIn without needing partner access — it just can't *search*
LinkedIn, only import a URL you already have.

Indeed and LinkedIn's bulk/search APIs remain stubbed with a
`NotImplementedError` pointing at the docs above, since those genuinely
require an approved account, not just code. There's also a `sample.py`
adapter with local fixtures, so the rest of the pipeline (ingestion →
embeddings → vector search → RAG chat) is runnable without any live
source at all.

Every real posting also passes through `app/rag/enrich.py`, which uses
Claude to condense verbose descriptions (real postings are often padded
with repeated company boilerplate) into a focused summary — it only fires
for long descriptions, and falls back to the original text if no
`ANTHROPIC_API_KEY` is set or the call fails, so ingestion is never blocked
by it.

Trigger an ingest with `POST /api/jobs/ingest/{source}` where `{source}`
is `sample`, `greenhouse`, `lever`, `jobposting_schema`, or `google_jobs`,
with an optional `?query=` to filter by title/description. Import a single
posting with `POST /api/jobs/import-url`.

## Architecture

```
scrapers/*  →  services/ingestion.py  →  Postgres (raw jobs)
                                       →  rag/embeddings.py → vector_store.py (Chroma)

Frontend (React) → /api/search, /api/chat → rag/retriever.py + rag/chat.py (Claude)
```

- **Backend**: FastAPI, SQLAlchemy + Postgres for structured job data, Chroma
  for the vector index, Anthropic's Claude for RAG answers.
- **Frontend**: React + Vite + TypeScript + Tailwind. Search bar + job cards +
  a chat panel for conversational search.

## Getting started

### Backend
Requires Python ≤3.12 — `chromadb`'s `onnxruntime` dependency doesn't yet
ship wheels for newer versions. (The Docker image already pins 3.12, so
`docker compose up` is unaffected regardless of your local Python.)
```bash
cd backend
cp .env.example .env   # fill in ANTHROPIC_API_KEY and DB settings
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Everything via Docker
```bash
docker compose up --build
```

## Project layout

```
backend/
  app/
    core/        # config, db session
    models/      # SQLAlchemy models
    schemas/     # Pydantic schemas
    api/routes/  # FastAPI routers (jobs, search, chat)
    scrapers/    # JobSource interface + per-site adapters
    rag/         # embeddings, vector store, retriever, chat
    services/    # ingestion pipeline tying scrapers → db → vector store
frontend/
  src/
    api/         # typed fetch client
    components/  # JobCard, SearchBar, ChatPanel
    pages/       # Home
```
