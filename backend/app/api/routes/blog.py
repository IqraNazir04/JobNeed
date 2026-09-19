from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.blog_post import BlogPost
from app.schemas.content import BlogPostOut

router = APIRouter(prefix="/blog", tags=["blog"])


def _is_live(post: BlogPost, now: datetime) -> bool:
    return post.published and (post.scheduled_for is None or post.scheduled_for <= now)


@router.get("/posts", response_model=list[BlogPostOut])
def list_public_posts(db: Session = Depends(get_db)):
    """Published posts whose scheduled time (if any) has already passed - a
    draft or a post scheduled for the future never leaks onto the public
    site early just because it exists in the database."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    posts = (
        db.query(BlogPost)
        .filter(BlogPost.published.is_(True))
        .filter(or_(BlogPost.scheduled_for.is_(None), BlogPost.scheduled_for <= now))
        .all()
    )
    posts.sort(key=lambda p: p.scheduled_for or p.created_at, reverse=True)
    return posts


@router.get("/posts/{post_id}", response_model=BlogPostOut)
def get_public_post(post_id: str, db: Session = Depends(get_db)):
    post = db.get(BlogPost, post_id)
    if post is None or not _is_live(post, datetime.now(timezone.utc).replace(tzinfo=None)):
        raise HTTPException(status_code=404, detail="Post not found")
    return post
