from unittest import IsolatedAsyncioTestCase, TestCase
from unittest.mock import AsyncMock, patch
from urllib.parse import parse_qs, urlparse

import httpx

from app.lib.jobs_scraper.rules import get_job_source_from_url, get_source_job_id
from app.lib.scraping.crawl4ai import (
    CrawlResult,
    build_search_urls,
    crawl_urls,
    extract_job_urls,
    normalize_job_url,
)
from app.modules.jobs_scraper.schemas import DEFAULT_JOB_SCRAPER_CONFIG


class OnlineJobsTest(TestCase):
    def test_search_uses_configured_roles_and_all_employment_types(self) -> None:
        config = DEFAULT_JOB_SCRAPER_CONFIG.model_copy(
            update={"sources": ["OnlineJobs.ph"], "roles": ["React / Next.js"]}
        )
        urls = build_search_urls(config)
        self.assertEqual(len(urls), 1)
        parsed = urlparse(urls[0])
        self.assertEqual(parsed.netloc, "www.onlinejobs.ph")
        self.assertEqual(parsed.path, "/jobseekers/jobsearch")
        self.assertEqual(
            parse_qs(parsed.query),
            {
                "jobkeyword": ["React / Next.js"],
                "gig": ["on"],
                "partTime": ["on"],
                "fullTime": ["on"],
                "isFromJobsearchForm": ["1"],
            },
        )

    def test_extracts_deduplicated_listing_links_and_numeric_id(self) -> None:
        url = "https://www.onlinejobs.ph/jobseekers/job/full-stack-developer-1755576"
        result = CrawlResult.model_validate(
            {
                "success": True,
                "url": "https://www.onlinejobs.ph/jobseekers/jobsearch",
                "links": {
                    "internal": [
                        {"href": url},
                        {"href": f"{url}?tracking=search"},
                        {"href": "https://www.onlinejobs.ph/jobseekers/jobsearch"},
                    ]
                },
            }
        )
        self.assertEqual(extract_job_urls([result], "OnlineJobs.ph"), [url])
        self.assertEqual(get_job_source_from_url(url), "OnlineJobs.ph")
        self.assertEqual(get_source_job_id(url, "OnlineJobs.ph"), "1755576")
        self.assertEqual(
            normalize_job_url(url.replace("www.", ""), "OnlineJobs.ph"), url
        )

    def test_rejects_other_hosts_and_non_listing_paths(self) -> None:
        for url in (
            "https://onlinejobs.ph.example.com/jobseekers/job/developer-1755576",
            "https://www.onlinejobs.ph/jobseekers/jobsearch",
            "https://www.onlinejobs.ph/jobseekers/job/developer",
            "https://ph.jobstreet.com/job/1755576",
        ):
            with self.subTest(url=url):
                self.assertEqual(normalize_job_url(url, "OnlineJobs.ph"), "")


class OnlineJobsCrawlTest(IsolatedAsyncioTestCase):
    async def test_keeps_onlinejobs_browser_settings_separate(self) -> None:
        response = httpx.Response(200, json={"success": True, "results": []})
        post = AsyncMock(return_value=response)
        with patch("app.lib.scraping.crawl4ai.httpx.AsyncClient.post", post):
            await crawl_urls(
                [
                    "https://www.linkedin.com/jobs/view/123",
                    "https://www.onlinejobs.ph/jobseekers/job/developer-1755576",
                ]
            )

        self.assertEqual(post.await_count, 2)
        linkedin = post.call_args_list[0].kwargs["json"]
        onlinejobs = post.call_args_list[1].kwargs["json"]
        self.assertTrue(linkedin["crawler_config"]["params"]["magic"])
        self.assertFalse(onlinejobs["crawler_config"]["params"]["magic"])
        self.assertEqual(
            onlinejobs["crawler_config"]["params"]["wait_until"], "networkidle"
        )
