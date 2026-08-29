from datetime import datetime
from typing import final, override
from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, patch

import httpx

from app.core.exceptions import Crawl4AiUnavailableError
from app.lib.jobs_scraper.rules import get_job_rejection_reasons
from app.lib.scraping.crawl4ai import normalize_job_url
from app.main import app
from app.modules.jobs_scraper.schemas import (
    DEFAULT_JOB_SCRAPER_CONFIG,
    DiscoveredJob,
    JobExtraction,
    ScanResult,
)
from app.modules.jobs_scraper.service import classify_scanned_jobs


@final
class JobsScraperTest(IsolatedAsyncioTestCase):
    @override
    def setUp(self) -> None:
        self.config = DEFAULT_JOB_SCRAPER_CONFIG.model_copy(deep=True)  # pyright: ignore[reportUninitializedInstanceVariable]
        self.now = datetime.fromisoformat("2026-08-02T14:00:00+08:00")  # pyright: ignore[reportUninitializedInstanceVariable]
        self.job = DiscoveredJob(  # pyright: ignore[reportUninitializedInstanceVariable]
            title="Mid-Level Full Stack Engineer",
            company="Example",
            location="Makati, Philippines",
            country="Philippines",
            work_mode="Hybrid",
            level="Mid",
            source="LinkedIn",
            url="https://www.linkedin.com/jobs/view/123",
            posted_date="2026-08-02",
            posted_at=None,
            posted_text="2 hours ago",
            summary="Build React and FastAPI products backed by PostgreSQL.",
            matched_skills=["React", "FastAPI", "PostgreSQL"],
        )

    def test_grades_and_normalizes_jobs(self) -> None:
        self.assertEqual(
            get_job_rejection_reasons(self.job, self.config, self.now), []
        )
        java_job = self.job.model_copy(
            update={"summary": f"{self.job.summary} Requires Java."}
        )
        self.assertTrue(
            any(
                'excluded technology "Java"' in reason
                for reason in get_job_rejection_reasons(
                    java_job, self.config, self.now
                )
            )
        )
        classified = classify_scanned_jobs(
            JobExtraction(jobs=[self.job], potential_jobs=[], rejected_jobs=[]),
            self.config,
            self.now,
        )
        self.assertEqual(classified[0][0], "MATCH")
        self.assertEqual(
            normalize_job_url(
                "https://www.linkedin.com/jobs/view/123?trackingId=abc",
                "LinkedIn",
            ),
            "https://www.linkedin.com/jobs/view/123",
        )

    async def test_scan_endpoint_returns_camel_case_json(self) -> None:
        result = ScanResult(
            scan_id="scan-1",
            scanned_at=self.now,
            document_count=0,
            jobs=[],
            source_issues=[],
        )

        with patch(
            "app.modules.jobs_scraper.router.scan_jobs",
            new=AsyncMock(return_value=result),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/jobs-scraper/scan",
                    json={
                        "scanId": "scan-1",
                        "scannedAt": self.now.isoformat(),
                        "config": self.config.model_dump(by_alias=True),
                    },
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["X-Jobs-Scan-Id"], "scan-1")
        self.assertEqual(response.json()["scanId"], "scan-1")
        self.assertEqual(response.json()["documentCount"], 0)

    async def test_scan_endpoint_maps_crawl4ai_failure(self) -> None:
        with patch(
            "app.modules.jobs_scraper.router.scan_jobs",
            new=AsyncMock(side_effect=Crawl4AiUnavailableError()),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                response = await client.post(
                    "/jobs-scraper/scan",
                    json={
                        "scanId": "scan-2",
                        "config": self.config.model_dump(by_alias=True),
                    },
                )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.headers["X-Jobs-Scan-Id"], "scan-2")
        self.assertEqual(
            response.json()["error"],
            "Crawl4AI is offline. Start the crawl4ai Docker service.",
        )

    async def test_scan_endpoint_does_not_hide_unexpected_failure(self) -> None:
        with patch(
            "app.modules.jobs_scraper.router.scan_jobs",
            new=AsyncMock(side_effect=RuntimeError("unexpected failure")),
        ):
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                with self.assertRaisesRegex(RuntimeError, "unexpected failure"):
                    _ = await client.post(
                        "/jobs-scraper/scan",
                        json={
                            "scanId": "scan-3",
                            "config": self.config.model_dump(by_alias=True),
                        },
                    )
