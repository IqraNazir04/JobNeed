from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

AdminRole = Literal["admin", "editor"]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    linkedin_url: str = ""
    indeed_url: str = ""
    upwork_url: str = ""
    github_username: str = ""

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    """Either a full session (requires_totp=False) or a signal that a
    second factor is needed (requires_totp=True + a short-lived
    pending_token to present alongside the TOTP code)."""

    requires_totp: bool = False
    access_token: str | None = None
    token_type: str = "bearer"
    email: str | None = None
    role: AdminRole | None = None
    pending_token: str | None = None


class AdminTotpLoginRequest(BaseModel):
    pending_token: str
    code: str


class AdminAccountOut(BaseModel):
    email: str
    role: AdminRole
    totp_enabled: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminAccountCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=256)
    role: AdminRole = "editor"


class AdminRoleUpdateRequest(BaseModel):
    role: AdminRole


class AdminPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=256)


class AdminTotpSetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class AdminTotpConfirmRequest(BaseModel):
    code: str


class AdminTotpDisableRequest(BaseModel):
    password: str


class ProfileUpdateRequest(BaseModel):
    linkedin_url: str = ""
    indeed_url: str = ""
    upwork_url: str = ""
    github_username: str = ""


class GithubStats(BaseModel):
    username: str
    name: str = ""
    bio: str = ""
    public_repos: int = 0
    followers: int = 0
    top_languages: list[str] = []
    avatar_url: str = ""
    profile_url: str = ""


class UserAdminOut(BaseModel):
    id: str
    email: str
    created_at: datetime
    linkedin_url: str = ""
    github_username: str = ""

    model_config = {"from_attributes": True}


class ActivityItem(BaseModel):
    type: Literal["job_posted", "user_signup"]
    label: str
    timestamp: datetime


class AdminDashboardOut(BaseModel):
    total_jobs_indexed: int
    active_board_postings: int
    total_users: int
    total_admins: int
    recent_activity: list[ActivityItem]
