from app.scrapers.base import JobSource, RawJob


class FacebookSource(JobSource):
    """Facebook Jobs (the marketplace jobs product) has been discontinued in
    most regions, and Meta's Terms of Service prohibit automated scraping.
    There is no general-purpose compliant path to Facebook job listings at
    the moment; if a specific Graph API permission becomes available for
    your use case, implement it here. Otherwise, drop this source.
    """

    name = "facebook"

    def fetch(self, query: str, limit: int = 50) -> list["RawJob"]:
        raise NotImplementedError(
            "Facebook Jobs has no general compliant API. See module "
            "docstring before implementing this source."
        )
