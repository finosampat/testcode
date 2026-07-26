from __future__ import annotations

import argparse
from pathlib import Path

from .fetch import USER_AGENT
from .pipeline import PipelineOptions, run

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CACHE = PROJECT_ROOT / "ingestion" / ".cache"
DEFAULT_CONTENT = PROJECT_ROOT / "app" / "assets" / "content"
DEFAULT_COMPLIANCE = PROJECT_ROOT / "compliance"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="hindu-texts-ingest",
        description="Fetch, verify and normalize source texts into the app's content schema.",
    )
    parser.add_argument("--source", default="sai-satcharita", help="registered source slug")
    parser.add_argument("--languages", nargs="*", help="BCP-47 codes to ingest (default: all discovered)")
    parser.add_argument("--limit", type=int, help="ingest at most N works (useful for smoke tests)")
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--content-dir", type=Path, default=DEFAULT_CONTENT)
    parser.add_argument("--compliance-dir", type=Path, default=DEFAULT_COMPLIANCE)
    parser.add_argument("--refresh", action="store_true", help="ignore the download cache")
    parser.add_argument("--user-agent", default=USER_AGENT)
    parser.add_argument(
        "--compliance-only",
        action="store_true",
        help="run Phase 0 (robots.txt + licensing) and write the report without downloading PDFs",
    )
    parser.add_argument(
        "--allow-uncleared-bundle",
        action="store_true",
        help="write normalized JSON into the app even when redistribution is not cleared (local dev only)",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    report, works = run(
        PipelineOptions(
            source=args.source,
            cache_dir=args.cache_dir,
            content_dir=args.content_dir,
            compliance_dir=args.compliance_dir,
            languages=args.languages,
            limit=args.limit,
            refresh=args.refresh,
            user_agent=args.user_agent,
            allow_uncleared_bundle=args.allow_uncleared_bundle,
            compliance_only=args.compliance_only,
        )
    )
    print(f"compliance report -> {args.compliance_dir / 'compliance-report.md'}")
    print(f"works discovered: {len(report.works)}; redistribution cleared: {report.bundling_cleared}")
    for work in works:
        print(f"  {work.id}: {len(work.chapters)} chapters ({work.languageLabel})")
    if works and not report.bundling_cleared and not args.allow_uncleared_bundle:
        print(
            "normalized JSON was NOT written: redistribution is not cleared. "
            "Re-run with --allow-uncleared-bundle for local development only."
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
