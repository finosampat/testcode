"""Adapter for the Shri Saibaba Sansthan Trust e-library (Satcharita PDFs).

Entry page: https://sai.org.in/en/sai-satcharita
Each "Know more" link leads to a per-language page that links one or more PDFs.
"""

from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import unquote, urlsplit

from ..fetch import Fetcher
from ..pdf_extract import DEFAULT_HEADING_PATTERNS, assess, extract_chapters
from ..schema import Chapter, License, Work, slugify
from .base import DocumentRef

BASE_URL = "https://sai.org.in"
ENTRY_URL = f"{BASE_URL}/en/sai-satcharita"
TERMS_URLS = (
    f"{BASE_URL}/en/terms-and-disclaimer",
    f"{BASE_URL}/en/terms-and-conditions",
)

# Native-script title -> (BCP-47 code, English label, script)
LANGUAGE_TABLE: dict[str, tuple[str, str, str]] = {
    "telugu": ("te", "Telugu", "Telu"),
    "odia": ("or", "Odia", "Orya"),
    "ଓଡ଼ିଆ": ("or", "Odia", "Orya"),
    "hindi": ("hi", "Hindi", "Deva"),
    "marathi": ("mr", "Marathi", "Deva"),
    "konkani": ("kok", "Konkani", "Deva"),
    "sindhi": ("sd", "Sindhi", "Arab"),
    "nepali": ("ne", "Nepali", "Deva"),
    "kannada": ("kn", "Kannada", "Knda"),
    "kannad": ("kn", "Kannada", "Knda"),
    "bengali": ("bn", "Bengali", "Beng"),
    "gujarati": ("gu", "Gujarati", "Gujr"),
    "gujrathi": ("gu", "Gujarati", "Gujr"),
    "tamil": ("ta", "Tamil", "Taml"),
    "malayalam": ("ml", "Malayalam", "Mlym"),
    "malyalam": ("ml", "Malayalam", "Mlym"),
    "punjabi": ("pa", "Punjabi", "Guru"),
    "english": ("en", "English", "Latn"),
}

HEADING_PATTERNS = DEFAULT_HEADING_PATTERNS + (
    r"^EPILOGUE\b.*$",
    r"^PREFACE\b.*$",
    r"^INTRODUCTION\b.*$",
    r"^प्रस्तावना\s*$",
    r"^उपोद्घात\s*$",
)

_ROW_RE = re.compile(
    r'<h3 class="title">(?P<title>.*?)</h3>\s*<a href="(?P<href>[^"]+)"',
    re.S,
)
_PDF_RE = re.compile(r'href="(?P<url>[^"]+\.pdf)"', re.I)
_TAG_RE = re.compile(r"<[^>]+>")


def _text(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(_TAG_RE.sub(" ", fragment))).strip()


def _resolve(href: str) -> str:
    if href.startswith("http"):
        return href
    if href.startswith("/"):
        return BASE_URL + href
    # Relative to the /en/ section, matching how the site renders these links.
    return f"{BASE_URL}/en/{href.lstrip('./')}"


def _label_from_url(url: str) -> str:
    """Turn ".../sai-samarth-charita-english-chapter1.pdf" into "Chapter 1"."""
    stem = unquote(Path(urlsplit(url).path).name).rsplit(".", 1)[0]
    stem = re.sub(r"^(sai[-_ ]?)?(samarth[-_ ]?)?(satcharit\w*|charitra|charita)?[-_ ]*", "", stem, flags=re.I)
    stem = re.sub(r"(english|hindi|marathi)[-_ ]*", "", stem, flags=re.I)
    stem = re.sub(r"[-_]+", " ", stem).strip()
    stem = re.sub(r"(chapter|adhyay)\s*0*(\d+)", lambda m: f"{m.group(1).title()} {int(m.group(2))}", stem, flags=re.I)
    return stem.title() if stem.islower() else stem or "Text"


def _language_of(title: str) -> tuple[str, str, str]:
    lowered = title.lower()
    for key, value in LANGUAGE_TABLE.items():
        if key in lowered:
            return value
    return ("und", title, None)  # type: ignore[return-value]


