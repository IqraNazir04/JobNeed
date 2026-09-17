from pydantic import BaseModel, EmailStr, Field


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


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str


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
