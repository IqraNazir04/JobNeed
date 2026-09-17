from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-5"

    database_url: str = "postgresql+psycopg://jobneed:jobneed@localhost:5432/jobneed"

    chroma_persist_dir: str = "./data/chroma"
    chroma_collection: str = "jobs"

    indeed_publisher_id: str = ""
    serpapi_api_key: str = ""
    linkedin_api_token: str = ""

    # Greenhouse and Lever both run public, unauthenticated job-board APIs
    # that companies use to power their own careers pages, so these need no
    # API key. Comma-separated company board tokens (found in the URL of a
    # company's careers page), e.g. "gitlab,cloudflare".
    greenhouse_boards: str = "gitlab"
    lever_boards: str = ""

    # Ashby's job board API works the same way - public, no key, meant for
    # embedding a company's postings elsewhere. Comma-separated board
    # names (found in a company's jobs.ashbyhq.com/<name> URL).
    ashby_boards: str = ""

    # Company career pages known to publish schema.org JobPosting structured
    # data (https://developers.google.com/search/docs/appearance/structured-data/job-posting)
    # - comma-separated URLs.
    jobposting_urls: str = (
        "https://barclays.wd3.myworkdayjobs.com/en-US/External_Career_Site_Barclays/"
        "job/Software-Engineer_JR-0000121832-4"
    )

    # Signs auth tokens. MUST be overridden via JWT_SECRET_KEY in .env for
    # anything beyond local dev - anyone with this value can forge sessions.
    jwt_secret_key: str = "dev-insecure-secret-change-me-in-your-own-dotenv-file"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Job-board admin panel. Deliberately decoupled from regular user
    # accounts - logging in here never involves the `users` table at all,
    # so an admin's access doesn't depend on (or share a password with) any
    # job-seeker account that happens to use the same email. Comma-separated
    # allowlist of emails, checked against a single shared ADMIN_PASSWORD.
    admin_emails: str = ""
    admin_password: str = ""

    @property
    def admin_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.admin_emails.split(",") if e.strip()}


settings = Settings()
