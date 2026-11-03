"""Ingestion pipeline: compliance check -> download -> extract -> normalized JSON."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .compliance import ComplianceReport, WorkCompliance, now_iso, robots_caveats, scan_license_signals, write_report
from .fetch import USER_AGENT, Fetcher
from .robots import RobotsPolicy
from .schema import Work, write_index, write_library, write_work
from .sources import get_source
from .sources.base import DocumentRef
from .sources.sai_satcharita import TERMS_URLS


@dataclass
class PipelineOptions:
    source: str
    cache_dir: Path
    content_dir: Path
    compliance_dir: Path
    languages: list[str] | None = None
    limit: int | None = None
    refresh: bool = False
    user_agent: str = USER_AGENT
    allow_uncleared_bundle: bool = False
    compliance_only: bool = False


def _select(refs: list[DocumentRef], options: PipelineOptions) -> list[DocumentRef]:
    selected = refs
    if options.languages:
        wanted = {code.lower() for code in options.languages}
        selected = [r for r in selected if r.language.lower() in wanted]
    if options.limit is not None:
        selected = selected[: options.limit]
    return selected


def run(options: PipelineOptions) -> tuple[ComplianceReport, list[Work]]:
    source = get_source(options.source)
    fetcher = Fetcher(options.cache_dir, user_agent=options.user_agent)

    # Phase 0a: robots.txt is fetched (uncached) before anything else is touched.
    policy = RobotsPolicy.fetch(source.entryUrl, options.user_agent, fetcher.text_uncached)
    fetcher.crawl_delay = policy.crawl_delay
    entry_decision = policy.can_fetch(source.entryUrl)
    if not entry_decision.allowed:
        raise SystemExit(f"robots.txt disallows {source.entryUrl} for {options.user_agent!r}; aborting")

    # Phase 0b: licensing statements.
    terms_urls = [url for url in TERMS_URLS if policy.can_fetch(url).allowed]
    signals: dict[str, list[str]] = {}
    for url in terms_urls:
        signals[url] = scan_license_signals(fetcher.text(url, refresh=options.refresh))

    refs = _select(source.discover(fetcher), options)

    decisions = [policy.can_fetch(url) for ref in refs for url in ref.fileUrls]
    compliance_entries: list[WorkCompliance] = []
    for ref in refs:
        license_info = source.license_for(ref)
        blocked = [url for url in ref.fileUrls if not policy.can_fetch(url).allowed]
        compliance_entries.append(
            WorkCompliance(
                id=ref.id,
                title=ref.title,
                language=ref.languageLabel or ref.language,
                sourceUrl=ref.pageUrl,
                fileUrls=list(ref.fileUrls),
                licenseBasis=license_info.basis,
                redistribution=license_info.redistribution,
                robotsAllowed=not blocked,
                blockedUrls=blocked,
            )
        )

    report = ComplianceReport(
        source=source.name,
        entryUrl=source.entryUrl,
        userAgent=options.user_agent,
        robotsUrl=policy.robots_url,
        crawlDelaySeconds=policy.crawl_delay,
        generatedAt=now_iso(),
        termsUrls=terms_urls,
        licenseSignals=signals,
        works=compliance_entries,
    )
    report.caveats.extend(robots_caveats(decisions))
    if not report.bundling_cleared:
        report.caveats.append(
            "Redistribution is NOT cleared: extracted text is written to the local content directory "
            "for development only and must not be published or shipped in an app store build until "
            "written permission from the rights holder is obtained (manual review required)."
        )
        report.caveats.append(
            "The app displays each work's license basis and attribution on its reader screen."
        )
    if options.compliance_only:
        write_report(report, options.compliance_dir)
        return report, []

    works: list[Work] = []
    for ref in refs:
        allowed_files = [url for url in ref.fileUrls if policy.can_fetch(url).allowed]
        if not allowed_files:
            continue
        local = [fetcher.binary(url, refresh=options.refresh) for url in allowed_files]
        work = source.build_work(ref, local)
        report.caveats.extend(f"{work.id}: {warning}" for warning in work.ingestionWarnings)
        if not any(chapter.body.strip() for chapter in work.chapters):
            report.caveats.append(f"{work.id}: no readable text extracted; work excluded from the app bundle")
            continue
        works.append(work)

    write_report(report, options.compliance_dir)

    if works and (report.bundling_cleared or options.allow_uncleared_bundle):
        works_dir = options.content_dir / "works"
        for work in works:
            write_work(work, works_dir)
        write_index(works, options.content_dir)
        write_library(works, options.content_dir)
    return report, works
