import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_account
from app.core.database import get_db
from app.models.admin import AdminAccount
from app.models.blog_post import BlogPost
from app.models.job import Job
from app.models.social_link import SocialLink
from app.models.user import User
from app.schemas.content import (
    BlogPostCreate,
    BlogPostOut,
    BlogPostUpdate,
    ChartSeriesPoint,
    DashboardChartOut,
    SocialLinkCreate,
    SocialLinkOut,
    SocialLinkUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin-content"])

# Any admin panel role (editor or admin) can write posts and manage social
# links - these are ordinary content tasks, not account/access management,
# so they use get_current_admin_account rather than require_admin_role.

UPLOAD_DIR = Path("uploads/blog")
_ALLOWED_IMAGE_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
_MAX_UPLOAD_BYTES = 5 * 1024 * 1024


@router.post("/posts/upload-image")
async def upload_post_image(
    file: UploadFile = File(...),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    """Stores the file on disk under uploads/blog and hands back a URL to
    drop straight into a post's image_url - a plain URL field stays the
    single source of truth for "what image is on this post" whether it got
    there by upload or by pasting an existing link."""
    ext = _ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if ext is None:
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, GIF, or WebP images are allowed.")

    contents = await file.read()
    if len(contents) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be 5MB or smaller.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    (UPLOAD_DIR / filename).write_bytes(contents)

    return {"url": f"/uploads/blog/{filename}"}


def _get_post_or_404(db: Session, post_id: str) -> BlogPost:
    post = db.get(BlogPost, post_id)
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


def _get_social_link_or_404(db: Session, link_id: str) -> SocialLink:
    link = db.get(SocialLink, link_id)
    if link is None:
        raise HTTPException(status_code=404, detail="Social link not found")
    return link


@router.get("/posts", response_model=list[BlogPostOut])
def list_posts(
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    return db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()


@router.post("/posts", response_model=BlogPostOut, status_code=201)
def create_post(
    payload: BlogPostCreate,
    db: Session = Depends(get_db),
    admin: AdminAccount = Depends(get_current_admin_account),
):
    post = BlogPost(
        title=payload.title,
        content=payload.content,
        author_email=admin.email,
        image_url=payload.image_url,
        tags=payload.tags,
        published=payload.published,
        scheduled_for=payload.scheduled_for,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/posts/{post_id}", response_model=BlogPostOut)
def update_post(
    post_id: str,
    payload: BlogPostUpdate,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    post = _get_post_or_404(db, post_id)
    post.title = payload.title
    post.content = payload.content
    post.image_url = payload.image_url
    post.tags = payload.tags
    post.published = payload.published
    post.scheduled_for = payload.scheduled_for
    db.commit()
    db.refresh(post)
    return post


@router.delete("/posts/{post_id}", status_code=204)
def delete_post(
    post_id: str,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    post = _get_post_or_404(db, post_id)
    db.delete(post)
    db.commit()


@router.get("/social-links", response_model=list[SocialLinkOut])
def list_social_links(
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    return db.query(SocialLink).order_by(SocialLink.display_order, SocialLink.created_at).all()


@router.post("/social-links", response_model=SocialLinkOut, status_code=201)
def create_social_link(
    payload: SocialLinkCreate,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    link = SocialLink(platform=payload.platform, url=payload.url, display_order=payload.display_order)
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.patch("/social-links/{link_id}", response_model=SocialLinkOut)
def update_social_link(
    link_id: str,
    payload: SocialLinkUpdate,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    link = _get_social_link_or_404(db, link_id)
    link.platform = payload.platform
    link.url = payload.url
    link.display_order = payload.display_order
    db.commit()
    db.refresh(link)
    return link


@router.delete("/social-links/{link_id}", status_code=204)
def delete_social_link(
    link_id: str,
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    link = _get_social_link_or_404(db, link_id)
    db.delete(link)
    db.commit()


@router.get("/dashboard/chart-data", response_model=DashboardChartOut)
def dashboard_chart_data(
    db: Session = Depends(get_db),
    _admin: AdminAccount = Depends(get_current_admin_account),
):
    """14-day daily counts of job-board postings and user signups, for the
    dashboard's activity chart."""
    days = 14
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start, datetime.min.time())

    jobs_by_day: dict[str, int] = defaultdict(int)
    for (fetched_at,) in (
        db.query(Job.fetched_at).filter(Job.source == "jobneed", Job.fetched_at >= start_dt).all()
    ):
        jobs_by_day[fetched_at.date().isoformat()] += 1

    users_by_day: dict[str, int] = defaultdict(int)
    for (created_at,) in db.query(User.created_at).filter(User.created_at >= start_dt).all():
        users_by_day[created_at.date().isoformat()] += 1

    series = []
    for offset in range(days):
        day = (start + timedelta(days=offset)).isoformat()
        series.append(
            ChartSeriesPoint(date=day, jobs_posted=jobs_by_day.get(day, 0), user_signups=users_by_day.get(day, 0))
        )

    return DashboardChartOut(series=series)
