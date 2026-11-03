"""Generic content schema shared by every ingestion source and by the app.

The app never knows which source a work came from: it only reads the
normalized JSON documents described here, so new sources (other PDFs, sites,
scans) can be added without touching any UI code.
"""

from __future__ import annotations

import dataclasses
import json
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1

CATEGORIES = ("Charitras", "Vedas", "Upanishads", "Puranas", "Literature")


@dataclass
class Chapter:
    heading: str
    body: str
    order: int = 0


@dataclass
class License:
    """Redistribution basis for a work.

    ``redistribution`` is deliberately a tri-state string rather than a bool so
    that unresolved cases stay visible instead of defaulting to "allowed".
    """

    basis: str
    redistribution: str = "unknown"  # "permitted" | "prohibited" | "unknown"
    holder: str | None = None
    notes: str | None = None
    termsUrl: str | None = None

    def __post_init__(self) -> None:
        allowed = {"permitted", "prohibited", "unknown"}
        if self.redistribution not in allowed:
            raise ValueError(f"redistribution must be one of {sorted(allowed)}")


@dataclass
class Work:
    id: str
    title: str
    category: str
    language: str
    chapters: list[Chapter]
    sourceUrl: str
    license: License
    languageLabel: str | None = None
    script: str | None = None
    attribution: str | None = None
    author: str | None = None
    sourceFiles: list[str] = field(default_factory=list)
    ingestionWarnings: list[str] = field(default_factory=list)
    schemaVersion: int = SCHEMA_VERSION

    def __post_init__(self) -> None:
        if self.category not in CATEGORIES:
            raise ValueError(f"unknown category {self.category!r}; expected one of {CATEGORIES}")

    def to_dict(self) -> dict[str, Any]:
        return dataclasses.asdict(self)


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_only).strip("-")
    return slug or "work"


def write_work(work: Work, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / f"{work.id}.json"
    path.write_text(json.dumps(work.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_library(works: list[Work], directory: Path, filename: str = "library.generated.json") -> Path:
    """Write the single aggregate file the app bundles for offline reading."""
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / filename
    payload = {
        "schemaVersion": SCHEMA_VERSION,
        "categories": list(CATEGORIES),
        "works": [w.to_dict() for w in sorted(works, key=lambda w: (w.category, w.title))],
    }
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def write_index(works: list[Work], directory: Path) -> Path:
    """Write the lightweight catalog the app loads on startup."""
    directory.mkdir(parents=True, exist_ok=True)
    entries = [
        {
            "id": w.id,
            "title": w.title,
            "category": w.category,
            "language": w.language,
            "languageLabel": w.languageLabel or w.language,
            "script": w.script,
            "author": w.author,
            "chapterCount": len(w.chapters),
            "sourceUrl": w.sourceUrl,
            "license": dataclasses.asdict(w.license),
        }
        for w in sorted(works, key=lambda w: (w.category, w.title))
    ]
    path = directory / "index.json"
    payload = {"schemaVersion": SCHEMA_VERSION, "categories": list(CATEGORIES), "works": entries}
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path
