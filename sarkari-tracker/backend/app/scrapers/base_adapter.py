import hashlib
import httpx
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from app.scrapers.rate_limiter import domain_rate_limiter

class ScrapedListingItem(BaseModel):
    title: str
    url: str
    date_str: Optional[str] = None
    category_hint: Optional[str] = None
    is_pdf: bool = False

class RawFetchResult(BaseModel):
    url: str
    http_status: int
    content_bytes: bytes
    content_hash: str
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    is_unchanged: bool = False

class BaseSourceAdapter(ABC):
    """
    Standard interface implemented by each official examination portal adapter.
    """
    def __init__(self, exam_config: Dict[str, Any]):
        self.config = exam_config
        self.exam_slug = exam_config["slug"]
        self.conducting_body = exam_config["conducting_body"]
        self.urls = exam_config["official_urls"]

    async def fetch_page(
        self, 
        url: str, 
        previous_etag: Optional[str] = None, 
        previous_hash: Optional[str] = None
    ) -> RawFetchResult:
        """
        Executes rate-limited HTTP GET with conditional headers (ETag, If-Modified-Since).
        Calculates SHA-256 to guarantee idempotency and content integrity.
        """
        await domain_rate_limiter.acquire(url)
        headers = {
            "User-Agent": domain_rate_limiter.get_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/pdf,*/*",
        }
        if previous_etag:
            headers["If-None-Match"] = previous_etag

        # Backoff retry logic (up to 2 attempts with 5s timeout)
        max_attempts = 2
        for attempt in range(1, max_attempts + 1):
            try:
                async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                    resp = await client.get(url, headers=headers)
                    
                    if resp.status_code == 304:
                        return RawFetchResult(
                            url=url,
                            http_status=304,
                            content_bytes=b"",
                            content_hash=previous_hash or "",
                            etag=previous_etag,
                            is_unchanged=True
                        )

                    resp.raise_for_status()
                    content = resp.content
                    content_hash = hashlib.sha256(content).hexdigest()
                    is_unchanged = (content_hash == previous_hash)

                    return RawFetchResult(
                        url=str(resp.url),
                        http_status=resp.status_code,
                        content_bytes=content,
                        content_hash=content_hash,
                        etag=resp.headers.get("ETag"),
                        last_modified=resp.headers.get("Last-Modified"),
                        is_unchanged=is_unchanged
                    )
            except Exception as e:
                if attempt == max_attempts:
                    raise RuntimeError(f"Failed to fetch {url} after {max_attempts} attempts: {str(e)}") from e
                import asyncio
                await asyncio.sleep(1.0 * attempt)

    @abstractmethod
    async def fetch_listing(self) -> List[ScrapedListingItem]:
        """
        Fetches the primary recruitment / 'What's New' listing page.
        """
        pass

    @abstractmethod
    async def fetch_detail(self, item: ScrapedListingItem) -> RawFetchResult:
        """
        Fetches detailed page or official PDF notification.
        """
        pass

    @abstractmethod
    def parse_events(self, raw: RawFetchResult, listing_item: ScrapedListingItem) -> List[Dict[str, Any]]:
        """
        Extracts candidate events (e.g. NOTIFICATION_PUBLISHED, ADMIT_CARD_RELEASED).
        """
        pass
