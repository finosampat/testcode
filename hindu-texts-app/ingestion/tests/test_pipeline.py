from pathlib import Path

import fitz
import pytest

from hindu_texts_ingest.compliance import scan_license_signals
from hindu_texts_ingest.fetch import Fetcher
from hindu_texts_ingest.pdf_extract import assess, extract_chapters
from hindu_texts_ingest.robots import RobotsPolicy
from hindu_texts_ingest.schema import Chapter, License, Work, slugify, write_library
from hindu_texts_ingest.sources import get_source
from hindu_texts_ingest.sources.base import DocumentRef
from hindu_texts_ingest.sources.sai_satcharita import SaiSatcharitaSource, _label_from_url

ROBOTS = """
User-agent: *
Crawl-delay: 10
Disallow: /admin/
Disallow: /search/
"""


def make_pdf(path: Path, pages: list[str]) -> Path:
    document = fitz.open()
    for text in pages:
        page = document.new_page()
        page.insert_textbox(fitz.Rect(50, 50, 550, 780), text, fontsize=11)
    document.save(path)
    document.close()
    return path


def test_robots_allows_content_and_blocks_admin():
    policy = RobotsPolicy.fetch(
        "https://example.org/en/page", "TestBot/1.0", lambda url: ROBOTS, default_crawl_delay=1.0
    )
    assert policy.crawl_delay == 10
    assert policy.can_fetch("https://example.org/en/sai-satcharita").allowed
    assert policy.can_fetch("https://example.org/sites/default/files/x.pdf").allowed
    assert not policy.can_fetch("https://example.org/admin/config").allowed


def test_license_signals_detect_all_rights_reserved():
    signals = scan_license_signals("<p>All rights reserved. No one can copy, reproduce or distribute.</p>")
    assert "all-rights-reserved" in signals
    assert "explicit-no-redistribution" in signals


def test_extract_chapters_detects_headings(tmp_path: Path):
    pdf = make_pdf(
        tmp_path / "book.pdf",
        [
            "CHAPTER I\nFirst line of the chapter\ncontinues here\n" + "body one. " * 80 + "\n1",
            "CHAPTER II\nSecond chapter body\n" + "body two. " * 80 + "\n2",
        ],
    )
    result = extract_chapters(pdf)
    assert [chapter.heading for chapter in result.chapters] == ["CHAPTER I", "CHAPTER II"]
    assert "First line of the chapter continues here" in result.chapters[0].body
    assert result.detected_headings == 2


def test_extract_chapters_falls_back_without_headings(tmp_path: Path):
    pdf = make_pdf(tmp_path / "plain.pdf", ["just some prose without any heading"])
    result = extract_chapters(pdf, fallback_heading="Text")
    assert len(result.chapters) == 1
    assert result.chapters[0].heading == "Text"


def test_encode_url_handles_native_scripts():
    encoded = Fetcher.encode_url("https://sai.org.in/en/sai-satcharitra/ଓଡ଼ିଆ")
    assert encoded.isascii()
    assert encoded.startswith("https://sai.org.in/en/sai-satcharitra/%")


def test_source_license_is_not_redistributable():
    source: SaiSatcharitaSource = get_source("sai-satcharita")  # type: ignore[assignment]
    ref = DocumentRef(
        id="sai-satcharita-en-x",
        title="Shri Sai Satcharita (English)",
        category="Charitras",
        language="en",
        languageLabel="English",
        pageUrl="https://sai.org.in/en/sai-satcharitra/english-shree-sai-satcharita",
        fileUrls=["https://sai.org.in/sites/default/files/Shree%20Saisatcharit%20English.pdf"],
    )
    license_info = source.license_for(ref)
    assert license_info.redistribution == "prohibited"
    assert "Shri Saibaba Sansthan Trust" in (license_info.holder or "")
    assert source.attribution_for(ref).startswith("Source: Shri Saibaba Sansthan Trust")


def test_label_from_url():
    assert _label_from_url("https://x/sai-samarth-charita-english-chapter1.pdf") == "Chapter 1"
    assert _label_from_url("https://x/sai-charitra-marathi-adhyay-05.pdf") == "Adhyay 5"
    assert _label_from_url("https://x/sai-samarth-charita-english-preface.pdf") == "Preface"


def test_assess_rejects_pdf_without_text_layer(tmp_path: Path):
    document = fitz.open()
    document.new_page()
    path = tmp_path / "scan.pdf"
    document.save(path)
    document.close()
    assessment = assess(path)
    assert not assessment.usable
    assert "no text layer" in (assessment.reason or "")


def test_assess_rejects_legacy_devanagari_encoding(tmp_path: Path):
    pdf = make_pdf(tmp_path / "legacy.pdf", ["gmB am_ AÝ gVm| go ^Q " * 60])
    assert assess(pdf, expected_script="Deva").usable is False
    assert assess(pdf, expected_script="Latn").usable is True


def test_work_rejects_unknown_category():
    with pytest.raises(ValueError):
        Work(
            id="x",
            title="X",
            category="Novels",
            language="en",
            chapters=[],
            sourceUrl="https://example.org",
            license=License(basis="public domain", redistribution="permitted"),
        )


def test_write_library_groups_works(tmp_path: Path):
    work = Work(
        id="w1",
        title="Sample",
        category="Literature",
        language="en",
        chapters=[Chapter(heading="One", body="body", order=0)],
        sourceUrl="https://example.org",
        license=License(basis="public domain", redistribution="permitted"),
    )
    path = write_library([work], tmp_path)
    assert path.name == "library.generated.json"
    assert '"works"' in path.read_text(encoding="utf-8")


def test_slugify():
    assert slugify("Shri Sai Satcharita (Hindi)") == "shri-sai-satcharita-hindi"
