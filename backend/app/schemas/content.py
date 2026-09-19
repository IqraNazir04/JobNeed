from datetime import datetime

from pydantic import BaseModel, Field


class BlogPostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    image_url: str = Field(default="", max_length=1024)
    tags: str = Field(default="", max_length=512)
    published: bool = False
    scheduled_for: datetime | None = None


class BlogPostUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    image_url: str = Field(default="", max_length=1024)
    tags: str = Field(default="", max_length=512)
    published: bool = False
    scheduled_for: datetime | None = None


class BlogPostOut(BaseModel):
    id: str
    title: str
    content: str
    author_email: str
    image_url: str
    tags: str
    published: bool
    scheduled_for: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SocialLinkCreate(BaseModel):
    platform: str = Field(min_length=1, max_length=64)
    url: str = Field(min_length=1, max_length=1024)
    display_order: int = 0


class SocialLinkUpdate(BaseModel):
    platform: str = Field(min_length=1, max_length=64)
    url: str = Field(min_length=1, max_length=1024)
    display_order: int = 0


class SocialLinkOut(BaseModel):
    id: str
    platform: str
    url: str
    display_order: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChartSeriesPoint(BaseModel):
    date: str
    jobs_posted: int
    user_signups: int


class DashboardChartOut(BaseModel):
    series: list[ChartSeriesPoint]
