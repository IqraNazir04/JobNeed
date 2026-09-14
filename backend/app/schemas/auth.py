from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


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
