"""Source adapter interface.

Adding a new source means implementing :class:`SourceAdapter` and registering it
in :mod:`hindu_texts_ingest.sources`. Nothing else in the pipeline (and nothing
at all in the app) changes.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Protocol

from ..fetch import Fetcher
from ..schema import License, Work


@dataclass
class DocumentRef:
    """One work as advertised by a source, before any PDF is downloaded."""

    id: str
    title: str
    category: str
    language: str
    languageLabel: str
    pageUrl: str
    fileUrls: list[str]
    script: str | None = None
    author: str | None = None
    headingPatterns: tuple[str, ...] | None = None
    fallbackHeading: str = "Text"
    metadata: dict[str, str] = field(default_factory=dict)


class SourceAdapter(Protocol):
    slug: str
    name: str
    entryUrl: str

    def discover(self, fetcher: Fetcher) -> list[DocumentRef]:
        """Return every work linked from the source's entry page."""

    def license_for(self, ref: DocumentRef) -> License:
        """Redistribution basis recorded for a work."""

    def attribution_for(self, ref: DocumentRef) -> str:
        """Human-readable attribution string shown in the app."""

    def build_work(self, ref: DocumentRef, local_files: list[Path]) -> Work:
        """Normalize downloaded files into a :class:`Work`."""
