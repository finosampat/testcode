"""Phase 0: robots.txt + licensing checks and the compliance report."""

from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from .robots import RobotsDecision

COPYRIGHT_SIGNALS = (
    (r"all rights reserved", "all-rights-reserved"),
    (r"no one can copy, reproduce", "explicit-no-redistribution"),
    (r"without prior written permission", "written-permission-required"),
    (r"creative commons", "creative-commons"),
    (r"public domain", "public-domain"),
)


def scan_license_signals(text: str) -> list[str]:
    lowered = re.sub(r"<[^>]+>", " ", text).lower()
    return [name for pattern, name in COPYRIGHT_SIGNALS if re.search(pattern, lowered)]


@dataclass
class WorkCompliance:
    id: str
    title: str
    language: str
    sourceUrl: str
    fileUrls: list[str]
    licenseBasis: str
    redistribution: str
    robotsAllowed: bool
    blockedUrls: list[str] = field(default_factory=list)


@dataclass
class ComplianceReport:
    source: str
    entryUrl: str
    userAgent: str
    robotsUrl: str
    crawlDelaySeconds: float
    generatedAt: str
    termsUrls: list[str]
    licenseSignals: dict[str, list[str]]
    works: list[WorkCompliance] = field(default_factory=list)
    caveats: list[str] = field(default_factory=list)

    @property
    def bundling_cleared(self) -> bool:
        return bool(self.works) and all(w.redistribution == "permitted" for w in self.works)

    def to_json(self) -> str:
        payload = asdict(self)
        payload["bundlingCleared"] = self.bundling_cleared
        return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"

    def to_markdown(self) -> str:
        lines = [
            "# Compliance report",
            "",
            f"- **Source**: {self.source}",
            f"- **Entry URL**: {self.entryUrl}",
            f"- **Generated**: {self.generatedAt}",
            f"- **User-Agent**: `{self.userAgent}`",
            f"- **robots.txt**: {self.robotsUrl} (crawl-delay honored: {self.crawlDelaySeconds:g}s)",
            f"- **Terms reviewed**: {', '.join(self.termsUrls) or 'none'}",
            f"- **Cleared for redistribution / bundling**: {'yes' if self.bundling_cleared else 'NO'}",
            "",
            "## Licensing signals found on the source's terms pages",
            "",
        ]
        for url, signals in self.licenseSignals.items():
            lines.append(f"- {url}: {', '.join(signals) if signals else 'no recognized signal'}")
        lines += [
            "",
            "## Works",
            "",
            "| Work | Language | robots.txt | Redistribution | License basis |",
            "| --- | --- | --- | --- | --- |",
        ]
        for w in self.works:
            lines.append(
                f"| [{w.title}]({w.sourceUrl}) | {w.language} | "
                f"{'allowed' if w.robotsAllowed else 'BLOCKED'} | {w.redistribution} | {w.licenseBasis} |"
            )
        lines += ["", "## Fetched files", ""]
        for w in self.works:
            for url in w.fileUrls:
                lines.append(f"- {url}")
        lines += ["", "## Caveats and required manual review", ""]
        for caveat in self.caveats:
            lines.append(f"- {caveat}")
        lines.append("")
        return "\n".join(lines)


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def robots_caveats(decisions: list[RobotsDecision]) -> list[str]:
    blocked = [d.url for d in decisions if not d.allowed]
    if not blocked:
        return []
    return [f"robots.txt disallows {len(blocked)} URL(s); they were skipped: {', '.join(blocked[:5])}"]


def write_report(report: ComplianceReport, directory: Path) -> tuple[Path, Path]:
    directory.mkdir(parents=True, exist_ok=True)
    md = directory / "compliance-report.md"
    js = directory / "compliance-report.json"
    md.write_text(report.to_markdown(), encoding="utf-8")
    js.write_text(report.to_json(), encoding="utf-8")
    return md, js
