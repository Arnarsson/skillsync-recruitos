#!/usr/bin/env python3
"""
RecruitOS API Tester

A comprehensive testing script for all RecruitOS API endpoints.
Tests can be run against local, staging, or production environments.

Usage:
    python scripts/api_tester.py --env local
    python scripts/api_tester.py --env staging --report report.md
    python scripts/api_tester.py --env production --smoke-only

Environment Variables:
    BRIGHTDATA_API_KEY: API key for BrightData (required for most tests)
    GITHUB_TOKEN: GitHub API token (optional, increases rate limits)
    RECRUITOS_API_URL: Custom API base URL (overrides --env)
"""

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Optional
from urllib.parse import urlencode

try:
    import requests
except ImportError:
    print("Error: 'requests' library not installed.")
    print("Install it with: pip install requests")
    sys.exit(1)


# ============================================================
# CONFIGURATION
# ============================================================

ENVIRONMENTS = {
    "local": "http://localhost:3000",
    "staging": os.getenv("STAGING_URL", "https://staging.recruitos.app"),
    "production": os.getenv("PRODUCTION_URL", "https://recruitos.app"),
}

# Test data
TEST_LINKEDIN_URL = "https://www.linkedin.com/in/test-profile-12345/"
TEST_GITHUB_USERNAME = "octocat"  # GitHub's mascot - always exists
TEST_SEARCH_KEYWORD = "software engineer site:github.com"


# ============================================================
# DATA STRUCTURES
# ============================================================

@dataclass
class TestResult:
    """Result of a single test case."""
    name: str
    passed: bool
    duration_ms: float
    status_code: Optional[int] = None
    error: Optional[str] = None
    response_preview: Optional[str] = None
    details: dict = field(default_factory=dict)


@dataclass
class TestSuite:
    """Collection of test results."""
    name: str
    results: list[TestResult] = field(default_factory=list)
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None

    @property
    def passed(self) -> int:
        return sum(1 for r in self.results if r.passed)

    @property
    def failed(self) -> int:
        return sum(1 for r in self.results if not r.passed)

    @property
    def total(self) -> int:
        return len(self.results)

    @property
    def duration_ms(self) -> float:
        return sum(r.duration_ms for r in self.results)


# ============================================================
# API CLIENT
# ============================================================

class APIClient:
    """HTTP client for API testing."""

    def __init__(self, base_url: str, brightdata_key: Optional[str] = None, github_token: Optional[str] = None):
        self.base_url = base_url.rstrip("/")
        self.brightdata_key = brightdata_key
        self.github_token = github_token
        self.session = requests.Session()

    def _headers(self, api_type: str = "brightdata") -> dict:
        headers = {"Content-Type": "application/json"}
        if api_type == "brightdata" and self.brightdata_key:
            headers["X-BrightData-Key"] = self.brightdata_key
        if api_type == "github" and self.github_token:
            headers["X-GitHub-Token"] = self.github_token
        return headers

    def get(self, path: str, params: Optional[dict] = None, api_type: str = "brightdata") -> requests.Response:
        url = f"{self.base_url}{path}"
        if params:
            url = f"{url}?{urlencode(params)}"
        return self.session.get(url, headers=self._headers(api_type), timeout=60)

    def post(self, path: str, params: Optional[dict] = None, body: Optional[dict] = None, api_type: str = "brightdata") -> requests.Response:
        url = f"{self.base_url}{path}"
        if params:
            url = f"{url}?{urlencode(params)}"
        return self.session.post(url, headers=self._headers(api_type), json=body, timeout=60)


# ============================================================
# TEST CASES
# ============================================================

