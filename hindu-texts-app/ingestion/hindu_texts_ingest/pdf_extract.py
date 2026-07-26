"""PDF text extraction and chapter segmentation.

Chapter detection is driven by regexes supplied by the source adapter, so a new
source only has to describe how its headings look.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import fitz  # PyMuPDF

from .schema import Chapter

# Patterns are matched against a single stripped line.
DEFAULT_HEADING_PATTERNS = (
    r"^CHAPTER\s+[IVXLC\d]+\.?\b.*$",
    r"^Chapter\s+[IVXLC\d]+\.?\b.*$",
    r"^अध्याय\s*[०-९\d]+.*$",
    r"^ADHYAY\s*\d+.*$",
)

_LIGATURE_FIXES = {"\ufb01": "fi", "\ufb02": "fl", "\u00a0": " "}


def read_pages(path: Path) -> list[str]:
    with fitz.open(path) as document:
        return [page.get_text("text") for page in document]


def clean_text(text: str) -> str:
    for bad, good in _LIGATURE_FIXES.items():
        text = text.replace(bad, good)
    # Join words hyphenated across a line break.
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    lines = [line.rstrip() for line in text.split("\n")]
    return "\n".join(lines)


def strip_page_artifacts(page_text: str) -> str:
    """Drop standalone page numbers and repeated running headers."""
    kept = []
    for line in page_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            kept.append("")
            continue
        if re.fullmatch(r"[-–—\s]*\(?\d{1,4}\)?[-–—\s]*", stripped):
            continue
        if re.fullmatch(r"[०-९\s]{1,6}", stripped):
            continue
        kept.append(stripped)
    return "\n".join(kept)


def paragraphs(text: str) -> str:
    """Re-flow hard-wrapped lines into paragraphs for long-form reading."""
    blocks: list[list[str]] = [[]]
    for line in text.split("\n"):
        if not line.strip():
            if blocks[-1]:
                blocks.append([])
            continue
        blocks[-1].append(line.strip())
    out = []
    for block in blocks:
        if block:
            out.append(" ".join(block))
    return "\n\n".join(out).strip()


DEVANAGARI = re.compile(r"[\u0900-\u097F]")
LEGACY_ENCODING_HINT = (
    "PDF uses a non-Unicode (legacy) Indic font encoding: extracted text is mojibake and was skipped"
)
NO_TEXT_LAYER_HINT = "PDF has no text layer (scanned images); OCR is required before it can be ingested"


@dataclass
class Assessment:
    usable: bool
    reason: str | None
    chars: int
    indic_ratio: float
    page_count: int


def assess(path: Path, expected_script: str | None = None, sample_pages: int = 25) -> Assessment:
    """Decide whether a PDF's text layer is good enough to ingest.

    Scanned PDFs have no text at all; several of the source's Indic PDFs embed
    legacy 8-bit Devanagari fonts, which extract as Latin mojibake.
    """
    pages = read_pages(path)
    sample = "".join(pages[:sample_pages])
    letters = [c for c in sample if c.isalpha()]
    indic = sum(1 for c in letters if DEVANAGARI.match(c))
    ratio = indic / len(letters) if letters else 0.0
    chars = len(sample.strip())
    if chars < 200:
        return Assessment(False, NO_TEXT_LAYER_HINT, chars, ratio, len(pages))
    if expected_script == "Deva" and ratio < 0.2:
        return Assessment(False, LEGACY_ENCODING_HINT, chars, ratio, len(pages))
    return Assessment(True, None, chars, ratio, len(pages))


@dataclass
class ExtractionResult:
    chapters: list[Chapter]
    detected_headings: int
    page_count: int


def extract_chapters(
    path: Path,
    heading_patterns: tuple[str, ...] = DEFAULT_HEADING_PATTERNS,
    fallback_heading: str = "Text",
    max_heading_words: int = 14,
    min_chapter_chars: int = 500,
) -> ExtractionResult:
    compiled = [re.compile(p) for p in heading_patterns]
    pages = read_pages(path)
    body_lines: list[str] = []
    for page in pages:
        body_lines.extend(strip_page_artifacts(clean_text(page)).split("\n"))

    sections: list[tuple[str, list[str]]] = []
    for line in body_lines:
        stripped = line.strip()
        is_heading = bool(stripped) and len(stripped.split()) <= max_heading_words and any(
            pattern.match(stripped) for pattern in compiled
        )
        if is_heading:
            sections.append((stripped, []))
        elif sections:
            sections[-1][1].append(line)
        else:
            sections.append((fallback_heading, [line]))

    detected = sum(1 for heading, _ in sections if heading != fallback_heading)
    chapters: list[Chapter] = []
    for heading, lines in sections:
        body = paragraphs("\n".join(lines))
        if not body:
            continue
        # Table-of-contents rows match the heading patterns too, but carry almost
        # no text; fold them into the preceding section instead of inventing chapters.
        if chapters and len(body) < min_chapter_chars:
            previous = chapters[-1]
            chapters[-1] = Chapter(
                heading=previous.heading,
                body=f"{previous.body}\n\n{heading}\n{body}".strip(),
                order=previous.order,
            )
            continue
        chapters.append(Chapter(heading=heading, body=body, order=len(chapters)))
    if not chapters:
        chapters = [Chapter(heading=fallback_heading, body="", order=0)]
    return ExtractionResult(chapters=chapters, detected_headings=detected, page_count=len(pages))
