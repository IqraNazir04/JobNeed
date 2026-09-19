import pyotp
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import (
    ADMIN_PENDING_SUBJECT_PREFIX,
    ADMIN_SUBJECT_PREFIX,
    get_current_admin,
    get_current_admin_account,
    get_current_user,
    require_admin_role,
)
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token, hash_password, verify_password
from app.integrations.github import fetch_github_stats
from app.models.admin import AdminAccount
from app.models.cv import CVRecord
from app.models.job import Job
from app.models.saved_job import SavedJob
from app.models.user import User
from app.schemas.auth import (
    AdminAccountCreate,
    AdminAccountOut,
    AdminDashboardOut,
    AdminLoginRequest,
    AdminLoginResponse,
    AdminPasswordChangeRequest,
    AdminRoleUpdateRequest,
    AdminTotpConfirmRequest,
    AdminTotpDisableRequest,
    AdminTotpLoginRequest,
    AdminTotpSetupResponse,
    GithubStats,
    LoginRequest,
    ProfileUpdateRequest,
    TokenResponse,
    UserAdminOut,
    UserCreate,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_PENDING_TOTP_EXPIRE_MINUTES = 5


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.linkedin_url = payload.linkedin_url
    current_user.indeed_url = payload.indeed_url
    current_user.upwork_url = payload.upwork_url
    current_user.github_username = payload.github_username
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/github-stats/{username}", response_model=GithubStats)
def github_stats(username: str, current_user: User = Depends(get_current_user)):
    return fetch_github_stats(username)


def _get_admin_or_404(db: Session, email: str) -> AdminAccount:
    admin = db.query(AdminAccount).filter(AdminAccount.email == email).first()
    if admin is None:
        raise HTTPException(status_code=404, detail="Admin account not found")
    return admin


@router.post("/admin-login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    """Separate login for the job-board admin panel - checked against the
    admin_accounts table, never against the `users` table. An admin's
    access and password are entirely independent of any regular job-seeker
    account, even one that happens to share the same email."""
    email = payload.email.strip().lower()
    admin = db.query(AdminAccount).filter(AdminAccount.email == email).first()
    if admin is None or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid admin email or password")

    if admin.totp_enabled:
        pending = create_access_token(
            f"{ADMIN_PENDING_SUBJECT_PREFIX}{email}", expire_minutes=_PENDING_TOTP_EXPIRE_MINUTES
        )
        return AdminLoginResponse(requires_totp=True, pending_token=pending)

    token = create_access_token(f"{ADMIN_SUBJECT_PREFIX}{email}")
    return AdminLoginResponse(access_token=token, email=email, role=admin.role)


@router.post("/admin-login/totp", response_model=AdminLoginResponse)
def admin_login_totp(payload: AdminTotpLoginRequest, db: Session = Depends(get_db)):
    """Second step of admin login when two-factor is enabled - takes the
    short-lived pending_token from /admin-login plus a code from the
    admin's authenticator app."""
    subject = decode_access_token(payload.pending_token)
    if not subject or not subject.startswith(ADMIN_PENDING_SUBJECT_PREFIX):
        raise HTTPException(status_code=401, detail="That login attempt expired — log in again.")

    email = subject.removeprefix(ADMIN_PENDING_SUBJECT_PREFIX)
    admin = db.query(AdminAccount).filter(AdminAccount.email == email).first()
    if admin is None or not admin.totp_enabled or not admin.totp_secret:
        raise HTTPException(status_code=401, detail="Two-factor is not set up for this account.")

    if not pyotp.TOTP(admin.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=401, detail="Invalid authentication code.")

    token = create_access_token(f"{ADMIN_SUBJECT_PREFIX}{email}")
    return AdminLoginResponse(access_token=token, email=email, role=admin.role)


@router.get("/admin-accounts", response_model=list[AdminAccountOut])
def list_admin_accounts(db: Session = Depends(get_db), _admin: str = Depends(get_current_admin)):
    return db.query(AdminAccount).order_by(AdminAccount.created_at).all()


@router.post("/admin-accounts", response_model=AdminAccountOut, status_code=201)
def create_admin_account(
    payload: AdminAccountCreate,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(require_admin_role),
):
    """Add another admin. Requires being logged in as an existing account
    with the "admin" role (not "editor") — there's no public
    self-registration path onto the job-board admin panel, and editors
    can't grant themselves or anyone else more access."""
    email = payload.email.strip().lower()
    if db.query(AdminAccount).filter(AdminAccount.email == email).first() is not None:
        raise HTTPException(status_code=400, detail="That email is already an admin.")
    admin = AdminAccount(email=email, hashed_password=hash_password(payload.password), role=payload.role)
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def _admin_role_count(db: Session) -> int:
    return db.query(AdminAccount).filter(AdminAccount.role == "admin").count()


@router.delete("/admin-accounts/{email}", status_code=204)
def delete_admin_account(
    email: str,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(require_admin_role),
):
    admin = _get_admin_or_404(db, email.strip().lower())
    if admin.role == "admin" and _admin_role_count(db) <= 1:
        raise HTTPException(
            status_code=400, detail="Can't remove the last account with the admin role."
        )
    db.delete(admin)
    db.commit()


@router.patch("/admin-accounts/{email}/role", response_model=AdminAccountOut)
def update_admin_role(
    email: str,
    payload: AdminRoleUpdateRequest,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(require_admin_role),
):
    admin = _get_admin_or_404(db, email.strip().lower())
    if admin.role == "admin" and payload.role != "admin" and _admin_role_count(db) <= 1:
        raise HTTPException(
            status_code=400,
            detail="Can't demote the last account with the admin role — promote another account first.",
        )
    admin.role = payload.role
    db.commit()
    db.refresh(admin)
    return admin


@router.post("/admin-password")
def change_admin_password(
    payload: AdminPasswordChangeRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    admin = _get_admin_or_404(db, current_admin)
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect.")
    admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"status": "ok"}


@router.post("/admin-totp/setup", response_model=AdminTotpSetupResponse)
def setup_admin_totp(db: Session = Depends(get_db), current_admin: str = Depends(get_current_admin)):
    """Generates a new secret and a scannable otpauth:// URL but doesn't
    turn 2FA on yet — that only happens once the admin proves they can
    produce a valid code with /admin-totp/confirm, so an abandoned setup
    never locks anyone out of their own account."""
    admin = _get_admin_or_404(db, current_admin)
    secret = pyotp.random_base32()
    admin.totp_secret = secret
    admin.totp_enabled = False
    db.commit()
    otpauth_url = pyotp.TOTP(secret).provisioning_uri(name=current_admin, issuer_name="JobNeed")
    return AdminTotpSetupResponse(secret=secret, otpauth_url=otpauth_url)


@router.post("/admin-totp/confirm")
def confirm_admin_totp(
    payload: AdminTotpConfirmRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    admin = _get_admin_or_404(db, current_admin)
    if not admin.totp_secret:
        raise HTTPException(status_code=400, detail="Start setup first.")
    if not pyotp.TOTP(admin.totp_secret).verify(payload.code, valid_window=1):
        raise HTTPException(status_code=400, detail="Invalid code — try again.")
    admin.totp_enabled = True
    db.commit()
    return {"status": "ok"}


@router.post("/admin-totp/disable")
def disable_admin_totp(
    payload: AdminTotpDisableRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    admin = _get_admin_or_404(db, current_admin)
    if not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password.")
    admin.totp_enabled = False
    admin.totp_secret = None
    db.commit()
    return {"status": "ok"}


@router.get("/admin-dashboard", response_model=AdminDashboardOut)
def admin_dashboard(
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    """A quick at-a-glance view of the system - available to any admin
    (editor or admin), since it's read-only and informational."""
    recent_jobs = (
        db.query(Job)
        .filter(Job.source == "jobneed")
        .order_by(Job.fetched_at.desc())
        .limit(5)
        .all()
    )
    recent_users = db.query(User).order_by(User.created_at.desc()).limit(5).all()

    activity = [
        {"type": "job_posted", "label": f"{job.title} at {job.company}", "timestamp": job.fetched_at}
        for job in recent_jobs
    ] + [
        {"type": "user_signup", "label": user.email, "timestamp": user.created_at}
        for user in recent_users
    ]
    activity.sort(key=lambda item: item["timestamp"], reverse=True)

    return AdminDashboardOut(
        total_jobs_indexed=db.query(Job).count(),
        active_board_postings=db.query(Job)
        .filter(Job.source == "jobneed", Job.is_active.is_(True))
        .count(),
        total_users=db.query(User).count(),
        total_admins=db.query(AdminAccount).count(),
        recent_activity=activity[:8],
    )


@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(require_admin_role),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(require_admin_role),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Clear out rows that reference this user first - Postgres enforces the
    # foreign keys even though local dev's SQLite usually doesn't.
    db.query(SavedJob).filter(SavedJob.user_id == user_id).delete()
    db.query(CVRecord).filter(CVRecord.user_id == user_id).delete()
    db.delete(user)
    db.commit()
