import json
from unittest import TestCase
from urllib.parse import parse_qs, urlparse

from app.lib.jobs_scraper.rules import get_job_source_from_url, get_source_job_id
from app.lib.scraping.crawl4ai import (
    CrawlResult,
    build_search_urls,
    extract_job_urls,
    is_blocked,
    is_indeed_listing,
    normalize_job_url,
    read_indeed_posted_labels,
)
from app.modules.jobs_scraper.schemas import DEFAULT_JOB_SCRAPER_CONFIG


class IndeedTest(TestCase):
    def test_search_uses_role_and_date_window(self) -> None:
        config = DEFAULT_JOB_SCRAPER_CONFIG.model_copy(
            update={"sources": ["Indeed"], "roles": ["React / Next.js"]}
        )
        parsed = urlparse(build_search_urls(config)[0])
        self.assertEqual(parsed.netloc, "ph.indeed.com")
        self.assertEqual(
            parse_qs(parsed.query),
            {
                "q": ["React / Next.js"],
                "l": ["Philippines"],
                "fromage": ["1"],
                "sort": ["date"],
            },
        )

    def test_tracking_links_preserve_distinct_job_ids(self) -> None:
        ids = ["c58dcfbe410f0392", "018aef0e739c7ac9"]
        result = CrawlResult.model_validate(
            {
                "success": True,
                "url": "https://ph.indeed.com/jobs?q=Next.js",
                "links": {
                    "internal": [
                        {
                            "href": f"https://ph.indeed.com/rc/clk?jk={ids[0]}&from=search"
                        },
                        {"href": f"https://ph.indeed.com/viewjob?jk={ids[0]}"},
                        {"href": f"https://ph.indeed.com/pagead/clk?jk={ids[1]}"},
                    ]
                },
            }
        )
        urls = extract_job_urls([result], "Indeed")
        self.assertEqual(urls, [f"https://ph.indeed.com/viewjob?jk={id}" for id in ids])
        self.assertEqual([get_source_job_id(url, "Indeed") for url in urls], ids)
        self.assertEqual(get_job_source_from_url(urls[0]), "Indeed")

    def test_rejects_missing_malformed_duplicate_ids_and_other_hosts(self) -> None:
        for url in (
            "https://ph.indeed.com/viewjob",
            "https://ph.indeed.com/viewjob?jk=invalid",
            "https://ph.indeed.com/jobs?jk=c58dcfbe410f0392",
            "https://ph.indeed.com/viewjob?jk=c58dcfbe410f0392&jk=018aef0e739c7ac9",
            "https://ph.indeed.com.example.org/viewjob?jk=c58dcfbe410f0392",
        ):
            with self.subTest(url=url):
                self.assertEqual(normalize_job_url(url, "Indeed"), "")

    def test_embedded_pane_must_be_the_requested_full_listing(self) -> None:
        url = normalize_job_url(
            "https://ph.indeed.com/viewjob?viewtype=embedded&jk=c58dcfbe410f0392",
            "Indeed",
        )
        self.assertEqual(url, "https://ph.indeed.com/viewjob?jk=c58dcfbe410f0392")
        company = "[Optimum](https://ph.indeed.com/cmp/x?fromjk={})\n"
        listing = "#### Full job description\nBuild React UIs."
        self.assertTrue(
            is_indeed_listing(company.format("c58dcfbe410f0392") + listing, url)
        )
        self.assertTrue(is_indeed_listing(listing, url))
        self.assertFalse(
            is_indeed_listing(company.format("018aef0e739c7ac9") + listing, url)
        )
        self.assertFalse(is_indeed_listing("Create an account or sign in.", url))

    def test_posted_labels_use_search_card_create_date_in_manila(self) -> None:
        cards = {
            "metaData": {
                "mosaicProviderJobCardsModel": {
                    "results": [
                        {
                            "jobkey": "aa41587ceac11281",
                            "createDate": 1792761900000,
                            "pubDate": 1792731600000,
                            "formattedRelativeTime": "1 day ago",
                        },
                        {"jobkey": "018aef0e739c7ac9"},
                    ]
                }
            }
        }
        html = f'<script>window.mosaic.providerData["mosaic-provider-jobcards"]={json.dumps(cards)};</script>'
        results = [
            CrawlResult(success=True, url="https://ph.indeed.com/jobs?q=x", html=html),
            CrawlResult(
                success=True, url="https://ph.indeed.com/jobs?q=y", html="<p>none</p>"
            ),
        ]
        self.assertEqual(
            read_indeed_posted_labels(results),
            {
                "aa41587ceac11281": "Posted on Indeed: 1 day ago (2026-10-23T21:25+08:00)"
            },
        )

    def test_signin_and_http_blocks_are_not_job_documents(self) -> None:
        for status in (401, 403, 429):
            self.assertTrue(
                is_blocked(
                    CrawlResult(
                        success=True,
                        url="https://ph.indeed.com/viewjob?jk=c58dcfbe410f0392",
                        status_code=status,
                        markdown="Create an account or sign in.",
                    )
                )
            )
