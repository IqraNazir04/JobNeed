from app.scrapers.sample import SampleSource


def test_fetch_with_empty_query_returns_all_fixtures():
    jobs = SampleSource().fetch("")
    assert len(jobs) == 3
    assert {j.id for j in jobs} == {"sample-1", "sample-2", "sample-3"}


def test_fetch_filters_by_title_or_description():
    jobs = SampleSource().fetch("react")
    assert len(jobs) == 1
    assert jobs[0].id == "sample-2"


def test_fetch_is_case_insensitive():
    jobs = SampleSource().fetch("REACT")
    assert len(jobs) == 1


def test_fetch_respects_limit():
    jobs = SampleSource().fetch("", limit=1)
    assert len(jobs) == 1


def test_fetch_no_match_returns_empty_list():
    assert SampleSource().fetch("no-such-role-xyz") == []
