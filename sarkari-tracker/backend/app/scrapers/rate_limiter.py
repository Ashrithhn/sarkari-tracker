import asyncio
import time
from urllib.parse import urlparse
from typing import Dict

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:129.0) Gecko/20100101 Firefox/129.0",
]

class DomainRateLimiter:
    """
    Enforces a strict 1 request per 2 seconds rate limit per domain,
    preventing any accidental hammering of official government servers.
    """
    def __init__(self, delay_seconds: float = 2.0):
        self.delay_seconds = delay_seconds
        self._last_request_time: Dict[str, float] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._ua_index = 0

    def get_user_agent(self) -> str:
        ua = USER_AGENTS[self._ua_index % len(USER_AGENTS)]
        self._ua_index += 1
        return ua

    async def acquire(self, url: str):
        domain = urlparse(url).netloc.lower()
        if domain not in self._locks:
            self._locks[domain] = asyncio.Lock()

        async with self._locks[domain]:
            now = time.monotonic()
            last_time = self._last_request_time.get(domain, 0.0)
            elapsed = now - last_time
            if elapsed < self.delay_seconds:
                sleep_duration = self.delay_seconds - elapsed
                await asyncio.sleep(sleep_duration)
            self._last_request_time[domain] = time.monotonic()

domain_rate_limiter = DomainRateLimiter(delay_seconds=2.0)
