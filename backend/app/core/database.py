from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _add_column_if_missing(inspector, table: str, column: str, ddl_type: str) -> None:
    if table not in inspector.get_table_names():
        return
    columns = {col["name"] for col in inspector.get_columns(table)}
    if column not in columns:
        with engine.begin() as conn:
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}"))


def run_lightweight_migrations() -> None:
    """Patch columns added after a table already existed on disk.

    Base.metadata.create_all only creates missing tables, so a column added
    to a model after someone already has a local dev.db needs a manual ALTER.
    Small, additive, idempotent - not a substitute for real migrations if
    this app ever needs multi-step schema changes.
    """
    inspector = inspect(engine)
    _add_column_if_missing(inspector, "saved_jobs", "status", "VARCHAR(20) DEFAULT 'saved'")
    for column in ("linkedin_url", "indeed_url", "upwork_url"):
        _add_column_if_missing(inspector, "users", column, "VARCHAR(512) DEFAULT ''")
    _add_column_if_missing(inspector, "users", "github_username", "VARCHAR(128) DEFAULT ''")
    _add_column_if_missing(inspector, "jobs", "salary_range", "VARCHAR(128) DEFAULT ''")
    _add_column_if_missing(inspector, "jobs", "is_active", "BOOLEAN DEFAULT TRUE")
    # Existing admin_accounts rows predate the role column entirely - default
    # them to 'admin' (their original, only level of access) rather than the
    # model's 'editor' default for brand-new signups, so this migration
    # never quietly demotes someone who already had full access.
    _add_column_if_missing(inspector, "admin_accounts", "role", "VARCHAR(20) DEFAULT 'admin'")
    _add_column_if_missing(inspector, "blog_posts", "image_url", "VARCHAR(1024) DEFAULT ''")
    _add_column_if_missing(inspector, "blog_posts", "tags", "VARCHAR(512) DEFAULT ''")
