"""Polite, cache-backed HTTP fetching."""

from __future__ import annotations

import hashlib
import http.client
import time
import urllib.request
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit, urlunsplit

USER_AGENT = "HinduTextsBot/0.1 (+https://github.com/finosampat/testcode; contact via repository issues)"


class Fetcher:
    def __init__(self, cache_dir: Path, user_agent: str = USER_AGENT, crawl_delay: float = 10.0) -> None:
        self.cache_dir = cache_dir
        self.user_agent = user_agent
        self.crawl_delay = crawl_delay
        self._last_request: float | None = None
        self.cache_dir.mkdir(parents=True, exist_ok=True)

    def _wait(self) -> None:
        if self._last_request is None:
            return
        remaining = self.crawl_delay - (time.monotonic() - self._last_request)
        if remaining > 0:
            time.sleep(remaining)

    @staticmethod
    def encode_url(url: str) -> str:
        """Percent-encode non-ASCII path/query characters (some source links use native scripts)."""
        parts = urlsplit(url)
        return urlunsplit(
            (
                parts.scheme,
                parts.netloc,
                quote(parts.path, safe="/%:@&=+$,~*'()!"),
                quote(parts.query, safe="/%:@&=+$,~*'()!?"),
                parts.fragment,
            )
        )

    def _request(self, url: str, attempts: int = 4) -> bytes:
        url = self.encode_url(url)
        request = urllib.request.Request(url, headers={"User-Agent": self.user_agent})
        last_error: Exception | None = None
        for attempt in range(attempts):
            self._wait()
            try:
                with urllib.request.urlopen(request, timeout=180) as response:
                    return response.read()
            except (OSError, http.client.HTTPException) as error:
                last_error = error
                time.sleep(min(2**attempt, 30))
            finally:
                self._last_request = time.monotonic()
        raise RuntimeError(f"failed to fetch {url} after {attempts} attempts: {last_error}")

    def cache_path(self, url: str) -> Path:
        name = unquote(Path(urlsplit(url).path).name) or "index"
        digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:10]
        safe = "".join(c if c.isalnum() or c in "-._" else "_" for c in name)
        return self.cache_dir / f"{digest}-{safe}"

    def binary(self, url: str, refresh: bool = False) -> Path:
        """Download ``url`` into the cache and return the local path."""
        path = self.cache_path(url)
        if path.exists() and not refresh:
            return path
        path.write_bytes(self._request(url))
        return path

    def text(self, url: str, refresh: bool = False) -> str:
        return self.binary(url, refresh=refresh).read_bytes().decode("utf-8", "replace")

    def text_uncached(self, url: str) -> str:
        return self._request(url).decode("utf-8", "replace")
