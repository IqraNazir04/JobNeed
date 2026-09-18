from app.core.database import SessionLocal
from app.core.security import verify_password
from app.models.admin import AdminAccount
from app.services.admin_bootstrap import ensure_bootstrap_admins


def test_bootstrap_creates_admins_from_settings(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com,two@example.com")
    monkeypatch.setattr(settings, "admin_password", "bootstrap-secret")

    db = SessionLocal()
    ensure_bootstrap_admins(db)
    accounts = {a.email: a for a in db.query(AdminAccount).all()}
    db.close()

    assert set(accounts) == {"one@example.com", "two@example.com"}
    assert verify_password("bootstrap-secret", accounts["one@example.com"].hashed_password)


def test_bootstrap_does_nothing_without_a_configured_password(monkeypatch):
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com")
    monkeypatch.setattr(settings, "admin_password", "")

    db = SessionLocal()
    ensure_bootstrap_admins(db)
    count = db.query(AdminAccount).count()
    db.close()

    assert count == 0


def test_bootstrap_never_overwrites_an_existing_admins_password(monkeypatch):
    """Once an admin changes their password through the panel, restarting
    the server (which reruns the bootstrap) must not silently revert it
    back to whatever's sitting in .env."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "admin_emails", "one@example.com")
    monkeypatch.setattr(settings, "admin_password", "original-env-password")

    db = SessionLocal()
    ensure_bootstrap_admins(db)
    admin = db.query(AdminAccount).filter(AdminAccount.email == "one@example.com").first()
    from app.core.security import hash_password

    admin.hashed_password = hash_password("changed-through-the-panel")
    db.commit()

    ensure_bootstrap_admins(db)
    db.refresh(admin)
    still_changed = verify_password("changed-through-the-panel", admin.hashed_password)
    db.close()

    assert still_changed
