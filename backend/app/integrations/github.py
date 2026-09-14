"""Reads a GitHub user's public profile via GitHub's public REST API
(https://docs.github.com/en/rest) - no auth token or scraping involved,
just the same data anyone's profile page already shows. Used to surface a
candidate's real languages/activity for CV context and personalized search.

Unlike LinkedIn, Indeed, and Upwork, GitHub has no anti-scraping wall and
offers this data through a documented, ToS-compliant public API - that's
the only reason this integration exists for GitHub specifically.
"""

from collections import Counter

import httpx
from fastapi import HTTPException

from app.schemas.auth import GithubStats

_BASE = "https://api.github.com"


def fetch_github_stats(username: str) -> GithubStats:
    username = username.strip().lstrip("@")
    if not username:
        raise HTTPException(status_code=400, detail="GitHub username is required")

    profile_res = httpx.get(f"{_BASE}/users/{username}", timeout=10.0)
    if profile_res.status_code == 404:
        raise HTTPException(status_code=404, detail=f"No GitHub user named '{username}'")
    profile_res.raise_for_status()
    profile = profile_res.json()

    repos_res = httpx.get(
        f"{_BASE}/users/{username}/repos",
        params={"sort": "updated", "per_page": 15},
        timeout=10.0,
    )
    languages: list[str] = []
    if repos_res.status_code == 200:
        counts = Counter(repo["language"] for repo in repos_res.json() if repo.get("language"))
        languages = [lang for lang, _ in counts.most_common(6)]

    return GithubStats(
        username=profile.get("login", username),
        name=profile.get("name") or "",
        bio=profile.get("bio") or "",
        public_repos=profile.get("public_repos", 0),
        followers=profile.get("followers", 0),
        top_languages=languages,
        avatar_url=profile.get("avatar_url", ""),
        profile_url=profile.get("html_url", f"https://github.com/{username}"),
    )