class SaiSatcharitaSource:
    slug = "sai-satcharita"
    name = "Shri Saibaba Sansthan Trust e-library"
    entryUrl = ENTRY_URL

    def discover(self, fetcher: Fetcher) -> list[DocumentRef]:
        index_html = fetcher.text(self.entryUrl)
        refs: list[DocumentRef] = []
        seen_pages: set[str] = set()
        for match in _ROW_RE.finditer(index_html):
            title = _text(match.group("title"))
            page_url = _resolve(match.group("href"))
            if not title or page_url in seen_pages:
                continue
            seen_pages.add(page_url)
            code, label, script = _language_of(title)
            try:
                page_html = fetcher.text(page_url)
            except Exception as error:  # noqa: BLE001 - one unreachable page must not abort the run
                print(f"warning: skipping {page_url}: {error}")
                continue
            file_urls: list[str] = []
            for pdf in _PDF_RE.finditer(page_html):
                url = html.unescape(pdf.group("url"))
                url = url if url.startswith("http") else _resolve(url)
                if url not in file_urls:
                    file_urls.append(url)
            if not file_urls:
                continue
            refs.append(
                DocumentRef(
                    id=f"{self.slug}-{code}-{slugify(title)}",
                    title=self._work_title(title, label),
                    category="Charitras",
                    language=code,
                    languageLabel=label,
                    script=script,
                    author="Govind Raghunath Dabholkar (Hemadpant)",
                    pageUrl=page_url,
                    fileUrls=file_urls,
                    headingPatterns=HEADING_PATTERNS,
                    fallbackHeading="Text",
                    metadata={"sourceTitle": title},
                )
            )
        return refs

    @staticmethod
    def _work_title(raw_title: str, label: str) -> str:
        cleaned = re.sub(r"\s+", " ", raw_title).strip()
        if "samarth" in cleaned.lower():
            return f"Shree Sai Samarth Charita ({label})"
        return f"Shri Sai Satcharita ({label})"

    def license_for(self, ref: DocumentRef) -> License:
        return License(
            basis="All rights reserved - Shri Saibaba Sansthan Trust, Shirdi (no redistribution permission located)",
            redistribution="prohibited",
            holder="Shri Saibaba Sansthan Trust, Shirdi",
            termsUrl=TERMS_URLS[0],
            notes=(
                "The Trust's copyright statement forbids copying, reproduction and distribution of "
                "website content without prior written permission. Text is ingested for local "
                "development only; obtain written permission before publishing this content."
            ),
        )

    def attribution_for(self, ref: DocumentRef) -> str:
        return (
            "Source: Shri Saibaba Sansthan Trust, Shirdi - "
            f"{ref.pageUrl}. Copyright (c) Shri Saibaba Sansthan Trust, Shirdi."
        )

    def build_work(self, ref: DocumentRef, local_files: list[Path]) -> Work:
        chapters: list[Chapter] = []
        warnings: list[str] = []
        # Works split across several PDFs are one chapter per file; a single PDF
        # holds the whole book and is segmented by heading detection.
        per_file_chapters = len(ref.fileUrls) > 1
        for path, url in zip(local_files, ref.fileUrls, strict=False):
            assessment = assess(path, expected_script=ref.script)
            if not assessment.usable:
                warnings.append(f"{url}: {assessment.reason}")
                continue
            result = extract_chapters(
                path,
                heading_patterns=ref.headingPatterns or DEFAULT_HEADING_PATTERNS,
                fallback_heading=ref.fallbackHeading,
            )
            if per_file_chapters:
                body = "\n\n".join(
                    part for chapter in result.chapters for part in (chapter.body,) if part.strip()
                )
                if body:
                    chapters.append(Chapter(heading=_label_from_url(url), body=body, order=len(chapters)))
                continue
            for chapter in result.chapters:
                if not chapter.body.strip():
                    continue
                chapters.append(Chapter(heading=chapter.heading, body=chapter.body, order=len(chapters)))
        return Work(
            id=ref.id,
            title=ref.title,
            category=ref.category,
            language=ref.language,
            languageLabel=ref.languageLabel,
            script=ref.script,
            author=ref.author,
            chapters=chapters,
            sourceUrl=ref.pageUrl,
            license=self.license_for(ref),
            attribution=self.attribution_for(ref),
            sourceFiles=list(ref.fileUrls),
            ingestionWarnings=warnings,
        )
