from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.admin import AdminAccount


def ensure_bootstrap_admins(db: Session) -> None:
    """Seeds admin_accounts from ADMIN_EMAILS/ADMIN_PASSWORD in .env, but
    only for emails that don't already have a row there. Once an admin
    account exists in the database, .env no longer has any say over its
    password — a change made through the admin panel (or a new admin added
    through it) survives a restart instead of being overwritten by this."""
    if not settings.admin_password:
        return
    for email in settings.admin_email_set:
        exists = db.query(AdminAccount).filter(AdminAccount.email == email).first()
        if exists is None:
            db.add(AdminAccount(email=email, hashed_password=hash_password(settings.admin_password)))
    db.commit()
