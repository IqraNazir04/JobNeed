"""Blocks server-side requests to internal/private network addresses.

Any endpoint that fetches a URL supplied by a caller (e.g. importing a job
posting by pasting its link) is a potential SSRF vector: without this check,
a caller could point the server at http://169.254.169.254/ (cloud metadata),
http://localhost:..., or an internal-only service and read back the
response. This validates both the initial URL and every redirect hop.
"""

import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = {"http", "https"}


def _is_unsafe_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def ensure_safe_url(url: str) -> None:
    """Raises ValueError if the URL is not a safe, public http(s) address."""
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("Only http:// and https:// URLs are allowed.")
    if not parsed.hostname:
        raise ValueError("That doesn't look like a valid URL.")

    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror:
        raise ValueError("Could not resolve that URL's host.")

    if not infos:
        raise ValueError("Could not resolve that URL's host.")

    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if _is_unsafe_ip(ip):
            raise ValueError("That URL points to a private or internal address, which isn't allowed.")
