import socket
from unittest.mock import patch

import pytest

from app.core.url_safety import ensure_safe_url


def _addrinfo(ip: str):
    return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, 0))]


def test_rejects_non_http_scheme():
    with pytest.raises(ValueError):
        ensure_safe_url("ftp://example.com/file")


def test_rejects_url_with_no_host():
    with pytest.raises(ValueError):
        ensure_safe_url("http:///path")


def test_rejects_loopback_address():
    with patch("app.core.url_safety.socket.getaddrinfo", return_value=_addrinfo("127.0.0.1")):
        with pytest.raises(ValueError):
            ensure_safe_url("http://localhost/")


def test_rejects_cloud_metadata_address():
    with patch("app.core.url_safety.socket.getaddrinfo", return_value=_addrinfo("169.254.169.254")):
        with pytest.raises(ValueError):
            ensure_safe_url("http://metadata.internal/")


def test_rejects_private_range_address():
    with patch("app.core.url_safety.socket.getaddrinfo", return_value=_addrinfo("10.0.0.5")):
        with pytest.raises(ValueError):
            ensure_safe_url("http://internal-service/")


def test_allows_public_address():
    with patch("app.core.url_safety.socket.getaddrinfo", return_value=_addrinfo("93.184.216.34")):
        ensure_safe_url("http://example.com/")  # should not raise


def test_rejects_unresolvable_host():
    with patch("app.core.url_safety.socket.getaddrinfo", side_effect=socket.gaierror):
        with pytest.raises(ValueError):
            ensure_safe_url("http://does-not-exist.invalid/")