def test_health_check(client: APIClient) -> TestResult:
    """Test that API is reachable."""
    start = time.time()
    try:
        # Try to hit the API with an invalid action to verify it's responding
        response = client.get("/api/brightdata", {"action": "health"})
        duration = (time.time() - start) * 1000

        # We expect a 400 error for invalid action, which means API is working
        if response.status_code == 400:
            return TestResult(
                name="Health Check",
                passed=True,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview="API responding correctly (400 for invalid action)",
            )
        elif response.status_code == 200:
            return TestResult(
                name="Health Check",
                passed=True,
                duration_ms=duration,
                status_code=response.status_code,
            )
        else:
            return TestResult(
                name="Health Check",
                passed=False,
                duration_ms=duration,
                status_code=response.status_code,
                error=f"Unexpected status: {response.status_code}",
            )
    except requests.RequestException as e:
        return TestResult(
            name="Health Check",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_brightdata_trigger_validation(client: APIClient) -> TestResult:
    """Test that trigger action validates input correctly."""
    start = time.time()
    try:
        # Missing URL should fail validation
        response = client.post("/api/brightdata", {"action": "trigger"})
        duration = (time.time() - start) * 1000

        if response.status_code == 400:
            data = response.json()
            has_error_code = "code" in data or "error" in data
            return TestResult(
                name="Trigger Validation (missing URL)",
                passed=has_error_code,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=json.dumps(data)[:200],
            )
        return TestResult(
            name="Trigger Validation (missing URL)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error="Expected 400, got different status",
        )
    except Exception as e:
        return TestResult(
            name="Trigger Validation (missing URL)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_brightdata_trigger_invalid_url(client: APIClient) -> TestResult:
    """Test that trigger action rejects non-LinkedIn URLs."""
    start = time.time()
    try:
        response = client.post("/api/brightdata", {"action": "trigger", "url": "https://google.com"})
        duration = (time.time() - start) * 1000

        if response.status_code == 400:
            return TestResult(
                name="Trigger Validation (invalid URL)",
                passed=True,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview="Correctly rejected non-LinkedIn URL",
            )
        return TestResult(
            name="Trigger Validation (invalid URL)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error="Should reject non-LinkedIn URLs",
        )
    except Exception as e:
        return TestResult(
            name="Trigger Validation (invalid URL)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_brightdata_auth_required(client: APIClient) -> TestResult:
    """Test that trigger requires API key."""
    start = time.time()
    try:
        # Create a client without API key
        no_auth_client = APIClient(client.base_url)
        response = no_auth_client.post("/api/brightdata", {"action": "trigger", "url": TEST_LINKEDIN_URL})
        duration = (time.time() - start) * 1000

        if response.status_code == 401:
            return TestResult(
                name="Auth Required (trigger)",
                passed=True,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview="Correctly returns 401 without API key",
            )
        return TestResult(
            name="Auth Required (trigger)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error=f"Expected 401, got {response.status_code}",
        )
    except Exception as e:
        return TestResult(
            name="Auth Required (trigger)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_scrape_tier1(client: APIClient) -> TestResult:
    """Test Tier 1 scraping (direct fetch)."""
    start = time.time()
    try:
        response = client.post(
            "/api/brightdata",
            {"action": "scrape"},
            {"url": "https://example.com", "tier": "1"}
        )
        duration = (time.time() - start) * 1000

        if response.status_code == 200:
            data = response.json()
            has_content = "content" in data or ("data" in data and "content" in data.get("data", {}))
            return TestResult(
                name="Scrape Tier 1 (example.com)",
                passed=has_content,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=f"Content length: {len(data.get('content', data.get('data', {}).get('content', '')))} chars",
            )
        return TestResult(
            name="Scrape Tier 1 (example.com)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error=f"Expected 200, got {response.status_code}",
        )
    except Exception as e:
        return TestResult(
            name="Scrape Tier 1 (example.com)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_github_user(client: APIClient) -> TestResult:
    """Test GitHub user endpoint."""
    start = time.time()
    try:
        response = client.get(
            "/api/github",
            {"action": "user", "username": TEST_GITHUB_USERNAME},
            api_type="github"
        )
        duration = (time.time() - start) * 1000

        if response.status_code == 200:
            data = response.json()
            # Check for expected fields
            user_data = data.get("data", data)
            has_login = "login" in user_data or "user" in data
            return TestResult(
                name="GitHub User (octocat)",
                passed=has_login,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=f"User: {user_data.get('login', user_data.get('name', 'unknown'))}",
            )
        return TestResult(
            name="GitHub User (octocat)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error=f"Expected 200, got {response.status_code}",
        )
    except Exception as e:
        return TestResult(
            name="GitHub User (octocat)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_github_repos(client: APIClient) -> TestResult:
    """Test GitHub repos endpoint."""
    start = time.time()
    try:
        response = client.get(
            "/api/github",
            {"action": "repos", "username": TEST_GITHUB_USERNAME},
            api_type="github"
        )
        duration = (time.time() - start) * 1000

        if response.status_code == 200:
            data = response.json()
            repo_data = data.get("data", data)
            has_repos = "repos" in repo_data or "total" in repo_data
            return TestResult(
                name="GitHub Repos (octocat)",
                passed=has_repos,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=f"Repos: {repo_data.get('total', len(repo_data.get('repos', [])))}",
            )
        return TestResult(
            name="GitHub Repos (octocat)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error=f"Expected 200, got {response.status_code}",
        )
    except Exception as e:
        return TestResult(
            name="GitHub Repos (octocat)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_github_full(client: APIClient) -> TestResult:
    """Test GitHub full profile endpoint."""
    start = time.time()
    try:
        response = client.get(
            "/api/github",
            {"action": "full", "username": TEST_GITHUB_USERNAME},
            api_type="github"
        )
        duration = (time.time() - start) * 1000

        if response.status_code == 200:
            data = response.json()
            profile = data.get("data", data)
            has_user = "user" in profile
            has_repos = "repos" in profile
            has_languages = "languages" in profile
            return TestResult(
                name="GitHub Full Profile (octocat)",
                passed=has_user and has_repos,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=f"Quality score: {profile.get('qualityScore', 'N/A')}",
                details={
                    "hasUser": has_user,
                    "hasRepos": has_repos,
                    "hasLanguages": has_languages,
                },
            )
        return TestResult(
            name="GitHub Full Profile (octocat)",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error=f"Expected 200, got {response.status_code}",
        )
    except Exception as e:
        return TestResult(
            name="GitHub Full Profile (octocat)",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


def test_invalid_action(client: APIClient) -> TestResult:
    """Test that invalid actions are rejected."""
    start = time.time()
    try:
        response = client.get("/api/brightdata", {"action": "invalid_action"})
        duration = (time.time() - start) * 1000

        if response.status_code == 400:
            data = response.json()
            has_error = "error" in data
            return TestResult(
                name="Invalid Action Rejection",
                passed=has_error,
                duration_ms=duration,
                status_code=response.status_code,
                response_preview=data.get("error", "")[:100],
            )
        return TestResult(
            name="Invalid Action Rejection",
            passed=False,
            duration_ms=duration,
            status_code=response.status_code,
            error="Expected 400 for invalid action",
        )
    except Exception as e:
        return TestResult(
            name="Invalid Action Rejection",
            passed=False,
            duration_ms=(time.time() - start) * 1000,
            error=str(e),
        )


# ============================================================
# TEST RUNNER
# ============================================================

def run_smoke_tests(client: APIClient) -> TestSuite:
    """Run quick smoke tests to verify API is working."""
    suite = TestSuite(name="Smoke Tests")
    suite.started_at = datetime.now()

    print("\n🔥 Running Smoke Tests...\n")

    tests = [
        test_health_check,
        test_invalid_action,
        test_scrape_tier1,
        test_github_user,
    ]

    for test_fn in tests:
        print(f"  Testing: {test_fn.__doc__}...", end=" ")
        result = test_fn(client)
        suite.results.append(result)
        print("✅" if result.passed else f"❌ {result.error}")

    suite.finished_at = datetime.now()
    return suite


def run_full_tests(client: APIClient) -> TestSuite:
    """Run comprehensive API tests."""
    suite = TestSuite(name="Full API Tests")
    suite.started_at = datetime.now()

    print("\n🧪 Running Full API Tests...\n")

    tests = [
        # Health & basic
        test_health_check,
        test_invalid_action,
        # BrightData validation
        test_brightdata_trigger_validation,
        test_brightdata_trigger_invalid_url,
        test_brightdata_auth_required,
        # Scraping
        test_scrape_tier1,
        # GitHub
        test_github_user,
        test_github_repos,
        test_github_full,
    ]

    for test_fn in tests:
        print(f"  {test_fn.__name__}...", end=" ")
        result = test_fn(client)
        suite.results.append(result)
        status = "✅" if result.passed else "❌"
        print(f"{status} ({result.duration_ms:.0f}ms)")
        if not result.passed and result.error:
            print(f"    Error: {result.error}")

    suite.finished_at = datetime.now()
    return suite


# ============================================================
# REPORTING
# ============================================================

def generate_report(suite: TestSuite, env: str) -> str:
    """Generate a markdown test report."""
    report = f"""# API Test Report

**Environment:** {env}
**Date:** {suite.started_at.isoformat() if suite.started_at else 'N/A'}
**Duration:** {suite.duration_ms:.0f}ms

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | {suite.total} |
| Passed | {suite.passed} ✅ |
| Failed | {suite.failed} ❌ |
| Pass Rate | {(suite.passed / suite.total * 100):.1f}% |

## Results

| Test | Status | Duration | Notes |
|------|--------|----------|-------|
"""

    for result in suite.results:
        status = "✅ Pass" if result.passed else "❌ Fail"
        notes = result.error or result.response_preview or "-"
        report += f"| {result.name} | {status} | {result.duration_ms:.0f}ms | {notes[:50]} |\n"

    if suite.failed > 0:
        report += "\n## Failed Tests Details\n\n"
        for result in suite.results:
            if not result.passed:
                report += f"""### {result.name}

- **Status Code:** {result.status_code or 'N/A'}
- **Error:** {result.error or 'Unknown'}
- **Response:** {result.response_preview or 'N/A'}

"""

    return report


def print_summary(suite: TestSuite) -> None:
    """Print test summary to console."""
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {suite.name}")
    print("=" * 50)
    print(f"  Total:  {suite.total}")
    print(f"  Passed: {suite.passed} ✅")
    print(f"  Failed: {suite.failed} ❌")
    print(f"  Rate:   {(suite.passed / suite.total * 100):.1f}%")
    print(f"  Time:   {suite.duration_ms:.0f}ms")
    print("=" * 50)


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="RecruitOS API Tester",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--env",
        choices=["local", "staging", "production"],
        default="local",
        help="Environment to test against (default: local)",
    )
    parser.add_argument(
        "--url",
        help="Custom API base URL (overrides --env)",
    )
    parser.add_argument(
        "--smoke-only",
        action="store_true",
        help="Run only smoke tests (quick verification)",
    )
    parser.add_argument(
        "--report",
        help="Output file for markdown report",
    )
    parser.add_argument(
        "--brightdata-key",
        help="BrightData API key (or set BRIGHTDATA_API_KEY env var)",
    )
    parser.add_argument(
        "--github-token",
        help="GitHub API token (or set GITHUB_TOKEN env var)",
    )

    args = parser.parse_args()

    # Determine base URL
    if args.url:
        base_url = args.url
        env_name = "custom"
    else:
        base_url = ENVIRONMENTS[args.env]
        env_name = args.env

    # Get API keys
    brightdata_key = args.brightdata_key or os.getenv("BRIGHTDATA_API_KEY")
    github_token = args.github_token or os.getenv("GITHUB_TOKEN")

    print(f"\n🚀 RecruitOS API Tester")
    print(f"   Environment: {env_name}")
    print(f"   Base URL: {base_url}")
    print(f"   BrightData Key: {'✅ Set' if brightdata_key else '❌ Not set'}")
    print(f"   GitHub Token: {'✅ Set' if github_token else '⚠️  Not set (limited rate)'}")

    # Create client
    client = APIClient(base_url, brightdata_key, github_token)

    # Run tests
    if args.smoke_only:
        suite = run_smoke_tests(client)
    else:
        suite = run_full_tests(client)

    # Print summary
    print_summary(suite)

    # Generate report if requested
    if args.report:
        report = generate_report(suite, env_name)
        with open(args.report, "w") as f:
            f.write(report)
        print(f"\n📝 Report saved to: {args.report}")

    # Exit with appropriate code
    sys.exit(0 if suite.failed == 0 else 1)


if __name__ == "__main__":
    main()
