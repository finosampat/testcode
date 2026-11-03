"""robots.txt evaluation for a single host."""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit
from urllib.robotparser import RobotFileParser


@dataclass
class RobotsDecision:
    url: str
    allowed: bool


class RobotsPolicy:
    def __init__(self, robots_url: str, user_agent: str, body: str, crawl_delay: float) -> None:
        self.robots_url = robots_url
        self.user_agent = user_agent
        self.body = body
        self.crawl_delay = crawl_delay
        self._parser = RobotFileParser()
        self._parser.set_url(robots_url)
        self._parser.parse(body.splitlines())

    @classmethod
    def fetch(cls, any_url: str, user_agent: str, fetch_text, default_crawl_delay: float = 10.0) -> RobotsPolicy:
        parts = urlsplit(any_url)
        robots_url = urlunsplit((parts.scheme, parts.netloc, "/robots.txt", "", ""))
        body = fetch_text(robots_url)
        policy = cls(robots_url, user_agent, body, default_crawl_delay)
        declared = policy._parser.crawl_delay(user_agent)
        if declared is not None:
            policy.crawl_delay = max(float(declared), 0.0)
        return policy

    def can_fetch(self, url: str) -> RobotsDecision:
        return RobotsDecision(url=url, allowed=bool(self._parser.can_fetch(self.user_agent, url)))

    def check_all(self, urls: list[str]) -> list[RobotsDecision]:
        return [self.can_fetch(u) for u in urls]
